"""Unit verification test for the Q&A LangGraph workflow.

This test verifies the structure and configuration of the QA graph
without making actual API calls to OpenAI.
"""

import pytest


def test_qa_graph_structure():
    """Test that the QA graph has proper structure."""
    from src.graphs.qa_graph import (
        QAGraphNodes,
        QAState,
        build_qa_graph,
        qa_graph,
    )

    # Verify graph is instantiated
    assert qa_graph is not None
    assert hasattr(qa_graph, "nodes")

    # Verify the state model has required fields
    required_fields = [
        "question",
        "session_id",
        "mode",
        "query_type",
        "key_terms",
        "question_refined",
        "needs_clarification",
        "clarification_prompt",
        "query_embedding",
        "retrieved_contexts",
        "context_summary",
        "raw_answer",
        "answer_complete",
        "final_answer",
        "citations",
        "confidence",
        "error",
    ]

    for field in required_fields:
        assert field in QAState.__annotations__, f"Field {field} missing from QAState"

    # Verify graph builder function exists
    assert build_qa_graph is not None
    assert callable(build_qa_graph)

    # Verify QAGraphNodes class exists
    assert QAGraphNodes is not None
    nodes = QAGraphNodes()
    assert hasattr(nodes, "query_analysis_node")
    assert hasattr(nodes, "context_retrieval_node")
    assert hasattr(nodes, "answer_generation_node")
    assert hasattr(nodes, "citation_formatting_node")

    print("\n QA graph structure verified")


def test_qa_graph_nodes():
    """Test that QA graph nodes are callable."""
    from src.graphs.qa_graph import QAGraphNodes

    nodes = QAGraphNodes()

    # Verify all node methods are async
    import inspect

    assert inspect.iscoroutinefunction(nodes.query_analysis_node)
    assert inspect.iscoroutinefunction(nodes.context_retrieval_node)
    assert inspect.iscoroutinefunction(nodes.answer_generation_node)
    assert inspect.iscoroutinefunction(nodes.citation_formatting_node)

    print("\n QA graph nodes are async")


def test_qa_graph_edges():
    """Test that the QA graph has the expected nodes and edges."""
    from src.graphs.qa_graph import qa_graph

    # Get graph nodes
    graph_nodes = list(qa_graph.nodes.keys())

    expected_nodes = [
        "query_analysis",
        "context_retrieval",
        "answer_generation",
        "citation_formatting",
        "generic_answer",
    ]

    for node in expected_nodes:
        assert node in graph_nodes, f"Node {node} missing from graph"

    print("\n QA graph edges verified")


def test_conditional_edge_functions():
    """Test that conditional edge functions exist and work correctly."""
    from src.graphs.qa_graph import (
        has_context,
        should_ask_clarification,
        should_format_citations,
    )

    # Test should_ask_clarification
    assert should_ask_clarification({"needs_clarification": True}) == "clarification"
    assert (
        should_ask_clarification({"needs_clarification": False}) == "retrieve_context"
    )

    # Test has_context
    assert has_context({"retrieved_contexts": []}) == "no_context"
    assert (
        has_context({"retrieved_contexts": [{"content": "test"}]}) == "generate_answer"
    )
    assert has_context({"retrieved_contexts": None}) == "no_context"

    # Test should_format_citations
    assert (
        should_format_citations({"answer_complete": True, "raw_answer": "answer"})
        == "format_citations"
    )
    assert (
        should_format_citations({"answer_complete": True, "raw_answer": None})
        == "generic_answer"
    )
    assert (
        should_format_citations({"answer_complete": False, "raw_answer": "answer"})
        == "generic_answer"
    )

    print("\n Conditional edge functions verified")


def test_qa_api_endpoint_exists():
    """Test that the Q&A API endpoint exists."""
    from src.main import app

    routes = [route.path for route in app.routes]

    # Check that the Q&A endpoint exists
    assert "/api/v1/qa/ask" in routes

    # Find the Q&A endpoint
    qa_route = None
    for route in app.routes:
        if route.path == "/api/v1/qa/ask":
            qa_route = route
            break

    assert qa_route is not None
    assert qa_route.methods == {"POST"}

    print("\n API endpoint /api/v1/qa/ask verified")


def test_qa_request_response_models():
    """Test that Q&A request and response models are properly defined."""
    from src.models.requests import AskQuestionRequest
    from src.models.responses import AnswerResponse

    # Test request model
    request_fields = AskQuestionRequest.model_fields
    assert "question" in request_fields
    assert "session_id" in request_fields
    assert "mode" in request_fields

    # Test request validation
    request = AskQuestionRequest(
        question="What is the statute of limitations?",
        session_id="test-session",
        mode="SIMPLE",
    )
    assert request.question == "What is the statute of limitations?"
    assert request.mode == "SIMPLE"

    # Test response model
    response_fields = AnswerResponse.model_fields
    assert "answer" in response_fields
    assert "citations" in response_fields
    assert "confidence" in response_fields

    # Test response instantiation
    response = AnswerResponse(
        answer="Test answer",
        citations=[],
        confidence=0.85,
    )
    assert response.answer == "Test answer"
    assert response.confidence == 0.85

    print("\n Q&A request and response models verified")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
