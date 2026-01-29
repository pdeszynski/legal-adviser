"""AI Engine models package.

This package contains all Pydantic models for the AI Engine API.
"""

# Request models
from .requests import (
    AskQuestionRequest,
    ClassifyCaseRequest,
    ClarificationAnswer,
    ClarificationAnswerRequest,
    ConversationMetadata,
    DocumentType,
    GenerateDocumentRequest,
    GenerateEmbeddingsRequest,
    GenerateTitleRequest,
    QARequest,
    SearchRulingsRequest,
    SemanticSearchRequest,
)

# Response models
from .responses import (
    AnswerResponse,
    Citation,
    ClassificationResponse,
    ClarificationInfo,
    ClarificationQuestion,
    DocumentGenerationStatus,
    GenerateDocumentResponse,
    GenerateTitleResponse,
    QAResponse,
    Ruling,
    SearchRulingsResponse,
    SemanticSearchResponse,
    SemanticSearchResult,
)

# DTO models
from .dto import (
    ClarificationAnswersRequestDto,
    ClarificationAnswerDto,
    ClarificationQuestionDto,
    ClarificationQuestionType,
    ClarificationRequestDto,
)

__all__ = [
    # Request models
    "AskQuestionRequest",
    "ClassifyCaseRequest",
    "ClarificationAnswer",
    "ClarificationAnswerRequest",
    "ConversationMetadata",
    "DocumentType",
    "GenerateDocumentRequest",
    "GenerateEmbeddingsRequest",
    "GenerateTitleRequest",
    "QARequest",
    "SearchRulingsRequest",
    "SemanticSearchRequest",
    # Response models
    "AnswerResponse",
    "Citation",
    "ClassificationResponse",
    "ClarificationInfo",
    "ClarificationQuestion",
    "DocumentGenerationStatus",
    "GenerateDocumentResponse",
    "GenerateTitleResponse",
    "QAResponse",
    "Ruling",
    "SearchRulingsResponse",
    "SemanticSearchResponse",
    "SemanticSearchResult",
    # DTO models
    "ClarificationAnswersRequestDto",
    "ClarificationAnswerDto",
    "ClarificationQuestionDto",
    "ClarificationQuestionType",
    "ClarificationRequestDto",
]
