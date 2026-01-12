"""Q&A router"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import document_processor
from app.services.llm_client import chat_completion
from app.utils.prompts import QA_WITH_CONTEXT_PROMPT

router = APIRouter()


class QuestionRequest(BaseModel):
    question: str
    document_ids: list[str] | None = None
    model: str | None = None


class QuestionResponse(BaseModel):
    answer: str
    model_used: str
    documents_used: int


@router.post("/ask", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """Ask a question about the uploaded documents"""
    
    # Get document text
    context = document_processor.get_combined_text(request.document_ids)
    
    if not context:
        raise HTTPException(
            status_code=400,
            detail="No documents available. Please upload documents first."
        )
    
    # Prepare prompt with context
    system_prompt = QA_WITH_CONTEXT_PROMPT.format(context=context)
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": request.question}
    ]
    
    # Get answer from LLM
    answer = await chat_completion(messages, model=request.model)
    
    # Count documents used
    if request.document_ids:
        docs_used = len(request.document_ids)
    else:
        docs_used = len(document_processor.get_all_documents())
    
    return QuestionResponse(
        answer=answer,
        model_used=request.model or "default",
        documents_used=docs_used
    )
