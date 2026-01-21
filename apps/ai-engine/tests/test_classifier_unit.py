"""Unit verification test for the classifier agent.

This test verifies the structure and configuration of the classifier agent
without making actual API calls to OpenAI.
"""

import pytest
from pydantic import BaseModel, Field
from typing import List, Optional


def test_classifier_agent_structure():
    """Test that the classifier agent has proper structure."""
    from src.agents.classifier_agent import (
        classifier_agent,
        ClassificationResult,
        LegalGround,
        CLASSIFIER_SYSTEM_PROMPT,
    )

    # Verify agent is instantiated
    assert classifier_agent is not None
    assert hasattr(classifier_agent, 'name')

    # Verify system prompt exists and is not empty
    assert CLASSIFIER_SYSTEM_PROMPT
    assert len(CLASSIFIER_SYSTEM_PROMPT) > 100
    assert "Radca Prawny" in CLASSIFIER_SYSTEM_PROMPT
    assert "legal grounds" in CLASSIFIER_SYSTEM_PROMPT.lower()

    # Verify output type model
    assert ClassificationResult is not None
    assert issubclass(ClassificationResult, BaseModel)

    # Verify LegalGround model structure
    assert LegalGround is not None
    assert issubclass(LegalGround, BaseModel)

    # Check LegalGround fields
    ground_fields = LegalGround.model_fields
    assert "name" in ground_fields
    assert "description" in ground_fields
    assert "confidence_score" in ground_fields
    assert "legal_basis" in ground_fields
    assert "notes" in ground_fields

    print("\n✅ Classifier agent structure verified")


def test_classification_result_model():
    """Test that ClassificationResult model has correct fields."""
    from src.agents.classifier_agent import ClassificationResult

    fields = ClassificationResult.model_fields

    assert "identified_grounds" in fields
    assert "overall_confidence" in fields
    assert "summary" in fields
    assert "recommendations" in fields

    # Test model instantiation with sample data
    sample_grounds = [
        {
            "name": "Wrongful Termination",
            "description": "Employee terminated without proper notice",
            "confidence_score": 0.85,
            "legal_basis": ["Art. 30 § 1 Kodeks Pracy"],
            "notes": "Requires evidence of termination",
        }
    ]

    result = ClassificationResult(
        identified_grounds=sample_grounds,
        overall_confidence=0.85,
        summary="Case involves wrongful termination",
        recommendations="Gather employment contract and termination letter",
    )

    assert result.overall_confidence == 0.85
    assert len(result.identified_grounds) == 1
    assert result.identified_grounds[0].name == "Wrongful Termination"

    print("\n✅ ClassificationResult model verified")


def test_api_endpoint_exists():
    """Test that the classification API endpoint exists."""
    from src.main import app

    routes = [route.path for route in app.routes]

    # Check that the classification endpoint exists
    assert "/api/v1/classify" in routes

    # Find the classify endpoint
    classify_route = None
    for route in app.routes:
        if route.path == "/api/v1/classify":
            classify_route = route
            break

    assert classify_route is not None
    assert classify_route.methods == {"POST"}

    print("\n✅ API endpoint /api/v1/classify verified")


def test_request_response_models():
    """Test that request and response models are properly defined."""
    from src.models.requests import ClassifyCaseRequest
    from src.models.responses import ClassificationResponse

    # Test request model
    request_fields = ClassifyCaseRequest.model_fields
    assert "case_description" in request_fields
    assert "session_id" in request_fields
    assert "context" in request_fields

    # Test request validation
    request = ClassifyCaseRequest(
        case_description="Test case description",
        session_id="test-session",
    )
    assert request.case_description == "Test case description"
    assert request.session_id == "test-session"
    assert request.context is None

    # Test response model
    response_fields = ClassificationResponse.model_fields
    assert "identified_grounds" in response_fields
    assert "overall_confidence" in response_fields
    assert "summary" in response_fields
    assert "recommendations" in response_fields
    assert "case_description" in response_fields
    assert "processing_time_ms" in response_fields

    # Test response instantiation
    response = ClassificationResponse(
        identified_grounds=[],
        overall_confidence=0.0,
        summary="Test summary",
        recommendations="Test recommendations",
        case_description="Test case",
        processing_time_ms=100.0,
    )
    assert response.processing_time_ms == 100.0

    print("\n✅ Request and response models verified")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
