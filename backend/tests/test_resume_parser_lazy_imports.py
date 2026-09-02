"""Document this first-party Python module."""
from __future__ import annotations

import ast
from pathlib import Path

from app import resume_builder_routes as routes


HEAVY_RESUME_MODULES = {"fitz", "pymupdf", "pypdf", "docx"}


def _top_level_import_roots(source: str) -> set[str]:
    """Handle top level import roots.

    Args:
        source: Function argument.

    Returns:
        Function result.
    """
    tree = ast.parse(source)
    imported: set[str] = set()
    for node in tree.body:
        if isinstance(node, ast.Import):
            imported.update(alias.name.split(".", 1)[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            imported.add(node.module.split(".", 1)[0])
    return imported


def test_resume_route_defers_heavy_document_parser_imports_until_upload_processing():
    """Verify resume route defers heavy document parser imports until upload processing."""
    source = Path(routes.__file__).read_text(encoding="utf-8")

    assert HEAVY_RESUME_MODULES.isdisjoint(_top_level_import_roots(source))
    assert "import pymupdf" in source
    assert "from pypdf import PdfReader" in source
    assert "from docx import Document" in source
    assert "import fitz" not in source


def test_plain_text_resume_import_does_not_require_document_parser_libraries():
    """Verify plain text resume import does not require document parser libraries."""
    text = routes._extract_uploaded_text("resume.txt", "text/plain", b"Platform engineer with Python and Docker experience")

    assert text == "Platform engineer with Python and Docker experience"
