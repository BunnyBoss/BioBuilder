"""Models router - list available LLM models"""
from fastapi import APIRouter
from app.services.llm_client import list_models

router = APIRouter()


@router.get("")
async def get_models():
    """Get list of available LLM models from LiteLLM proxy"""
    models = await list_models()
    return {"models": models}
