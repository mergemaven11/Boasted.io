from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def _as_utc(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value.replace(tzinfo=value.tzinfo or timezone.utc).astimezone(timezone.utc)
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError:
            return None
        return parsed.replace(tzinfo=parsed.tzinfo or timezone.utc).astimezone(timezone.utc)
    return None


def migrate_receipt_verification_privacy(db, *, now: datetime | None = None) -> dict[str, int]:
    """Move legacy verifier contact data out of Impact Receipt confirmation arrays.

    The migration is idempotent. Active pending requests keep working because their
    hashed token/contact payload is copied into the TTL-backed request collection.
    Expired or unusable pending confirmations are removed. Completed confirmations
    retain only the minimal attestation fields stored on the receipt.
    """

    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    receipts = db["impact_receipts"]
    requests = db["receipt_verification_requests"]
    stats = {
        "receipts_updated": 0,
        "active_requests_migrated": 0,
        "expired_pending_removed": 0,
        "orphan_pending_removed": 0,
        "completed_records_minimized": 0,
    }

    requests.delete_many({"expires_at": {"$lte": now}})

    for receipt in receipts.find({"confirmations": {"$exists": True}}):
        receipt_id = str(receipt.get("_id"))
        user_id = str(receipt.get("user_id") or "")
        original = receipt.get("confirmations", []) or []
        migrated: list[dict[str, Any]] = []
        changed = False

        for raw in original:
            item = dict(raw)
            status = str(item.get("status") or "").lower()

            if status == "pending":
                expires_at = _as_utc(item.get("expires_at"))
                if not expires_at or expires_at <= now:
                    stats["expired_pending_removed"] += 1
                    changed = True
                    continue

                token_hash = str(item.pop("token_hash", "") or "")
                email = str(item.pop("email", "") or "").lower().strip()
                message = str(item.pop("message", "") or "")
                confirmation_id = str(item.get("id") or "")
                if not token_hash or not email or not confirmation_id:
                    stats["orphan_pending_removed"] += 1
                    changed = True
                    continue

                request_doc = {
                    "receipt_id": receipt_id,
                    "user_id": user_id,
                    "confirmation_id": confirmation_id,
                    "email": email,
                    "message": message,
                    "token_hash": token_hash,
                    "requested_at": _as_utc(item.get("requested_at")) or now,
                    "expires_at": expires_at,
                }
                requests.update_one(
                    {"receipt_id": receipt_id, "email": email},
                    {"$set": request_doc},
                    upsert=True,
                )
                stats["active_requests_migrated"] += 1
                changed = changed or any(key in raw for key in ("email", "message", "token_hash"))
                migrated.append(item)
                continue

            sensitive_present = any(key in item for key in ("email", "message", "token_hash", "expires_at"))
            item.pop("email", None)
            item.pop("message", None)
            item.pop("token_hash", None)
            item.pop("expires_at", None)
            if sensitive_present:
                stats["completed_records_minimized"] += 1
                changed = True
            migrated.append(item)

        if changed or migrated != original:
            receipts.update_one(
                {"_id": receipt["_id"]},
                {"$set": {"confirmations": migrated, "updated_at": now}},
            )
            stats["receipts_updated"] += 1

    return stats
