"""Legal Document Drafting Agent using PydanticAI.

This agent generates legal documents from natural language descriptions.
Supports various document types (lawsuits, complaints, contracts, etc.).

Langfuse integration follows the official pattern:
- Uses instrument=True for automatic OpenTelemetry tracing
- Traces are automatically exported to Langfuse
- See: https://langfuse.com/integrations/frameworks/pydantic-ai
"""

import time
from typing import Any

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

from ..config import get_settings
from ..langfuse_init import is_langfuse_enabled, update_current_trace


class DocumentSection(BaseModel):
    """A section within a generated legal document."""

    title: str = Field(..., description="Title of the section")
    content: str = Field(..., description="Content of the section")
    order: int = Field(..., description="Order of the section in the document")


class DraftMetadata(BaseModel):
    """Metadata about the generated document."""

    document_type: str = Field(..., description="Type of document generated")
    word_count: int = Field(..., description="Estimated word count")
    placeholder_count: int = Field(
        ...,
        description="Number of placeholders that need to be filled",
    )
    sections_count: int = Field(..., description="Number of sections")
    language: str = Field(default="pl", description="Document language")


class DraftResult(BaseModel):
    """Complete result from document generation."""

    content: str = Field(
        ...,
        description="The generated legal document content in Markdown format.",
    )
    sections: list[DocumentSection] = Field(
        default_factory=list,
        description="List of document sections with structure",
    )
    metadata: DraftMetadata = Field(
        ...,
        description="Metadata about the generated document",
    )
    place_holders: list[str] = Field(
        default_factory=list,
        description="List of placeholders that need to be filled",
    )
    quality_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Quality score of the generated document",
    )


# Document templates for structure guidance
DOCUMENT_TEMPLATES: dict[str, dict[str, Any]] = {
    "LAWSUIT": {
        "required_sections": [
            "Nagłówek",
            "Wnioskodawca",
            "Wnioskowany",
            "Miejsce i data",
            "Powództwo",
            "Uzasadnienie faktyczne",
            "Uzasadnienie prawne",
            "Wnioski",
            "Podpis",
        ],
        "structure_hint": "Formal court document with clear plaintiff/defendant structure",
    },
    "COMPLAINT": {
        "required_sections": [
            "Nagłówek",
            "Skarżący",
            "Skarżony",
            "Miejsce i data",
            "Przedmiot skargi",
            "Uzasadnienie",
            "Wnioski",
            "Podpis",
        ],
        "structure_hint": "Administrative complaint following formal procedures",
    },
    "CONTRACT": {
        "required_sections": [
            "Tytuł umowy",
            "Strony umowy",
            "Przedmiot umowy",
            "Czas trwania",
            "Cena i płatność",
            "Postanowienia ogólne",
            "Podpisy",
        ],
        "structure_hint": "Bilateral agreement with mutual obligations",
    },
    "OTHER": {
        "required_sections": [
            "Nagłówek",
            "Treść",
            "Podpis",
        ],
        "structure_hint": "General legal document structure",
    },
}


def get_template_for_document_type(document_type: str) -> dict[str, Any]:
    """Get template structure for a given document type.

    Args:
        document_type: The type of document

    Returns:
        Dictionary with required sections and structure hints
    """
    doc_type_upper = document_type.upper()
    return DOCUMENT_TEMPLATES.get(
        doc_type_upper,
        DOCUMENT_TEMPLATES["OTHER"],
    )


SYSTEM_PROMPT = """You are an expert Polish lawyer (Radca Prawny) with extensive experience in legal drafting.

Your task is to draft precise, professional legal documents in Polish following these guidelines:

## Document Structure
- Follow the structure appropriate for the requested document type
- Use clear section headings in Polish
- Ensure logical flow of information
- Include all legally required sections

## Formatting
- Use Markdown for formatting
- Ensure all placeholders for missing information are clearly marked (e.g., [NAZWISKO], [DATA])
- Use proper indentation for nested information
- Maintain professional spacing and layout

## Legal Terminology
- Use formal legal Polish terminology
- Reference specific legal bases where applicable (e.g., "na podstawie art. 471 § 1 Kodeksu cywilnego")
- Use precise legal language appropriate for the document type

## Quality Standards
- Ensure completeness of all required sections
- Maintain professional tone throughout
- Check for consistency in names, dates, and references
- Include appropriate legal citations

## Output Format
Your response must include:
1. The complete document content in Markdown
2. A list of sections with their titles and content
3. Metadata about the document (type, word count, placeholders)
4. A quality assessment score

When generating documents, be thorough but practical. Focus on creating documents that are legally sound and ready for use after filling in placeholders."""


def get_drafting_agent() -> Agent:
    """Get or create the drafting agent.

    Lazy-loads the agent to avoid OpenAI client initialization errors
    when OPENAI_API_KEY is not configured.

    Returns:
        Agent with instrument=True for automatic Langfuse tracing
    """
    settings = get_settings()
    return Agent(
        OpenAIModel(settings.OPENAI_MODEL),
        system_prompt=SYSTEM_PROMPT,
        instrument=True,  # Enable automatic Langfuse tracing
    )


# Global variable for memoization
_drafting_agent: Agent | None = None


def drafting_agent() -> Agent:
    """Get the singleton drafting agent instance."""
    global _drafting_agent
    if _drafting_agent is None:
        _drafting_agent = get_drafting_agent()
    return _drafting_agent


async def generate_document(
    document_type: str,
    description: str,
    context: dict[str, Any] | None = None,
    session_id: str = "default",
    user_id: str | None = None,
) -> tuple[DraftResult, dict[str, Any]]:
    """Generate a legal document from natural language description.

    This function wraps the drafting agent with Langfuse observability.
    The agent itself uses instrument=True for automatic tracing.

    Args:
        document_type: Type of document to generate (lawsuit, complaint, etc.)
        description: Natural language description of the document
        context: Additional context variables
        session_id: Session ID for tracking
        user_id: User ID for observability

    Returns:
        Tuple of (draft result, metadata dict)
    """
    start_time = time.time()
    settings = get_settings()

    # Update current trace with metadata
    if is_langfuse_enabled():
        update_current_trace(
            name="document_generation",
            input={
                "document_type": document_type,
                "description": description[:200],
            },
            user_id=user_id,
            session_id=session_id,
            metadata={
                "description_length": len(description),
                "model": settings.OPENAI_MODEL,
            },
        )

    try:
        agent = drafting_agent()

        # Get template information for this document type
        template_info = get_template_for_document_type(document_type)

        # Build enhanced prompt with template guidance
        template_sections = "\n".join(
            f"- {section}" for section in template_info["required_sections"]
        )

        user_prompt = f"""Please draft a legal document with the following specifications:

## Document Type
{document_type}

## Structure Guidance
Required sections for this document type:
{template_sections}

{template_info['structure_hint']}

## Description
{description}

## Additional Context
{context or {}}

## Instructions
1. Follow the required sections structure for this document type
2. Use formal Polish legal terminology
3. Mark all missing information with clear placeholders in brackets (e.g., [NAZWISKO], [DATA], [KWOTA])
4. Format the document in Markdown
5. Provide a quality assessment based on completeness and legal soundness

Generate the complete document with all requested metadata."""

        result = await agent.run(user_prompt, output_type=DraftResult)
        draft = result.output

        processing_time_ms = (time.time() - start_time) * 1000

        metadata = {
            "processing_time_ms": processing_time_ms,
            "model": settings.OPENAI_MODEL,
            "document_type": document_type,
            "content_length": len(draft.content),
            "quality_score": draft.quality_score,
            "placeholder_count": len(draft.place_holders),
        }

        # Update trace with output
        if is_langfuse_enabled():
            update_current_trace(
                output={
                    "document_type": document_type,
                    "content_length": len(draft.content),
                    "quality_score": draft.quality_score,
                    "placeholder_count": len(draft.place_holders),
                    "processing_time_ms": processing_time_ms,
                }
            )

        return draft, metadata

    except Exception as e:
        # Error is automatically tracked by PydanticAI's instrumentation
        raise
