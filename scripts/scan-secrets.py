#!/usr/bin/env python3
"""Fail when tracked files or Git history contain likely credential material."""

from __future__ import annotations

import argparse
import fnmatch
import re
import subprocess
import sys
from pathlib import Path

MAX_BLOB_BYTES = 2_000_000
CONTENT_ALLOWLIST = {"frontend/src/ndaSafety.test.js"}

SECRET_RULES = (
    ("private-key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
    ("aws-access-key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("github-token", re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b")),
    ("github-fine-grained-token", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b")),
    ("slack-token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{20,}\b")),
    ("stripe-live-key", re.compile(r"\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b")),
    ("stripe-webhook-secret", re.compile(r"\bwhsec_[A-Za-z0-9]{20,}\b")),
    ("google-api-key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
    (
        "mongodb-auth-uri",
        re.compile(r"mongodb(?:\+srv)?://[^\s/'\"]+:[^@\s/'\"]+@", re.IGNORECASE),
    ),
)

SENSITIVE_BASENAMES = {"id_rsa", "id_ed25519", ".npmrc", ".pypirc", ".netrc"}
SENSITIVE_GLOBS = (
    "credentials*.json",
    "service-account*.json",
    "service_account*.json",
    "client_secret*.json",
    "*.pem",
    "*.key",
    "*.p12",
    "*.pfx",
)


def run(*args: str) -> str:
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def is_sensitive_path(path: str) -> bool:
    name = Path(path).name.lower()
    if name == ".env":
        return True
    if name.startswith(".env.") and not name.endswith(".example"):
        return True
    if name in SENSITIVE_BASENAMES:
        return True
    return any(fnmatch.fnmatch(name, pattern) for pattern in SENSITIVE_GLOBS)


def scan_text(path: str, text: str, findings: set[tuple[str, str]]) -> None:
    if path in CONTENT_ALLOWLIST:
        return
    for rule_name, pattern in SECRET_RULES:
        if pattern.search(text):
            findings.add((path, rule_name))


def current_tree_scan(findings: set[tuple[str, str]]) -> None:
    tracked = run("git", "ls-files", "-z").split("\0")
    for path in filter(None, tracked):
        if is_sensitive_path(path):
            findings.add((path, "sensitive-filename"))
            continue
        try:
            data = Path(path).read_bytes()
        except OSError:
            continue
        if len(data) > MAX_BLOB_BYTES or b"\0" in data:
            continue
        scan_text(path, data.decode("utf-8", errors="ignore"), findings)


def historical_path_scan(findings: set[tuple[str, str]]) -> None:
    paths = run("git", "log", "--all", "--format=", "--name-only").splitlines()
    for path in set(filter(None, paths)):
        if is_sensitive_path(path):
            findings.add((path, "historical-sensitive-filename"))


def historical_blob_scan(findings: set[tuple[str, str]]) -> None:
    object_paths: dict[str, set[str]] = {}
    for line in run("git", "rev-list", "--objects", "--all").splitlines():
        sha, sep, path = line.partition(" ")
        if sep and path:
            object_paths.setdefault(sha, set()).add(path)

    proc = subprocess.Popen(
        ["git", "cat-file", "--batch"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
    )
    assert proc.stdin is not None and proc.stdout is not None
    try:
        for sha, paths in object_paths.items():
            visible_paths = sorted(path for path in paths if path not in CONTENT_ALLOWLIST)
            if not visible_paths:
                continue
            proc.stdin.write(f"{sha}\n".encode())
            proc.stdin.flush()
            header = proc.stdout.readline().decode("utf-8", errors="replace").strip().split()
            if len(header) < 3:
                continue
            _object_sha, object_type, size_text = header[:3]
            try:
                size = int(size_text)
            except ValueError:
                continue
            data = proc.stdout.read(size)
            proc.stdout.read(1)
            if object_type != "blob" or size > MAX_BLOB_BYTES or b"\0" in data:
                continue
            text = data.decode("utf-8", errors="ignore")
            representative = visible_paths[0]
            scan_text(representative, text, findings)
    finally:
        proc.stdin.close()
        proc.stdout.close()
        proc.wait(timeout=10)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--history", action="store_true", help="scan all reachable refs and historical blobs")
    args = parser.parse_args()

    findings: set[tuple[str, str]] = set()
    current_tree_scan(findings)
    if args.history:
        historical_path_scan(findings)
        historical_blob_scan(findings)

    if findings:
        print("Secret scan failed. Potential credential material was detected:")
        for path, rule in sorted(findings):
            print(f"- {path}: {rule}")
        print("Values are intentionally omitted from logs. Remove/rotate real credentials or explicitly review safe fixtures.")
        return 1

    scope = "current tree + reachable Git history" if args.history else "current tree"
    print(f"Secret scan passed: {scope} contains no high-confidence credential findings.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
