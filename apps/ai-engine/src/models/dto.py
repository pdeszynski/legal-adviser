"""Data Transfer Object (DTO) models for AI Engine API.

This module contains structured Pydantic models for API request/response validation.
These models provide type safety and validation for data exchanged between the frontend
and AI Engine.

Leaf types are declared before composite types to avoid initialization errors.
See CLAUDE.md "TypeScript Input/Output Type Declaration Order" section.
"""

import uuid
from enum import Enum

from pydantic import BaseModel, Field, field_validator

# -----------------------------------------------------------------------------
# Enums
# -----------------------------------------------------------------------------


class ClarificationQuestionType(str, Enum):
    """Types of clarification questions.

    Each type represents a category of information that may be needed
    to provide accurate legal guidance.
    """

    TIMELINE = "timeline"
    PARTIES = "parties"
    DOCUMENTS = "documents"
    AMOUNTS = "amounts"
    JURISDICTION = "jurisdiction"
    PREVIOUS_ACTIONS = "previous_actions"
    CONTRACT_DETAILS = "contract_details"
    EMPLOYMENT_DETAILS = "employment_details"
    DAMAGES = "damages"
    OTHER = "other"


# -----------------------------------------------------------------------------
# Leaf DTOs - must be declared before composite types
# -----------------------------------------------------------------------------


class ClarificationQuestionDto(BaseModel):
    """A single clarification question DTO.

    This model represents a follow-up question sent to the user when
    more information is needed to provide accurate legal guidance.

    Attributes:
        question_id: Unique identifier for this question (UUID v4)
        question_text: The actual question text to display to the user
        question_type: Category of information being requested
        hint: Optional helpful hint or example for answering
        options: Optional predefined choices for multiple-choice questions
    """

    question_id: str = Field(
        ...,
        description="Unique identifier for this question (UUID v4 format)",
        min_length=36,
        max_length=36,
    )
    question_text: str = Field(
        ...,
        description="The specific question text to display to the user",
        min_length=5,
    )
    question_type: ClarificationQuestionType = Field(
        ...,
        description="Type of information needed (e.g., timeline, parties, documents)",
    )
    hint: str | None = Field(
        default=None,
        description="Optional hint or example to help the user answer",
    )
    options: list[str] | None = Field(
        default=None,
        description="Optional predefined options for the user to choose from",
    )

    @field_validator("question_id")
    @classmethod
    def validate_question_id(cls, v: str) -> str:
        """Validate that question_id is a valid UUID v4."""
        try:
            parsed_uuid = uuid.UUID(v)
            # Explicitly check that it's a v4 UUID
            if parsed_uuid.version != 4:
                raise ValueError("question_id must be a valid UUID v4")
        except ValueError:
            raise ValueError("question_id must be a valid UUID v4")
        return v

    @field_validator("options")
    @classmethod
    def validate_options(cls, v: list[str] | None) -> list[str] | None:
        """Validate that options list contains non-empty strings."""
        if v is not None:
            if len(v) == 0:
                raise ValueError("options list cannot be empty")
            for i, option in enumerate(v):
                if not option or not option.strip():
                    raise ValueError(f"option at index {i} cannot be empty")
        return v


class ClarificationAnswerDto(BaseModel):
    """A single clarification answer from the user.

    This model represents the user's response to a specific clarification question.

    Attributes:
        question_id: ID of the question being answered (must match ClarificationQuestionDto.question_id)
        question_type: Type of question (for validation/context)
        answer: The user's answer text
    """

    question_id: str = Field(
        ...,
        description="ID of the question being answered (UUID v4 format)",
        min_length=36,
        max_length=36,
    )
    question_type: str = Field(
        ...,
        description="Type of question (e.g., timeline, parties)",
    )
    answer: str = Field(
        ...,
        description="The user's answer to the question",
        min_length=1,
    )

    @field_validator("question_id")
    @classmethod
    def validate_question_id(cls, v: str) -> str:
        """Validate that question_id is a valid UUID v4."""
        try:
            parsed_uuid = uuid.UUID(v)
            # Explicitly check that it's a v4 UUID
            if parsed_uuid.version != 4:
                raise ValueError("question_id must be a valid UUID v4")
        except ValueError:
            raise ValueError("question_id must be a valid UUID v4")
        return v


# -----------------------------------------------------------------------------
# Composite DTOs
# -----------------------------------------------------------------------------


class ClarificationRequestDto(BaseModel):
    """A clarification request sent to the frontend.

    This model contains all the information needed to display
    clarification questions to the user and guide them through
    providing additional information.

    Attributes:
        context_summary: Summary of what the AI understands so far
        questions: List of clarification questions to ask the user
        next_steps: Explanation of what happens after clarification
    """

    context_summary: str = Field(
        ...,
        description="Summary of what we understand so far",
        min_length=10,
    )
    questions: list[ClarificationQuestionDto] = Field(
        ...,
        description="List of specific follow-up questions to ask the user",
        min_length=1,
        max_length=6,
    )
    next_steps: str = Field(
        ...,
        description="Explanation of what will happen after clarification",
        min_length=10,
    )

    @field_validator("questions")
    @classmethod
    def validate_questions(cls, v: list[ClarificationQuestionDto]) -> list[ClarificationQuestionDto]:
        """Validate that question IDs are unique within the request."""
        question_ids = [q.question_id for q in v]
        if len(question_ids) != len(set(question_ids)):
            raise ValueError("All question_id values must be unique within a ClarificationRequestDto")
        return v


class ClarificationAnswersRequestDto(BaseModel):
    """Request to submit clarification answers.

    This model is used when the user submits their answers to
    clarification questions and expects an AI response.

    Attributes:
        original_question: The original question that prompted clarification
        session_id: User session ID for tracking
        mode: Response mode (LAWYER or SIMPLE)
        answers: List of answers from the user
        conversation_history: Optional conversation history for context
        conversation_metadata: Optional metadata for observability
    """

    original_question: str = Field(
        ...,
        description="The original question that prompted clarification",
        min_length=5,
    )
    session_id: str = Field(
        ...,
        description="User session ID for tracking (UUID v4 format)",
        min_length=36,
        max_length=36,
    )
    mode: str = Field(
        default="SIMPLE",
        description="Response mode: LAWYER (detailed) or SIMPLE (layperson)",
    )
    answers: list[ClarificationAnswerDto] = Field(
        ...,
        description="List of clarification answers from the user",
        min_length=1,
    )
    conversation_history: list[dict[str, str]] | None = Field(
        default=None,
        description="Conversation history as list of {role, content} messages for context",
    )
    conversation_metadata: dict[str, object] | None = Field(
        default=None,
        description="Additional conversation metadata for Langfuse observability",
    )

    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, v: str) -> str:
        """Validate that session_id is a valid UUID v4."""
        try:
            parsed_uuid = uuid.UUID(v)
            # Explicitly check that it's a v4 UUID
            if parsed_uuid.version != 4:
                raise ValueError("session_id must be a valid UUID v4")
        except ValueError:
            raise ValueError("session_id must be a valid UUID v4")
        return v

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, v: str) -> str:
        """Validate that mode is either LAWYER or SIMPLE."""
        if v.upper() not in ("LAWYER", "SIMPLE"):
            raise ValueError("mode must be either 'LAWYER' or 'SIMPLE'")
        return v.upper()

    @field_validator("answers")
    @classmethod
    def validate_answers(cls, v: list[ClarificationAnswerDto]) -> list[ClarificationAnswerDto]:
        """Validate that answer question_ids are unique (no duplicate answers)."""
        question_ids = [a.question_id for a in v]
        if len(question_ids) != len(set(question_ids)):
            raise ValueError("All question_id values in answers must be unique")
        return v
