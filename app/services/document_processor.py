"""Document processing service"""
from pathlib import Path
from PyPDF2 import PdfReader
import uuid
import json
from app.config import UPLOAD_DIR

# In-memory document store (for simplicity)
_documents: dict[str, dict] = {}


def extract_text_from_pdf(file_path: Path) -> str:
    """Extract text content from PDF file"""
    reader = PdfReader(str(file_path))
    text_parts = []
    
    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text)
    
    return "\n\n".join(text_parts)


def extract_text_from_txt(file_path: Path) -> str:
    """Extract text content from text file"""
    return file_path.read_text(encoding="utf-8")


async def process_document(filename: str, content: bytes) -> dict:
    """Process uploaded document and store it"""
    doc_id = str(uuid.uuid4())[:8]
    
    # Determine file extension
    ext = Path(filename).suffix.lower()
    
    # Save file
    file_path = UPLOAD_DIR / f"{doc_id}_{filename}"
    file_path.write_bytes(content)
    
    # Extract text based on file type
    if ext == ".pdf":
        text = extract_text_from_pdf(file_path)
    elif ext in [".txt", ".text"]:
        text = extract_text_from_txt(file_path)
    else:
        # Try as text
        text = content.decode("utf-8", errors="ignore")
    
    # Store document
    doc = {
        "id": doc_id,
        "filename": filename,
        "path": str(file_path),
        "text": text,
        "char_count": len(text),
        "word_count": len(text.split())
    }
    _documents[doc_id] = doc
    
    return {
        "id": doc_id,
        "filename": filename,
        "char_count": doc["char_count"],
        "word_count": doc["word_count"]
    }


def get_document(doc_id: str) -> dict | None:
    """Get document by ID"""
    return _documents.get(doc_id)


def get_all_documents() -> list[dict]:
    """Get all documents (without full text)"""
    return [
        {
            "id": doc["id"],
            "filename": doc["filename"],
            "char_count": doc["char_count"],
            "word_count": doc["word_count"]
        }
        for doc in _documents.values()
    ]


def delete_document(doc_id: str) -> bool:
    """Delete document by ID"""
    if doc_id in _documents:
        doc = _documents.pop(doc_id)
        # Delete file
        try:
            Path(doc["path"]).unlink()
        except:
            pass
        return True
    return False


def get_combined_text(doc_ids: list[str] | None = None) -> str:
    """Get combined text from specified documents (or all if none specified)"""
    if doc_ids:
        docs = [_documents.get(doc_id) for doc_id in doc_ids if doc_id in _documents]
    else:
        docs = list(_documents.values())
    
    if not docs:
        return ""
    
    parts = []
    for doc in docs:
        parts.append(f"=== Document: {doc['filename']} ===\n{doc['text']}")
    
    return "\n\n".join(parts)
