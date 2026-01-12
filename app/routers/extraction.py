"""Gene/protein extraction router"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import document_processor
from app.services.bio_extractor import extract_genes_and_relations

router = APIRouter()


class ExtractionRequest(BaseModel):
    document_ids: list[str] | None = None
    model: str | None = None


class Entity(BaseModel):
    name: str
    type: str
    aliases: list[str] = []
    description: str = ""


class Relation(BaseModel):
    source: str
    target: str
    type: str
    description: str = ""
    evidence: str = ""


class ExtractionResponse(BaseModel):
    entities: list[Entity]
    relations: list[Relation]
    model_used: str
    documents_used: int
    parse_error: bool = False


@router.post("/genes", response_model=ExtractionResponse)
async def extract_genes(request: ExtractionRequest):
    """Extract genes/proteins and their relationships from documents"""
    
    # Get document text
    text = document_processor.get_combined_text(request.document_ids)
    
    if not text:
        raise HTTPException(
            status_code=400,
            detail="No documents available. Please upload documents first."
        )
    
    # Extract genes and relations
    result = await extract_genes_and_relations(text, model=request.model)
    
    # Count documents used
    if request.document_ids:
        docs_used = len(request.document_ids)
    else:
        docs_used = len(document_processor.get_all_documents())
    
    # Parse entities
    entities = []
    for e in result.get("entities", []):
        if isinstance(e, dict):
            entities.append(Entity(
                name=e.get("name", "Unknown"),
                type=e.get("type", "unknown"),
                aliases=e.get("aliases", []),
                description=e.get("description", "")
            ))
    
    # Parse relations
    relations = []
    for r in result.get("relations", []):
        if isinstance(r, dict):
            relations.append(Relation(
                source=r.get("source", ""),
                target=r.get("target", ""),
                type=r.get("type", "unknown"),
                description=r.get("description", ""),
                evidence=r.get("evidence", "")
            ))
    
    return ExtractionResponse(
        entities=entities,
        relations=relations,
        model_used=request.model or "default",
        documents_used=docs_used,
        parse_error=result.get("parse_error", False)
    )
