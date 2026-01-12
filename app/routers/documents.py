"""Document management router"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services import document_processor

router = APIRouter()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a scientific document (PDF or TXT)"""
    # Validate file type
    filename = file.filename or "unknown"
    ext = filename.lower().split(".")[-1] if "." in filename else ""
    
    if ext not in ["pdf", "txt", "text"]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and TXT files are supported"
        )
    
    # Read content
    content = await file.read()
    
    # Process document
    result = await document_processor.process_document(filename, content)
    
    return {
        "success": True,
        "document": result
    }


@router.get("")
async def list_documents():
    """List all uploaded documents"""
    docs = document_processor.get_all_documents()
    return {"documents": docs}


@router.get("/{doc_id}")
async def get_document(doc_id: str):
    """Get document details by ID"""
    doc = document_processor.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": doc["id"],
        "filename": doc["filename"],
        "char_count": doc["char_count"],
        "word_count": doc["word_count"],
        "text_preview": doc["text"][:500] + "..." if len(doc["text"]) > 500 else doc["text"]
    }


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document"""
    if document_processor.delete_document(doc_id):
        return {"success": True, "message": "Document deleted"}
    raise HTTPException(status_code=404, detail="Document not found")
