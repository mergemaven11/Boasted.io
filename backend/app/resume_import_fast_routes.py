"""Optimized resume import route for common born-digital resumes."""
from __future__ import annotations

from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from app.auth import get_current_user
from app.plans import require_feature
from app.resume_builder_routes import MAX_RESUME_BYTES, MAX_RESUME_PAGES
from app.resume_import_parser import parse_existing_resume_text

router = APIRouter(prefix="/resume-builder", tags=["resume-builder"])


def _pdf_text_fast(data: bytes) -> str:
    """Use PyMuPDF first and invoke the slower fallback only for sparse output."""
    primary = ""
    try:
        import pymupdf
        lines: list[str] = []
        with pymupdf.open(stream=data, filetype="pdf") as document:
            if document.page_count > MAX_RESUME_PAGES:
                raise HTTPException(status_code=400, detail=f"Resume PDFs can contain up to {MAX_RESUME_PAGES} pages")
            for page in document:
                for *_, text, _block_no, _block_type in page.get_text("blocks", sort=True):
                    cleaned = "\n".join(part.strip() for part in str(text or "").splitlines() if part.strip())
                    if cleaned:
                        lines.append(cleaned)
        primary = "\n".join(lines).strip()
    except HTTPException:
        raise
    except Exception:
        primary = ""

    # A normal one-page resume with searchable text easily clears this threshold.
    # Avoid a second full PDF pass unless the primary extractor is suspiciously sparse.
    if len(primary) >= 220 and len(primary.splitlines()) >= 6:
        return primary

    try:
        from pypdf import PdfReader
        reader = PdfReader(BytesIO(data))
        if len(reader.pages) > MAX_RESUME_PAGES:
            raise HTTPException(status_code=400, detail=f"Resume PDFs can contain up to {MAX_RESUME_PAGES} pages")
        secondary = "\n".join((page.extract_text() or "") for page in reader.pages).strip()
    except HTTPException:
        raise
    except Exception:
        secondary = ""

    return secondary if len(secondary) > len(primary) else primary


def _extract_fast(filename: str, content_type: str, data: bytes) -> str:
    suffix = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if content_type == "application/pdf" or suffix == ".pdf":
        return _pdf_text_fast(data)
    if content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or suffix == ".docx":
        from docx import Document
        document = Document(BytesIO(data))
        paragraphs = [paragraph.text for paragraph in document.paragraphs]
        table_rows = [" | ".join(cell.text for cell in row.cells) for table in document.tables for row in table.rows]
        return "\n".join([*paragraphs, *table_rows]).strip()
    if content_type == "text/plain" or suffix == ".txt":
        return data.decode("utf-8", errors="replace").strip()
    raise HTTPException(status_code=415, detail="Upload a PDF, DOCX, or TXT resume")


def _parse_file(filename: str, content_type: str, data: bytes) -> dict:
    text = _extract_fast(filename, content_type, data).strip()
    if len(text) < 20:
        raise HTTPException(
            status_code=400,
            detail="We could not find enough readable text in that resume. If it is a scanned/image-only PDF, export a text-searchable PDF or DOCX and try again.",
        )
    parsed = parse_existing_resume_text(text)
    return {
        "filename": filename,
        "text": parsed["text"],
        "raw_text": parsed.get("raw_text", text),
        "summary": parsed["summary"],
        "bullets": parsed["bullets"],
        "skills": parsed["skills"],
        "sections_found": parsed["sections_found"],
        "sections": parsed.get("sections", {}),
        "header_lines": parsed.get("header_lines", []),
        "contact": parsed.get("contact", {}),
        "experience": parsed.get("experience", []),
        "parse_warnings": parsed.get("parse_warnings", []),
        "source_signals": parsed.get("source_signals", {}),
        "line_count": parsed["line_count"],
    }


@router.post("/import-fast")
async def import_resume_fast(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    require_feature(current_user, "resume_builder")
    filename = (file.filename or "resume").strip()[:240]
    data = await file.read(MAX_RESUME_BYTES + 1)
    if len(data) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=413, detail="Resume file must be 5 MB or smaller")
    if not data:
        raise HTTPException(status_code=400, detail="Resume file is empty")
    try:
        return await run_in_threadpool(_parse_file, filename, file.content_type or "", data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="We could not read that resume. Try exporting it as a fresh PDF or DOCX.") from exc
