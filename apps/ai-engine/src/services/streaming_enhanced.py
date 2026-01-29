"""Enhanced streaming support for real-time AI responses with SSE events.

This module provides streaming utilities with structured event types for
better client-side handling of real-time AI responses.

Event Types:
- token: Partial response content
- citation: Legal citation reference
- error: Error information
- done: Final completion event with metadata

Streaming Implementation:
This module uses OpenAI's streaming API directly to deliver tokens in real-time
as they are generated, rather than waiting for the complete response.
"""

import json
import logging
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from typing import Any

from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from ..agents.clarification_agent import to_clarification_request_dto, to_legacy_dict
from ..agents.dependencies import get_openai_client
from ..agents.rag_tool import format_contexts_for_prompt, retrieve_context_tool
from ..auth import UserContext
from ..config import get_settings
from ..exceptions import AIEngineError

logger = logging.getLogger(__name__)

# System prompts matching those in qa_agent.py
QA_SYSTEM_PROMPT_LAWYER = """You are an expert Polish lawyer (Radca Prawny) providing detailed legal Q&A.

Your task is to provide comprehensive legal answers with:
- Detailed analysis with references to specific articles and case law
- Professional legal terminology
- Consideration of multiple legal perspectives
- Clear identification of relevant legal principles

Important guidelines:
- Base your answer on the provided legal context
- Use proper Polish legal terminology and citations
- If the context is insufficient, explicitly state what additional information is needed
- Reference specific articles from relevant codes (Civil Code, Labor Code, etc.)
- Consider both statutory law and case law
- Provide nuanced analysis suitable for legal professionals

Your output should be structured, precise, and immediately useful for legal professionals."""

QA_SYSTEM_PROMPT_SIMPLE = """You are an expert Polish lawyer (Radca Prawny) providing legal Q&A to the general public.

Your task is to provide clear, accessible legal answers with:
- Simplified explanations suitable for laypersons
- Avoiding excessive legal jargon
- Practical, actionable advice
- Clear identification of key legal issues

Important guidelines:
- Base your answer on the provided legal context
- Explain legal concepts in plain language
- If the context is insufficient, explicitly state what additional information is needed
- Reference specific articles from relevant codes when available
- Provide practical guidance for the user's situation
- Recommend consulting a qualified lawyer for complex matters

Your output should be clear, helpful, and easy to understand for non-lawyers."""


# -----------------------------------------------------------------------------
# Event Models
# -----------------------------------------------------------------------------


@dataclass
class StreamEvent:
    """A single streaming event with type-based structure.

    Events are serialized to SSE format with explicit type field
    for client-side handling.

    Attributes:
        type: Event type (token, citation, error, done)
        content: Text content (for token events)
        metadata: Additional data (varies by event type)
        response_type: Response type (TEXT or CLARIFICATION_QUESTION)
    """

    type: str  # 'token', 'citation', 'error', 'done'
    content: str = ""  # Text content for token events
    metadata: dict[str, Any] = field(default_factory=dict)
    response_type: str = "TEXT"  # 'TEXT' or 'CLARIFICATION_QUESTION'

    def to_sse(self) -> str:
        """Convert event to Server-Sent Events format.

        Returns:
            SSE-formatted string with JSON data
        """
        data = {
            "type": self.type,
            "content": self.content,
            "metadata": self.metadata,
            "response_type": self.response_type,
        }
        return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def token_event(content: str, response_type: str = "TEXT") -> StreamEvent:
    """Create a token event with partial content.

    Args:
        content: Partial text content
        response_type: Response type (TEXT or CLARIFICATION_QUESTION)

    Returns:
        StreamEvent with type='token'
    """
    return StreamEvent(type="token", content=content, response_type=response_type)


def citation_event(source: str, article: str, url: str | None = None, response_type: str = "TEXT") -> StreamEvent:
    """Create a citation event.

    Args:
        source: Citation source (e.g., "Civil Code")
        article: Article or section number
        url: Optional URL to the source
        response_type: Response type (TEXT or CLARIFICATION_QUESTION)

    Returns:
        StreamEvent with type='citation'
    """
    return StreamEvent(
        type="citation",
        metadata={
            "source": source,
            "article": article,
            "url": url,
        },
        response_type=response_type,
    )


def error_event(error: str, error_code: str | None = None, response_type: str = "TEXT") -> StreamEvent:
    """Create an error event.

    Args:
        error: Error message
        error_code: Optional error code
        response_type: Response type (TEXT or CLARIFICATION_QUESTION)

    Returns:
        StreamEvent with type='error'
    """
    metadata = {"error": error}
    if error_code:
        metadata["error_code"] = error_code
    return StreamEvent(type="error", metadata=metadata, response_type=response_type)


def done_event(
    citations: list[dict[str, Any]] | None = None,
    confidence: float = 0.0,
    processing_time_ms: float = 0.0,
    query_type: str | None = None,
    key_terms: list[str] | None = None,
    suggested_title: str | None = None,
    response_type: str = "TEXT",
) -> StreamEvent:
    """Create a completion event with final metadata.

    Args:
        citations: List of legal citations
        confidence: Confidence score (0-1)
        processing_time_ms: Processing time in milliseconds
        query_type: Type of query
        key_terms: Key legal terms extracted
        suggested_title: Optional AI-generated title for the session
        response_type: Response type (TEXT or CLARIFICATION_QUESTION)

    Returns:
        StreamEvent with type='done'
    """
    metadata: dict[str, Any] = {
        "citations": citations or [],
        "confidence": confidence,
        "processing_time_ms": processing_time_ms,
    }
    if query_type:
        metadata["query_type"] = query_type
    if key_terms:
        metadata["key_terms"] = key_terms
    if suggested_title:
        metadata["suggested_title"] = suggested_title

    return StreamEvent(type="done", metadata=metadata, response_type=response_type)


# -----------------------------------------------------------------------------
# Streaming Generator
# -----------------------------------------------------------------------------


async def stream_qa_enhanced(
    question: str,
    mode: str,
    session_id: str,
    user: UserContext | None = None,
    request: Any | None = None,  # FastAPI Request for disconnect detection
    messages: list[dict[str, Any]] | None = None,  # Conversation history
    conversation_metadata: dict[str, Any] | None = None,  # Additional conversation metadata
) -> AsyncGenerator[str, None]:
    """Stream a Q&A response with structured events using real-time OpenAI streaming.

    This generator yields SSE-formatted events with type-based structure:
    - token events: Partial response content as it's generated (REAL-TIME)
    - citation events: Legal citations as they're identified
    - error events: If an error occurs during processing
    - done event: Final completion with full metadata

    This implementation uses OpenAI's streaming API directly to deliver tokens
    as they are generated, not after the complete response is finished.

    Client disconnection is handled gracefully by checking the request state.

    Args:
        question: The legal question
        mode: Response mode (LAWYER or SIMPLE)
        session_id: Session ID for tracking (validated UUID v4)
        user: Optional authenticated user context (may include session_id)
        request: FastAPI Request for detecting client disconnection
        messages: Optional conversation history as list of {role, content} dicts

    Yields:
        SSE-formatted JSON events
    """
    import time

    from ..agents.dependencies import get_model_deps_with_user
    from ..agents.qa_agent import get_query_analyzer_agent
    from ..langfuse_init import is_langfuse_enabled, update_current_trace

    start_time = time.time()
    user_id = user.id if user else None
    # Use session_id from UserContext if available (validated), otherwise from parameter
    effective_session_id = user.session_id if user and user.session_id else session_id
    settings = get_settings()

    # Check if this is the first message (no conversation history)
    # If so, we'll generate a title for the session
    is_first_message = not messages or len(messages) == 0

    logger.info(
        "Starting REAL-TIME Q&A stream: session_id=%s, user_id=%s, mode=%s, first_message=%s",
        effective_session_id,
        user_id,
        mode,
        is_first_message,
    )

    # Build Langfuse metadata from conversation metadata
    langfuse_metadata: dict[str, Any] = {
        "mode": mode,
        "streaming": "real-time",
        "message_count": len(messages) + 1 if messages else 1,
        "is_first_message": is_first_message,
    }

    # Add conversation metadata if provided
    if conversation_metadata:
        if conversation_metadata.get("message_count") is not None:
            langfuse_metadata["message_count"] = conversation_metadata["message_count"]
        if conversation_metadata.get("is_first_message") is not None:
            langfuse_metadata["is_first_message"] = conversation_metadata["is_first_message"]
        if conversation_metadata.get("language"):
            langfuse_metadata["language"] = conversation_metadata["language"]
        if conversation_metadata.get("locale"):
            langfuse_metadata["locale"] = conversation_metadata["locale"]
        if conversation_metadata.get("user_agent"):
            langfuse_metadata["user_agent"] = conversation_metadata["user_agent"]
        if conversation_metadata.get("platform"):
            langfuse_metadata["platform"] = conversation_metadata["platform"]
        if conversation_metadata.get("query_category"):
            langfuse_metadata["query_category"] = conversation_metadata["query_category"]
        if conversation_metadata.get("conversation_start_time"):
            langfuse_metadata["conversation_start_time"] = conversation_metadata["conversation_start_time"]

    # Update Langfuse trace with input metadata
    if is_langfuse_enabled():
        update_current_trace(
            input=question,
            user_id=user_id,
            session_id=effective_session_id,
            metadata=langfuse_metadata,
        )

    try:
        # Check for client disconnection before processing
        if request and getattr(request, "is_disconnected", None) and await request.is_disconnected():
            logger.info("Client disconnected before processing")
            return

        # Get dependencies
        deps = get_model_deps_with_user(user)

        # Step 1: Quick query analysis (non-streaming, but fast)
        analyzer = get_query_analyzer_agent()
        analysis_result = await analyzer.run(question, deps=deps)
        analysis = analysis_result.output

        # Step 2: Check if clarification is needed
        if analysis.needs_clarification:
            from ..agents.clarification_agent import generate_clarifications

            clarification_result = await generate_clarifications(
                question=question,
                query_type=analysis.query_type,
                mode=mode,
                conversation_history=messages,
                session_id=effective_session_id,
                user_id=user_id,
            )

            logger.info(
                "Clarification result for session_id=%s: needs_clarification=%s, questions_count=%d",
                effective_session_id,
                clarification_result.get("needs_clarification", False),
                len(clarification_result.get("questions", [])),
            )

            if clarification_result.get("needs_clarification"):
                # Convert to DTO for structured format
                clarification_dto = to_clarification_request_dto(clarification_result)

                # Send clarification as token content using structured DTO
                # with CLARIFICATION_QUESTION response type
                event = token_event(
                    json.dumps(to_legacy_dict(clarification_dto), ensure_ascii=False),
                    response_type="CLARIFICATION_QUESTION"
                )
                yield event.to_sse()

                # Send done event for clarification case with CLARIFICATION_QUESTION response type
                yield done_event(
                    citations=[],
                    confidence=0.0,
                    processing_time_ms=(time.time() - start_time) * 1000,
                    response_type="CLARIFICATION_QUESTION",
                ).to_sse()
                return

        # Step 3: Retrieve context using the RAG tool
        contexts = await retrieve_context_tool(
            query=analysis.question_refined,
            limit=5,
        )

        # Build context string for the prompt
        context_text = format_contexts_for_prompt(contexts)

        # Build augmented prompt
        augmented_prompt = f"""Question: {question}

Refined Question: {analysis.question_refined}

Legal Context:
{context_text}

Please provide a comprehensive answer based on the above context."""

        # Select system prompt based on mode
        system_prompt = QA_SYSTEM_PROMPT_LAWYER if mode.upper() == "LAWYER" else QA_SYSTEM_PROMPT_SIMPLE

        # Step 4: Stream the response using OpenAI API directly
        openai_client = get_openai_client()

        # Prepare messages with conversation history
        # Start with system prompt
        api_messages = [
            {"role": "system", "content": system_prompt},
        ]

        # Add conversation history if provided (exclude system messages)
        if messages:
            # Filter out system messages from history and limit to recent messages
            # to avoid token limits while maintaining context
            history_messages = [
                {"role": msg["role"], "content": msg["content"]}
                for msg in messages
                if msg.get("role") in ("user", "assistant")
            ]

            # Verify message roles and content before adding
            valid_roles = {"user", "assistant"}
            for i, msg in enumerate(history_messages):
                if msg["role"] not in valid_roles:
                    logger.warning(
                        "Invalid message role at index %d: %s (session_id=%s)",
                        i,
                        msg.get("role"),
                        effective_session_id,
                    )
                if not msg.get("content") or len(msg["content"].strip()) == 0:
                    logger.warning(
                        "Empty message content at index %d (session_id=%s)",
                        i,
                        effective_session_id,
                    )

            # Limit history to last 10 messages to manage token usage
            original_count = len(history_messages)
            if len(history_messages) > 10:
                history_messages = history_messages[-10:]

            api_messages.extend(history_messages)

            # Log detailed conversation history integration
            total_history_chars = sum(len(msg.get("content", "")) for msg in history_messages)

            # Calculate role counts for metrics
            user_count = sum(1 for msg in history_messages if msg.get("role") == "user")
            assistant_count = sum(1 for msg in history_messages if msg.get("role") == "assistant")
            has_empty_content = any(
                not msg.get("content") or len(msg.get("content", "").strip()) == 0
                for msg in history_messages
            )
            was_truncated = original_count > 10

            logger.info(
                "Conversation history integrated: session_id=%s, messages_added=%d, original_count=%d, total_chars=%d, truncated=%s",
                effective_session_id,
                len(history_messages),
                original_count,
                total_history_chars,
                was_truncated,
            )

            # Record metrics for monitoring
            from .metrics import record_conversation_history
            record_conversation_history(
                message_count=original_count,
                total_chars=total_history_chars,
                user_count=user_count,
                assistant_count=assistant_count,
                has_empty_content=has_empty_content,
                was_truncated=was_truncated,
            )

            # Log message order for verification
            if history_messages:
                role_sequence = "->".join(msg["role"][:1] for msg in history_messages)
                logger.debug(
                    "Message order for session_id=%s: %s",
                    effective_session_id,
                    role_sequence,
                )

        # Add current question with context
        api_messages.append({"role": "user", "content": augmented_prompt})

        logger.debug("Starting OpenAI streaming for session_id=%s", effective_session_id)

        # Stream the response
        stream = await openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=api_messages,
            stream=True,
            stream_options={"include_usage": True},  # Get usage stats
        )

        full_answer = ""
        first_token_time = None

        async for chunk in stream:
            # Check for client disconnection during streaming
            if (
                request
                and getattr(request, "is_disconnected", None)
                and await request.is_disconnected()
            ):
                logger.info("Client disconnected during streaming")
                return

            # Record first token time for metrics
            if first_token_time is None and chunk.choices:
                first_token_time = time.time()
                logger.debug("First token received at %.3fs", first_token_time - start_time)

            # Extract delta content
            if chunk.choices and chunk.choices[0].delta.content:
                token_content = chunk.choices[0].delta.content
                full_answer += token_content

                # Send token event immediately (real-time streaming)
                yield token_event(token_content).to_sse()

            # Check if this is the final chunk with usage
            if hasattr(chunk, 'usage') and chunk.usage:
                logger.debug(
                    "Stream complete: prompt_tokens=%d, completion_tokens=%d",
                    chunk.usage.prompt_tokens,
                    chunk.usage.completion_tokens,
                )

        # Extract citations from retrieved contexts
        from ..agents.rag_tool import extract_citations_from_contexts
        context_citations_data = extract_citations_from_contexts(contexts)

        # Send citations as individual events
        for citation_data in context_citations_data:
            yield citation_event(
                source=citation_data.get("source", "Unknown"),
                article=citation_data.get("article", ""),
                url=citation_data.get("url"),
            ).to_sse()

        # Calculate metrics
        processing_time_ms = (time.time() - start_time) * 1000
        time_to_first_token = (first_token_time - start_time) * 1000 if first_token_time else 0

        # Estimate confidence based on context quality and answer length
        confidence = min(0.95, 0.5 + (len(contexts) * 0.1) + min(0.2, len(full_answer) / 1000))

        # Generate suggested title if this is the first message
        suggested_title = None
        if is_first_message:
            try:
                from ..agents.title_agent import generate_title
                suggested_title = await generate_title(question, effective_session_id)
                logger.debug(f"Generated title for session {effective_session_id}: {suggested_title}")
            except Exception as e:
                logger.warning(f"Failed to generate title for session {effective_session_id}: {e}")
                # Fallback title will be generated on the frontend/backend

        # Send final done event with complete metadata
        yield done_event(
            citations=[{
                "source": c.get("source", "Unknown"),
                "article": c.get("article", ""),
                "url": c.get("url"),
            } for c in context_citations_data],
            confidence=confidence,
            processing_time_ms=processing_time_ms,
            query_type=analysis.query_type,
            key_terms=analysis.key_terms,
            suggested_title=suggested_title,
        ).to_sse()

        # Update Langfuse trace with output metadata
        if is_langfuse_enabled():
            update_current_trace(
                output={
                    "answer_length": len(full_answer),
                    "confidence": confidence,
                    "citations_count": len(context_citations_data),
                    "processing_time_ms": processing_time_ms,
                    "time_to_first_token_ms": time_to_first_token,
                    "streaming": "real-time",
                    "model": settings.OPENAI_MODEL,
                }
            )

        logger.info(
            "REAL-TIME Q&A stream complete: session_id=%s, chars=%d, time_to_first_token=%.1fms, total_time=%dms",
            effective_session_id,
            len(full_answer),
            time_to_first_token,
            int(processing_time_ms),
        )

    except AIEngineError as e:
        # Send structured error for known AI Engine errors
        logger.exception("AI Engine error in streaming: %s - %s", e.error_code, e.message)
        yield error_event(str(e), error_code=e.error_code).to_sse()

    except HTTPException as e:
        # Send error for HTTP exceptions (auth, validation)
        logger.exception("HTTP error in streaming: %s", e.detail)
        error_msg = (
            e.detail
            if isinstance(e.detail, str)
            else str(e.detail.get("message", "Unknown error"))
        )
        yield error_event(error_msg).to_sse()

    except Exception:
        # Send generic error for unexpected exceptions
        logger.exception("Unexpected error in streaming")
        yield error_event("An unexpected error occurred").to_sse()


def create_enhanced_streaming_response(
    stream_generator: AsyncGenerator[str, None],
) -> StreamingResponse:
    """Create a FastAPI StreamingResponse for enhanced SSE streaming.

    Args:
        stream_generator: Async generator yielding SSE events

    Returns:
        FastAPI StreamingResponse with proper headers for SSE
    """
    return StreamingResponse(
        stream_generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


async def stream_clarification_answer(
    original_question: str,
    answers: list[dict[str, Any]],
    mode: str,
    session_id: str,
    user: UserContext | None = None,
    request: Any | None = None,  # FastAPI Request for disconnect detection
    messages: list[dict[str, Any]] | None = None,  # Conversation history
    conversation_metadata: dict[str, Any] | None = None,  # Additional conversation metadata
) -> AsyncGenerator[str, None]:
    """Stream an AI response after receiving clarification answers from the user.

    This generator processes the user's answers to clarification questions
    and provides a comprehensive response with the additional context.

    The user's answers are incorporated into the conversation history and
    used to provide a more accurate legal response.

    Args:
        original_question: The original question that prompted clarification
        answers: List of {question, question_type, answer} objects from user
        mode: Response mode (LAWYER or SIMPLE)
        session_id: Session ID for tracking (validated UUID v4)
        user: Optional authenticated user context
        request: FastAPI Request for detecting client disconnection
        messages: Optional conversation history as list of {role, content} dicts
        conversation_metadata: Optional additional conversation metadata for Langfuse

    Yields:
        SSE-formatted JSON events
    """
    import time

    from ..agents.rag_tool import (
        extract_citations_from_contexts,
        format_contexts_for_prompt,
        retrieve_context_tool,
    )
    from ..langfuse_init import is_langfuse_enabled, update_current_trace

    start_time = time.time()
    user_id = user.id if user else None
    effective_session_id = user.session_id if user and user.session_id else session_id
    settings = get_settings()

    logger.info(
        "Starting clarification answer stream: session_id=%s, user_id=%s, mode=%s, answers_count=%d",
        effective_session_id,
        user_id,
        mode,
        len(answers),
    )

    # Build Langfuse metadata from conversation metadata
    langfuse_metadata: dict[str, Any] = {
        "mode": mode,
        "streaming": "clarification-answer",
        "clarification_answers_count": len(answers),
    }

    # Add conversation metadata if provided
    if conversation_metadata:
        if conversation_metadata.get("message_count") is not None:
            langfuse_metadata["message_count"] = conversation_metadata["message_count"]
        if conversation_metadata.get("language"):
            langfuse_metadata["language"] = conversation_metadata["language"]
        if conversation_metadata.get("locale"):
            langfuse_metadata["locale"] = conversation_metadata["locale"]
        if conversation_metadata.get("user_agent"):
            langfuse_metadata["user_agent"] = conversation_metadata["user_agent"]
        if conversation_metadata.get("platform"):
            langfuse_metadata["platform"] = conversation_metadata["platform"]
        if conversation_metadata.get("query_category"):
            langfuse_metadata["query_category"] = conversation_metadata["query_category"]

    # Update Langfuse trace with input metadata
    if is_langfuse_enabled():
        update_current_trace(
            input=original_question,
            user_id=user_id,
            session_id=effective_session_id,
            metadata=langfuse_metadata,
        )

    try:
        # Check for client disconnection before processing
        if request and getattr(request, "is_disconnected", None) and await request.is_disconnected():
            logger.info("Client disconnected before processing")
            return

        # Step 1: Format clarification answers into context
        answers_text = "\n\n".join([
            f"Q: {ans['question']}\nA: {ans['answer']}"
            for ans in answers
        ])

        # Step 2: Build the enhanced prompt with clarification context
        clarification_context = f"""
Original Question: {original_question}

Additional Information Provided:
{answers_text}

Please provide a comprehensive answer based on the original question and the additional information provided above."""

        # Step 3: Retrieve relevant legal context using RAG
        # Use the original question combined with answers for better retrieval
        combined_query = f"{original_question} {answers_text}"
        contexts = await retrieve_context_tool(
            query=combined_query,
            limit=5,
        )

        # Build context string for the prompt
        context_text = format_contexts_for_prompt(contexts)

        # Build augmented prompt with legal context
        augmented_prompt = f"""{clarification_context}

Legal Context:
{context_text}

Please provide a comprehensive answer based on the above information."""

        # Select system prompt based on mode
        system_prompt = QA_SYSTEM_PROMPT_LAWYER if mode.upper() == "LAWYER" else QA_SYSTEM_PROMPT_SIMPLE

        # Step 4: Prepare messages with conversation history
        # Start with system prompt
        api_messages = [
            {"role": "system", "content": system_prompt},
        ]

        # Add conversation history if provided (exclude system messages)
        if messages:
            history_messages = [
                {"role": msg["role"], "content": msg["content"]}
                for msg in messages
                if msg.get("role") in ("user", "assistant")
            ]

            # Limit history to last 10 messages
            if len(history_messages) > 10:
                history_messages = history_messages[-10:]

            api_messages.extend(history_messages)
            logger.info(
                "Added %d messages from conversation history to clarification stream for session_id=%s",
                len(history_messages),
                effective_session_id,
            )

        # Add a user message representing the clarification round
        # This ensures the conversation history includes the clarification Q&A
        clarification_message = f"""I need help with: {original_question}

Your follow-up questions:
{chr(10).join([f"- {q['question']}" for q in answers])}

My answers:
{chr(10).join([f"- {q['answer']}" for q in answers])}"""

        api_messages.append({"role": "user", "content": clarification_message})
        api_messages.append({"role": "user", "content": augmented_prompt})

        logger.debug("Starting OpenAI streaming for clarification answer, session_id=%s", effective_session_id)

        # Step 5: Stream the response using OpenAI API directly
        openai_client = get_openai_client()

        stream = await openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=api_messages,
            stream=True,
            stream_options={"include_usage": True},
        )

        full_answer = ""
        first_token_time = None

        async for chunk in stream:
            # Check for client disconnection during streaming
            if (
                request
                and getattr(request, "is_disconnected", None)
                and await request.is_disconnected()
            ):
                logger.info("Client disconnected during clarification answer streaming")
                return

            # Record first token time for metrics
            if first_token_time is None and chunk.choices:
                first_token_time = time.time()
                logger.debug("First token received at %.3fs", first_token_time - start_time)

            # Extract delta content
            if chunk.choices and chunk.choices[0].delta.content:
                token_content = chunk.choices[0].delta.content
                full_answer += token_content

                # Send token event immediately (real-time streaming)
                yield token_event(token_content).to_sse()

            # Check if this is the final chunk with usage
            if hasattr(chunk, 'usage') and chunk.usage:
                logger.debug(
                    "Clarification answer stream complete: prompt_tokens=%d, completion_tokens=%d",
                    chunk.usage.prompt_tokens,
                    chunk.usage.completion_tokens,
                )

        # Extract citations from retrieved contexts
        context_citations_data = extract_citations_from_contexts(contexts)

        # Send citations as individual events
        for citation_data in context_citations_data:
            yield citation_event(
                source=citation_data.get("source", "Unknown"),
                article=citation_data.get("article", ""),
                url=citation_data.get("url"),
            ).to_sse()

        # Calculate metrics
        processing_time_ms = (time.time() - start_time) * 1000
        time_to_first_token = (first_token_time - start_time) * 1000 if first_token_time else 0

        # Estimate confidence based on context quality and answer length
        confidence = min(0.95, 0.6 + (len(contexts) * 0.1) + min(0.2, len(full_answer) / 1000))

        # Determine query type based on the content
        query_type = "clarification_response"

        # Send final done event with complete metadata
        yield done_event(
            citations=[{
                "source": c.get("source", "Unknown"),
                "article": c.get("article", ""),
                "url": c.get("url"),
            } for c in context_citations_data],
            confidence=confidence,
            processing_time_ms=processing_time_ms,
            query_type=query_type,
        ).to_sse()

        # Update Langfuse trace with output metadata
        if is_langfuse_enabled():
            update_current_trace(
                output={
                    "answer_length": len(full_answer),
                    "confidence": confidence,
                    "citations_count": len(context_citations_data),
                    "processing_time_ms": processing_time_ms,
                    "time_to_first_token_ms": time_to_first_token,
                    "streaming": "clarification-answer",
                    "model": settings.OPENAI_MODEL,
                    "clarification_answers_processed": len(answers),
                }
            )

        logger.info(
            "Clarification answer stream complete: session_id=%s, chars=%d, time_to_first_token=%.1fms, total_time=%dms",
            effective_session_id,
            len(full_answer),
            time_to_first_token,
            int(processing_time_ms),
        )

    except AIEngineError as e:
        # Send structured error for known AI Engine errors
        logger.exception("AI Engine error in clarification answer streaming: %s - %s", e.error_code, e.message)
        yield error_event(str(e), error_code=e.error_code).to_sse()

    except HTTPException as e:
        # Send error for HTTP exceptions (auth, validation)
        logger.exception("HTTP error in clarification answer streaming: %s", e.detail)
        error_msg = (
            e.detail
            if isinstance(e.detail, str)
            else str(e.detail.get("message", "Unknown error"))
        )
        yield error_event(error_msg).to_sse()

    except Exception:
        # Send generic error for unexpected exceptions
        logger.exception("Unexpected error in clarification answer streaming")
        yield error_event("An unexpected error occurred while processing your answers").to_sse()
