"""AI Engine models package.

This package contains all Pydantic models for the AI Engine API.
"""

# Request models
# DTO models
from .dto import (
    ClarificationAnswerDto,
    ClarificationAnswersRequestDto,
    ClarificationQuestionDto,
    ClarificationQuestionType,
    ClarificationRequestDto,
)
from .requests import (
    AskQuestionRequest,
    ClarificationAnswer,
    ClarificationAnswerRequest,
    ClassifyCaseRequest,
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
    ClarificationInfo,
    ClarificationQuestion,
    ClassificationResponse,
    DocumentGenerationStatus,
    GenerateDocumentResponse,
    GenerateTitleResponse,
    QAResponse,
    Ruling,
    SearchRulingsResponse,
    SemanticSearchResponse,
    SemanticSearchResult,
)

__all__ = [
    # Response models
    "AnswerResponse",
    # Request models
    "AskQuestionRequest",
    "Citation",
    "ClarificationAnswer",
    "ClarificationAnswerDto",
    "ClarificationAnswerRequest",
    # DTO models
    "ClarificationAnswersRequestDto",
    "ClarificationInfo",
    "ClarificationQuestion",
    "ClarificationQuestionDto",
    "ClarificationQuestionType",
    "ClarificationRequestDto",
    "ClassificationResponse",
    "ClassifyCaseRequest",
    "ConversationMetadata",
    "DocumentGenerationStatus",
    "DocumentType",
    "GenerateDocumentRequest",
    "GenerateDocumentResponse",
    "GenerateEmbeddingsRequest",
    "GenerateTitleRequest",
    "GenerateTitleResponse",
    "QARequest",
    "QAResponse",
    "Ruling",
    "SearchRulingsRequest",
    "SearchRulingsResponse",
    "SemanticSearchRequest",
    "SemanticSearchResponse",
    "SemanticSearchResult",
]
