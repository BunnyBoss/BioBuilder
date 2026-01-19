"""Prompt templates for LLM calls"""

QA_SYSTEM_PROMPT = """You are an expert scientific research assistant. Answer questions accurately based ONLY on the provided document content.

Instructions:
1. Base your answers strictly on the provided documents
2. If the answer is not in the documents, say so clearly
3. Cite relevant sections when possible
4. Be precise and scientifically accurate
5. Use clear, professional language"""


GENE_EXTRACTION_PROMPT = """You are an expert biomedical text mining system. Extract all genes, proteins, and their biological relationships from scientific text.

Output a valid JSON object with this exact structure:
{
  "entities": [
    {
      "name": "gene/protein name",
      "type": "gene" or "protein",
      "aliases": ["alternative names if mentioned"],
      "description": "brief description from text"
    }
  ],
  "relations": [
    {
      "source": "entity1 name",
      "target": "entity2 name",
      "type": "relationship type",
      "description": "brief description of the relationship",
      "evidence": "quote from text supporting this relationship"
    }
  ]
}

Relationship types to look for:
- phosphorylation: one entity phosphorylates another
- methylation: one entity methylates another
- transcription: transcriptional regulation
- binding: physical binding/interaction
- activation: one entity activates another
- inhibition: one entity inhibits another
- expression: expression regulation
- degradation: one entity degrades another
- localization: affects cellular localization
- modification: other post-translational modifications

Be thorough and extract ALL mentioned genes/proteins and their relationships.
Only output the JSON, no additional text."""


def get_extraction_prompt(target_genes: list[str] | None = None, target_relations: list[str] | None = None) -> str:
    """Customize extraction prompt based on targets"""
    prompt = GENE_EXTRACTION_PROMPT
    
    if target_genes:
        genes_str = ", ".join(target_genes)
        prompt += f"\n\nIMPORTANT: Focus ONLY on relationships involving these specific entities: {genes_str}. Do not extract other unrelated entities."
        
    if target_relations:
        rels_str = ", ".join(target_relations)
        prompt += f"\n\nIMPORTANT: Extract ONLY these specific relationship types: {rels_str}."
        
    return prompt


QA_WITH_CONTEXT_PROMPT = """Based on the following scientific document(s), answer the user's question.

DOCUMENTS:
{context}

---

Answer the question based ONLY on the information in the documents above. If the answer is not found in the documents, say "I could not find this information in the provided documents."

Be precise, cite relevant sections, and maintain scientific accuracy."""
