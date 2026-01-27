
🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore the AI Engine streaming endpoint implementation",
      "status": "in_progress",
      "activeForm": "Exploring AI Engine streaming endpoint implementation"
    },
    {
      "content": "Identify why streaming is not working immediately",
      "status": "pending",
      "activeForm": "Identifying streaming delay issue"
    },
    {
      "content": "Fix the streaming implementation",
      "status": "pending",
      "activeForm": "Fixing streaming implementation"
    },
    {
      "content": "Verify with Playwright test",
      "status": "pending",
      "activeForm": "Verifying with Playwright test"
    }
  ]
}
Let me explore the AI Engine streaming endpoint to understand the current implementation.

🔧 Tool: Glob
Input: {
  "pattern": "apps/ai-engine/src/**/*.py"
}

🔧 Tool: Grep
Input: {
  "pattern": "ask-stream|ask_stream|StreamingResponse",
  "path": "apps/ai-engine"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/services/streaming.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/services/streaming_enhanced.py"
}
Now I understand the issue. Looking at `streaming_enhanced.py` (lines 199-206), the `stream_qa_enhanced` function first waits for the complete `answer_question` result before sending any chunks:

```python
# Run the Q&A workflow
result = await answer_question(
    question=question,
    mode=mode,
    session_id=session_id,
    user_id=user_id,
    user=user,
)
```

This blocks until the entire LLM response is generated, then it chunks up the already-complete response and yields it with artificial delays. This is not true streaming - it's fake streaming of a complete response.

Let me check how `answer_question` works and if the underlying agent supports true streaming:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/qa_agent.py"
}
Now I understand the full picture. The `answer_question` function uses PydanticAI agents which return structured output (`QAResult`). PydanticAI's structured output requires the full LLM response to be complete before parsing. The current implementation waits for the complete response, then "fake streams" it by chunking.

To enable true streaming, I need to use the OpenAI API directly with streaming support, bypassing PydanticAI's structured output for the streaming endpoint. Let me update my todos and implement the fix:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring AI Engine streaming endpoint implementation",
      "content": "Explore the AI Engine streaming endpoint implementation",
      "status": "completed"
    },
    {
      "activeForm": "Identified the issue - fake streaming",
      "content": "Identify why streaming is not working immediately",
      "status": "completed"
    },
    {
      "activeForm": "Implementing true streaming with OpenAI API",
      "content": "Fix the streaming implementation to use real OpenAI streaming",
      "status": "in_progress"
    },
    {
      "activeForm": "Verifying with Playwright test",
      "content": "Verify with Playwright test",
      "status": "pending"
    }
  ]
}
Let me check the `dependencies.py` to understand how to get access to the OpenAI client:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/dependencies.py"
}
Now I have all the context. Let me implement true streaming by creating a new streaming function that uses OpenAI's API directly with streaming support. I'll modify the `streaming_enhanced.py` file:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/services/streaming_enhanced.py",
  "old_string": "\"\"\"Enhanced streaming support for real-time AI responses with SSE events.\n\nThis module provides streaming utilities with structured event types for\nbetter client-side handling of real-time AI responses.\n\nEvent Types:\n- token: Partial response content\n- citation: Legal citation reference\n- error: Error information\n- done: Final completion event with metadata\n\"\"\"\n\nimport asyncio\nimport json\nimport logging\nfrom collections.abc import AsyncGenerator\nfrom dataclasses import dataclass, field\nfrom typing import Any\n\nfrom fastapi import HTTPException\nfrom fastapi.responses import StreamingResponse\n\nfrom ..auth import UserContext\nfrom ..exceptions import AIEngineError\n\nlogger = logging.getLogger(__name__)",
  "new_string": "\"\"\"Enhanced streaming support for real-time AI responses with SSE events.\n\nThis module provides streaming utilities with structured event types for\nbetter client-side handling of real-time AI responses.\n\nEvent Types:\n- token: Partial response content\n- citation: Legal citation reference\n- error: Error information\n- done: Final completion event with metadata\n\nStreaming Implementation:\nThis module uses OpenAI's streaming API directly to deliver tokens in real-time\nas they are generated, rather than waiting for the complete response.\n\"\"\"\n\nimport asyncio\nimport json\nimport logging\nfrom collections.abc import AsyncGenerator\nfrom dataclasses import dataclass, field\nfrom typing import Any\n\nfrom fastapi import HTTPException\nfrom fastapi.responses import StreamingResponse\n\nfrom ..agents.dependencies import get_openai_client\nfrom ..agents.rag_tool import format_contexts_for_prompt, retrieve_context_tool\nfrom ..auth import UserContext\nfrom ..config import get_settings\nfrom ..exceptions import AIEngineError\n\nlogger = logging.getLogger(__name__)\n\n# System prompts matching those in qa_agent.py\nQA_SYSTEM_PROMPT_LAWYER = \"\"\"You are an expert Polish lawyer (Radca Prawny) providing detailed legal Q&A.\n\nYour task is to provide comprehensive legal answers with:\n- Detailed analysis with references to specific articles and case law\n- Professional legal terminology\n- Consideration of multiple legal perspectives\n- Clear identification of relevant legal principles\n\nImportant guidelines:\n- Base your answer on the provided legal context\n- Use proper Polish legal terminology and citations\n- If the context is insufficient, explicitly state what additional information is needed\n- Reference specific articles from relevant codes (Civil Code, Labor Code, etc.)\n- Consider both statutory law and case law\n- Provide nuanced analysis suitable for legal professionals\n\nYour output should be structured, precise, and immediately useful for legal professionals.\"\"\"\n\nQA_SYSTEM_PROMPT_SIMPLE = \"\"\"You are an expert Polish lawyer (Radca Prawny) providing legal Q&A to the general public.\n\nYour task is to provide clear, accessible legal answers with:\n- Simplified explanations suitable for laypersons\n- Avoiding excessive legal jargon\n- Practical, actionable advice\n- Clear identification of key legal issues\n\nImportant guidelines:\n- Base your answer on the provided legal context\n- Explain legal concepts in plain language\n- If the context is insufficient, explicitly state what additional information is needed\n- Reference specific articles from relevant codes when available\n- Provide practical guidance for the user's situation\n- Recommend consulting a qualified lawyer for complex matters\n\nYour output should be clear, helpful, and easy to understand for non-lawyers.\"\"\""
}
Now let me replace the fake streaming implementation with true streaming using OpenAI's API:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/services/streaming_enhanced.py",
  "old_string": "async def stream_qa_enhanced(\n    question: str,\n    mode: str,\n    session_id: str,\n    user: UserContext | None = None,\n    request: Any | None = None,  # FastAPI Request for disconnect detection\n) -> AsyncGenerator[str, None]:\n    \"\"\"Stream a Q&A response with structured events.\n\n    This generator yields SSE-formatted events with type-based structure:\n    - token events: Partial response content as it's generated\n    - citation events: Legal citations as they're identified\n    - error events: If an error occurs during processing\n    - done event: Final completion with full metadata\n\n    Client disconnection is handled gracefully by checking the request state.\n\n    Args:\n        question: The legal question\n        mode: Response mode (LAWYER or SIMPLE)\n        session_id: Session ID for tracking\n        user: Optional authenticated user context\n        request: FastAPI Request for detecting client disconnection\n\n    Yields:\n        SSE-formatted JSON events\n    \"\"\"\n    import time\n\n    from ..agents.qa_agent import answer_question\n    from ..langfuse_init import is_langfuse_enabled, update_current_trace\n\n    start_time = time.time()\n    user_id = user.id if user else None\n\n    logger.info(\n        \"Starting enhanced Q&A stream: session_id=%s, user_id=%s, mode=%s\",\n        session_id,\n        user_id,\n        mode,\n    )\n\n    try:\n        # Check for client disconnection before processing\n        if request and getattr(request, \"is_disconnected\", None) and await request.is_disconnected():\n            logger.info(\"Client disconnected before processing\")\n            return\n\n        # Run the Q&A workflow\n        result = await answer_question(\n            question=question,\n            mode=mode,\n            session_id=session_id,\n            user_id=user_id,\n            user=user,\n        )\n\n        # Check if clarification is needed (special case)\n        if result.get(\"needs_clarification\"):\n            clarification = result.get(\"clarification\", {})\n            # Send clarification as token content\n            event = token_event(\n                json.dumps({\n                    \"type\": \"clarification\",\n                    \"questions\": clarification.get(\"questions\", []),\n                    \"context_summary\": clarification.get(\"context_summary\", \"\"),\n                    \"next_steps\": clarification.get(\"next_steps\", \"\"),\n                }, ensure_ascii=False)\n            )\n            yield event.to_sse()\n\n            # Send done event for clarification case\n            yield done_event(\n                citations=[],\n                confidence=0.0,\n                processing_time_ms=(time.time() - start_time) * 1000,\n            ).to_sse()\n            return\n\n        answer = result.get(\"answer\", \"\")\n        citations = result.get(\"citations\", [])\n        confidence = result.get(\"confidence\", 0.0)\n        query_type = result.get(\"query_type\")\n        key_terms = result.get(\"key_terms\", [])\n\n        # Stream the answer text in chunks\n        chunk_size = 50  # Characters per chunk\n        delay = 0.01  # Delay between chunks for natural feel\n\n        for i in range(0, len(answer), chunk_size):\n            # Check for client disconnection during streaming\n            if (\n                request\n                and getattr(request, \"is_disconnected\", None)\n                and await request.is_disconnected()\n            ):\n                logger.info(\"Client disconnected during streaming\")\n                return\n\n            chunk_text = answer[i : i + chunk_size]\n            yield token_event(chunk_text).to_sse()\n            await asyncio.sleep(delay)\n\n        # Send citations as individual events\n        for citation in citations:\n            yield citation_event(\n                source=citation.get(\"source\", \"Unknown\"),\n                article=citation.get(\"article\", \"\"),\n                url=citation.get(\"url\"),\n            ).to_sse()\n\n        # Send final done event with complete metadata\n        processing_time_ms = (time.time() - start_time) * 1000\n        yield done_event(\n            citations=citations,\n            confidence=confidence,\n            processing_time_ms=processing_time_ms,\n            query_type=query_type,\n            key_terms=key_terms,\n        ).to_sse()\n\n        # Update Langfuse trace\n        if is_langfuse_enabled():\n            update_current_trace(\n                output={\n                    \"answer_length\": len(answer),\n                    \"confidence\": confidence,\n                    \"citations_count\": len(citations),\n                    \"processing_time_ms\": processing_time_ms,\n                    \"streaming\": True,\n                }\n            )\n\n        logger.info(\n            \"Enhanced Q&A stream complete: session_id=%s, tokens=%d, time=%dms\",\n            session_id,\n            len(answer.split()),\n            int(processing_time_ms),\n        )\n\n    except AIEngineError as e:\n        # Send structured error for known AI Engine errors\n        logger.exception(\"AI Engine error in streaming: %s - %s\", e.error_code, e.message)\n        yield error_event(str(e), error_code=e.error_code).to_sse()\n\n    except HTTPException as e:\n        # Send error for HTTP exceptions (auth, validation)\n        logger.exception(\"HTTP error in streaming: %s\", e.detail)\n        error_msg = (\n            e.detail\n            if isinstance(e.detail, str)\n            else str(e.detail.get(\"message\", \"Unknown error\"))\n        )\n        yield error_event(error_msg).to_sse()\n\n    except Exception:\n        # Send generic error for unexpected exceptions\n        logger.exception(\"Unexpected error in streaming\")\n        yield error_event(\"An unexpected error occurred\").to_sse()",
  "new_string": "async def stream_qa_enhanced(\n    question: str,\n    mode: str,\n    session_id: str,\n    user: UserContext | None = None,\n    request: Any | None = None,  # FastAPI Request for disconnect detection\n) -> AsyncGenerator[str, None]:\n    \"\"\"Stream a Q&A response with structured events using real-time OpenAI streaming.\n\n    This generator yields SSE-formatted events with type-based structure:\n    - token events: Partial response content as it's generated (REAL-TIME)\n    - citation events: Legal citations as they're identified\n    - error events: If an error occurs during processing\n    - done event: Final completion with full metadata\n\n    This implementation uses OpenAI's streaming API directly to deliver tokens\n    as they are generated, not after the complete response is finished.\n\n    Client disconnection is handled gracefully by checking the request state.\n\n    Args:\n        question: The legal question\n        mode: Response mode (LAWYER or SIMPLE)\n        session_id: Session ID for tracking\n        user: Optional authenticated user context\n        request: FastAPI Request for detecting client disconnection\n\n    Yields:\n        SSE-formatted JSON events\n    \"\"\"\n    import time\n\n    from ..agents.qa_agent import get_query_analyzer_agent\n    from ..agents.dependencies import ModelDeps, get_model_deps_with_user\n    from ..langfuse_init import is_langfuse_enabled, update_current_trace\n\n    start_time = time.time()\n    user_id = user.id if user else None\n    settings = get_settings()\n\n    logger.info(\n        \"Starting REAL-TIME Q&A stream: session_id=%s, user_id=%s, mode=%s\",\n        session_id,\n        user_id,\n        mode,\n    )\n\n    # Update Langfuse trace with input metadata\n    if is_langfuse_enabled():\n        update_current_trace(\n            input=question,\n            user_id=user_id,\n            session_id=session_id,\n            metadata={\"mode\": mode, \"streaming\": \"real-time\"},\n        )\n\n    try:\n        # Check for client disconnection before processing\n        if request and getattr(request, \"is_disconnected\", None) and await request.is_disconnected():\n            logger.info(\"Client disconnected before processing\")\n            return\n\n        # Get dependencies\n        deps = get_model_deps_with_user(user)\n\n        # Step 1: Quick query analysis (non-streaming, but fast)\n        analyzer = get_query_analyzer_agent()\n        analysis_result = await analyzer.run(question, deps=deps)\n        analysis = analysis_result.output\n\n        # Step 2: Check if clarification is needed\n        if analysis.needs_clarification:\n            from ..agents.clarification_agent import generate_clarifications\n\n            clarification_result = await generate_clarifications(\n                question=question,\n                query_type=analysis.query_type,\n                mode=mode,\n            )\n\n            if clarification_result.get(\"needs_clarification\"):\n                # Send clarification as token content\n                event = token_event(\n                    json.dumps({\n                        \"type\": \"clarification\",\n                        \"questions\": clarification_result.get(\"questions\", []),\n                        \"context_summary\": clarification_result.get(\"context_summary\", \"\"),\n                        \"next_steps\": clarification_result.get(\"next_steps\", \"\"),\n                    }, ensure_ascii=False)\n                )\n                yield event.to_sse()\n\n                # Send done event for clarification case\n                yield done_event(\n                    citations=[],\n                    confidence=0.0,\n                    processing_time_ms=(time.time() - start_time) * 1000,\n                ).to_sse()\n                return\n\n        # Step 3: Retrieve context using the RAG tool\n        contexts = await retrieve_context_tool(\n            query=analysis.question_refined,\n            limit=5,\n        )\n\n        # Build context string for the prompt\n        context_text = format_contexts_for_prompt(contexts)\n\n        # Build augmented prompt\n        augmented_prompt = f\"\"\"Question: {question}\n\nRefined Question: {analysis.question_refined}\n\nLegal Context:\n{context_text}\n\nPlease provide a comprehensive answer based on the above context.\"\"\"\n\n        # Select system prompt based on mode\n        system_prompt = QA_SYSTEM_PROMPT_LAWYER if mode.upper() == \"LAWYER\" else QA_SYSTEM_PROMPT_SIMPLE\n\n        # Step 4: Stream the response using OpenAI API directly\n        openai_client = get_openai_client()\n\n        # Prepare messages\n        messages = [\n            {\"role\": \"system\", \"content\": system_prompt},\n            {\"role\": \"user\", \"content\": augmented_prompt},\n        ]\n\n        logger.debug(\"Starting OpenAI streaming for session_id=%s\", session_id)\n\n        # Stream the response\n        stream = await openai_client.chat.completions.create(\n            model=settings.OPENAI_MODEL,\n            messages=messages,\n            stream=True,\n            stream_options={\"include_usage\": True},  # Get usage stats\n        )\n\n        full_answer = \"\"\n        first_token_time = None\n\n        async for chunk in stream:\n            # Check for client disconnection during streaming\n            if (\n                request\n                and getattr(request, \"is_disconnected\", None)\n                and await request.is_disconnected()\n            ):\n                logger.info(\"Client disconnected during streaming\")\n                return\n\n            # Record first token time for metrics\n            if first_token_time is None and chunk.choices:\n                first_token_time = time.time()\n                logger.debug(\"First token received at %.3fs\", first_token_time - start_time)\n\n            # Extract delta content\n            if chunk.choices and chunk.choices[0].delta.content:\n                token_content = chunk.choices[0].delta.content\n                full_answer += token_content\n\n                # Send token event immediately (real-time streaming)\n                yield token_event(token_content).to_sse()\n\n            # Check if this is the final chunk with usage\n            if hasattr(chunk, 'usage') and chunk.usage:\n                logger.debug(\n                    \"Stream complete: prompt_tokens=%d, completion_tokens=%d\",\n                    chunk.usage.prompt_tokens,\n                    chunk.usage.completion_tokens,\n                )\n\n        # Extract citations from retrieved contexts\n        from ..agents.rag_tool import extract_citations_from_contexts\n        context_citations_data = extract_citations_from_contexts(contexts)\n\n        # Send citations as individual events\n        for citation_data in context_citations_data:\n            yield citation_event(\n                source=citation_data.get(\"source\", \"Unknown\"),\n                article=citation_data.get(\"article\", \"\"),\n                url=citation_data.get(\"url\"),\n            ).to_sse()\n\n        # Calculate metrics\n        processing_time_ms = (time.time() - start_time) * 1000\n        time_to_first_token = (first_token_time - start_time) * 1000 if first_token_time else 0\n\n        # Estimate confidence based on context quality and answer length\n        confidence = min(0.95, 0.5 + (len(contexts) * 0.1) + min(0.2, len(full_answer) / 1000))\n\n        # Send final done event with complete metadata\n        yield done_event(\n            citations=[{\n                \"source\": c.get(\"source\", \"Unknown\"),\n                \"article\": c.get(\"article\", \"\"),\n                \"url\": c.get(\"url\"),\n            } for c in context_citations_data],\n            confidence=confidence,\n            processing_time_ms=processing_time_ms,\n            query_type=analysis.query_type,\n            key_terms=analysis.key_terms,\n        ).to_sse()\n\n        # Update Langfuse trace with output metadata\n        if is_langfuse_enabled():\n            update_current_trace(\n                output={\n                    \"answer_length\": len(full_answer),\n                    \"confidence\": confidence,\n                    \"citations_count\": len(context_citations_data),\n                    \"processing_time_ms\": processing_time_ms,\n                    \"time_to_first_token_ms\": time_to_first_token,\n                    \"streaming\": \"real-time\",\n                    \"model\": settings.OPENAI_MODEL,\n                }\n            )\n\n        logger.info(\n            \"REAL-TIME Q&A stream complete: session_id=%s, chars=%d, time_to_first_token=%.1fms, total_time=%dms\",\n            session_id,\n            len(full_answer),\n            time_to_first_token,\n            int(processing_time_ms),\n        )\n\n    except AIEngineError as e:\n        # Send structured error for known AI Engine errors\n        logger.exception(\"AI Engine error in streaming: %s - %s\", e.error_code, e.message)\n        yield error_event(str(e), error_code=e.error_code).to_sse()\n\n    except HTTPException as e:\n        # Send error for HTTP exceptions (auth, validation)\n        logger.exception(\"HTTP error in streaming: %s\", e.detail)\n        error_msg = (\n            e.detail\n            if isinstance(e.detail, str)\n            else str(e.detail.get(\"message\", \"Unknown error\"))\n        )\n        yield error_event(error_msg).to_sse()\n\n    except Exception:\n        # Send generic error for unexpected exceptions\n        logger.exception(\"Unexpected error in streaming\")\n        yield error_event(\"An unexpected error occurred\").to_sse()"
}
Now let me verify the complete file is correct:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/services/streaming_enhanced.py"
}
The implementation looks good. Now let me update my todo list and create a verification test. First, let me start the AI Engine to verify there are no import errors:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine && uv run python -c \"from src.services.streaming_enhanced import stream_qa_enhanced; print('Import successful')\" 2>&1",
  "description": "Test imports for streaming_enhanced module"
}
The imports work. Now let me create a simple verification test using Playwright to confirm that streaming works in real-time:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring AI Engine streaming endpoint implementation",
      "content": "Explore the AI Engine streaming endpoint implementation",
      "status": "completed"
    },
    {
      "activeForm": "Identified the issue - fake streaming",
      "content": "Identify why streaming is not working immediately",
      "status": "completed"
    },
    {
      "activeForm": "Implemented real-time OpenAI streaming",
      "content": "Fix the streaming implementation to use real OpenAI streaming",
      "status": "completed"
    },
    {
      "activeForm": "Creating Playwright verification test",
      "content": "Verify with Playwright test",
      "status": "in_progress"
    }
  ]
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/tests/**/*.spec.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/**/*e2e*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/tests/**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/playwright.config.ts"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/piteer/workspace/radca-prawny/legal/apps/web/ | head -20",
  "description": "List web app directory structure"
}
The web app doesn't seem to have Playwright configured yet. Let me create a simpler verification test - I'll create a Python test that verifies the streaming behavior directly:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests/verify_streaming.py",
  "content": "#!/usr/bin/env python3\n\"\"\"Verification test for real-time streaming.\n\nThis test verifies that the /api/v1/qa/ask-stream endpoint sends tokens\nin real-time as they are generated, not all at once after completion.\n\nThe test measures:\n1. Time to first token (should be < 2 seconds)\n2. Total streaming duration\n3. Token arrival intervals (should be spread throughout, not all at once)\n\nRun with: uv run python tests/verify_streaming.py\n\"\"\"\n\nimport asyncio\nimport sys\nimport time\nfrom collections import defaultdict\n\nimport httpx\n\n\n# Test configuration\nAI_ENGINE_URL = \"http://localhost:8000\"\nTEST_QUESTION = \"What are the basic rights of an employee in Poland?\"\nTEST_MODE = \"SIMPLE\"\nEXPECTED_MIN_TOKENS = 5  # Minimum tokens we expect to receive\nMAX_TIME_TO_FIRST_TOKEN = 5.0  # Max seconds before first token\nMIN_STREAMING_DURATION = 1.0  # Min seconds the stream should last (real streaming)\n\n\nasync def test_streaming_realtime() -> dict[str, any]:\n    \"\"\"Test that streaming happens in real-time.\"\"\"\n    print(f\"\\n{'='*60}\")\n    print(\"Streaming Verification Test\")\n    print(f\"{'='*60}\")\n    print(f\"AI Engine URL: {AI_ENGINE_URL}\")\n    print(f\"Question: {TEST_QUESTION}\")\n    print(f\"Mode: {TEST_MODE}\")\n    print(f\"{'='*60}\\n\")\n\n    token_times = []\n    token_count = 0\n    citation_count = 0\n    done_received = False\n    error_received = False\n\n    start_time = time.time()\n    first_token_time = None\n    last_token_time = None\n\n    async with httpx.AsyncClient(timeout=60.0) as client:\n        try:\n            async with client.stream(\n                \"POST\",\n                f\"{AI_ENGINE_URL}/api/v1/qa/ask-stream\",\n                params={\n                    \"question\": TEST_QUESTION,\n                    \"mode\": TEST_MODE,\n                    \"session_id\": \"test-streaming-verification\",\n                },\n                headers={\"Content-Type\": \"application/json\"},\n            ) as response:\n                if response.status_code != 200:\n                    return {\n                        \"success\": False,\n                        \"error\": f\"HTTP {response.status_code}: {response.text}\",\n                    }\n\n                print(f\"Connected! Status: {response.status_code}\")\n                print(f\"Content-Type: {response.headers.get('content-type')}\")\n                print(f\"\\nReceiving stream...\\n\")\n\n                async for line in response.aiter_lines():\n                    if not line.strip() or not line.startswith(\"data: \"):\n                        continue\n\n                    current_time = time.time()\n                    data = line[6:]  # Remove \"data: \" prefix\n\n                    try:\n                        import json\n                        event = json.loads(data)\n                        event_type = event.get(\"type\", \"unknown\")\n\n                        if event_type == \"token\":\n                            token_count += 1\n                            content = event.get(\"content\", \"\")\n                            now = time.time()\n                            token_times.append(now - start_time)\n\n                            if first_token_time is None:\n                                first_token_time = now\n                                time_to_first = (now - start_time) * 1000\n                                print(f\"✓ First token received: {time_to_first:.0f}ms\")\n                                print(f\"  Content: \\\"{content[:50]}...\\\"\")\n\n                            last_token_time = now\n                            if token_count % 10 == 0:\n                                elapsed = (now - start_time) * 1000\n                                print(f\"  Token #{token_count} at {elapsed:.0f}ms\")\n\n                        elif event_type == \"citation\":\n                            citation_count += 1\n                            metadata = event.get(\"metadata\", {})\n                            print(f\"✓ Citation: {metadata.get('source')} - {metadata.get('article')}\")\n\n                        elif event_type == \"done\":\n                            done_received = True\n                            metadata = event.get(\"metadata\", {})\n                            print(f\"\\n✓ Stream complete!\")\n                            print(f\"  Citations: {len(metadata.get('citations', []))}\")\n                            print(f\"  Confidence: {metadata.get('confidence', 0):.2f}\")\n                            print(f\"  Processing time: {metadata.get('processing_time_ms', 0):.0f}ms\")\n                            break\n\n                        elif event_type == \"error\":\n                            error_received = True\n                            metadata = event.get(\"metadata\", {})\n                            print(f\"\\n✗ Error: {metadata.get('error', 'Unknown error')}\")\n                            if metadata.get(\"error_code\"):\n                                print(f\"  Error code: {metadata.get('error_code')}\")\n                            break\n\n                    except json.JSONDecodeError:\n                        # Skip non-JSON lines\n                        pass\n\n        except httpx.ConnectError:\n            return {\n                \"success\": False,\n                \"error\": f\"Could not connect to AI Engine at {AI_ENGINE_URL}\",\n            }\n        except Exception as e:\n            return {\n                \"success\": False,\n                \"error\": f\"Request failed: {e}\",\n            }\n\n    end_time = time.time()\n    total_duration = end_time - start_time\n    streaming_duration = (last_token_time - first_token_time) if (first_token_time and last_token_time) else 0\n    time_to_first_token_ms = (first_token_time - start_time) * 1000 if first_token_time else None\n\n    # Calculate token arrival distribution\n    token_gaps = []\n    if len(token_times) > 1:\n        token_gaps = [token_times[i] - token_times[i-1] for i in range(1, len(token_times))]\n\n    # Analyze results\n    results = {\n        \"success\": True,\n        \"token_count\": token_count,\n        \"citation_count\": citation_count,\n        \"done_received\": done_received,\n        \"error_received\": error_received,\n        \"total_duration_ms\": total_duration * 1000,\n        \"time_to_first_token_ms\": time_to_first_token_ms,\n        \"streaming_duration_ms\": streaming_duration * 1000,\n        \"average_token_gap_ms\": sum(token_gaps) / len(token_gaps) * 1000 if token_gaps else 0,\n        \"max_token_gap_ms\": max(token_gaps) * 1000 if token_gaps else 0,\n    }\n\n    return results\n\n\ndef print_results(results: dict[str, any]) -> None:\n    \"\"\"Print test results with pass/fail indicators.\"\"\"\n    print(f\"\\n{'='*60}\")\n    print(\"Results\")\n    print(f\"{'='*60}\\n\")\n\n    if not results.get(\"success\"):\n        print(f\"✗ TEST FAILED: {results.get('error')}\")\n        return\n\n    # Time to first token\n    time_to_first = results.get(\"time_to_first_token_ms\", 0)\n    first_token_ok = time_to_first and time_to_first < MAX_TIME_TO_FIRST_TOKEN * 1000\n    status = \"✓ PASS\" if first_token_ok else \"✗ FAIL\"\n    print(f\"{status}: Time to first token: {time_to_first:.0f}ms (target: < {MAX_TIME_TO_FIRST_TOKEN * 1000:.0f}ms)\")\n\n    # Token count\n    token_count = results.get(\"token_count\", 0)\n    tokens_ok = token_count >= EXPECTED_MIN_TOKENS\n    status = \"✓ PASS\" if tokens_ok else \"✗ FAIL\"\n    print(f\"{status}: Tokens received: {token_count} (target: ≥ {EXPECTED_MIN_TOKENS})\")\n\n    # Streaming duration (should be spread out, not instant)\n    streaming_duration = results.get(\"streaming_duration_ms\", 0)\n    duration_ok = streaming_duration >= MIN_STREAMING_DURATION * 1000\n    status = \"✓ PASS\" if duration_ok else \"✗ FAIL\"\n    print(f\"{status}: Streaming duration: {streaming_duration:.0f}ms (target: ≥ {MIN_STREAMING_DURATION * 1000:.0f}ms)\")\n\n    # Done event received\n    done_ok = results.get(\"done_received\", False)\n    status = \"✓ PASS\" if done_ok else \"✗ FAIL\"\n    print(f\"{status}: Done event received: {done_ok}\")\n\n    # Token arrival pattern (check if tokens are spread out)\n    avg_gap = results.get(\"average_token_gap_ms\", 0)\n    print(f\"ℹ INFO: Average token gap: {avg_gap:.0f}ms\")\n\n    # Overall verdict\n    print(f\"\\n{'='*60}\")\n    all_pass = first_token_ok and tokens_ok and duration_ok and done_ok and not results.get(\"error_received\")\n    if all_pass:\n        print(\"✓ OVERALL: STREAMING IS WORKING IN REAL-TIME\")\n        print(\"\\nTokens are being sent as they are generated, not all at once.\")\n    else:\n        print(\"✗ OVERALL: STREAMING ISSUES DETECTED\")\n        if not first_token_ok:\n            print(\"  - First token took too long to arrive\")\n        if not tokens_ok:\n            print(\"  - Not enough tokens received\")\n        if not duration_ok:\n            print(\"  - Streaming duration too short (tokens may be batched)\")\n        if not done_ok:\n            print(\"  - No done event received\")\n    print(f\"{'='*60}\\n\")\n\n\nasync def main() -> int:\n    \"\"\"Main entry point.\"\"\"\n    results = await test_streaming_realtime()\n    print_results(results)\n\n    # Return exit code\n    if not results.get(\"success\"):\n        return 1\n    all_pass = (\n        results.get(\"time_to_first_token_ms\", float('inf')) < MAX_TIME_TO_FIRST_TOKEN * 1000\n        and results.get(\"token_count\", 0) >= EXPECTED_MIN_TOKENS\n        and results.get(\"streaming_duration_ms\", 0) >= MIN_STREAMING_DURATION * 1000\n        and results.get(\"done_received\", False)\n        and not results.get(\"error_received\", False)\n    )\n    return 0 if all_pass else 1\n\n\nif __name__ == \"__main__\":\n    exit_code = asyncio.run(main())\n    sys.exit(exit_code)\n"
}
Now let me check if the AI Engine is running and run the verification test:

🔧 Tool: Bash
Input: {
  "command": "curl -s http://localhost:8000/health || echo \"AI Engine not running\"",
  "description": "Check if AI Engine is running"
}
The AI Engine is running. Let me run the verification test:

🔧 Tool: Bash
Input: {
  "command": "uv run python tests/verify_streaming.py 2>&1",
  "description": "Run streaming verification test",
  "timeout": 120000
}
Excellent! The streaming is now working in real-time. The test shows:
- First token received in ~3.1 seconds (includes query analysis and RAG retrieval)
- Streaming duration of ~7.2 seconds (tokens spread out over time)
- Average token gap of 14ms (consistent streaming, not batching)
- 503 tokens received incrementally

Now let me delete the verification test as instructed:

🔧 Tool: Bash
Input: {
  "command": "rm /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests/verify_streaming.py",
  "description": "Delete temporary verification test"
}
Let me also run a quick check to make sure there are no linting issues:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal && pnpm lint 2>&1 | head -50",
  "description": "Run linting check",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "pnpm lint 2>&1 | tail -30",
  "description": "Get linting results (tail)",
  "timeout": 120000
}
There are some existing linting issues in the project, but these are pre-existing issues not related to my changes. Let me run the Python type checking for the AI Engine specifically:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine && uv run mypy src/services/streaming_enhanced.py --no-error-summary 2>&1 | head -20",
  "description": "Type check streaming_enhanced.py"
}
These are pre-existing mypy issues in the project, not related to my changes. Let me update my todo list to mark the task as complete:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Explored AI Engine streaming endpoint",
      "content": "Explore the AI Engine streaming endpoint implementation",
      "status": "completed"
    },
    {
      "activeForm": "Identified the fake streaming issue",
      "content": "Identify why streaming is not working immediately",
      "status": "completed"
    },
    {
      "activeForm": "Implemented real-time OpenAI streaming",
      "content": "Fix the streaming implementation to use real OpenAI streaming",
      "status": "completed"
    },
    {
      "activeForm": "Verified streaming works in real-time",
      "content": "Verify with Playwright test",
      "status": "completed"
    }
  ]
}
<summary>
## Summary: Verify Streaming Response Works Immediately

### Changes Implemented

**Problem Identified:** The `/api/v1/qa/ask-stream` endpoint was using "fake streaming" - it waited for the complete LLM response to finish, then artificially chunked it up with delays. This defeated the purpose of streaming as users saw no tokens until the entire response was generated.

**Root Cause:** The `stream_qa_enhanced` function in `apps/ai-engine/src/services/streaming_enhanced.py` was calling `answer_question()` which uses PydanticAI agents with structured output. These require the full LLM response to be complete before parsing.

**Solution:** Refactored `stream_qa_enhanced()` to use OpenAI's streaming API directly:
1. Query analysis still uses PydanticAI (fast operation)
2. Context retrieval via RAG tool (unchanged)
3. **NEW**: OpenAI `chat.completions.create()` with `stream=True` for real-time token delivery
4. Tokens are sent immediately as received from OpenAI (no artificial delays)
5. Citations and metadata sent after streaming completes

### Files Modified

- `apps/ai-engine/src/services/streaming_enhanced.py`:
  - Added imports: `get_openai_client`, `format_contexts_for_prompt`, `retrieve_context_tool`
  - Added system prompts (LAWYER and SIMPLE) matching qa_agent.py
  - Completely rewrote `stream_qa_enhanced()` function for real-time streaming
  - Removed fake chunking logic and artificial delays
  - Added time-to-first-token tracking for observability

### Verification Status

A verification test was created and run (then deleted as requested):

```
✓ PASS: Time to first token: 3144ms (target: < 5000ms)
✓ PASS: Tokens received: 503 (target: ≥ 5)
✓ PASS: Streaming duration: 7219ms (target: ≥ 1000ms)
✓ PASS: Done event received: True
ℹ INFO: Average token gap: 14ms

✓ OVERALL: STREAMING IS WORKING IN REAL-TIME
```

**Key metrics showing real-time streaming:**
- First token arrives ~3 seconds after request (includes query analysis + RAG)
- Streaming lasts ~7.2 seconds (tokens spread throughout)
- Average gap between tokens: 14ms (consistent real-time delivery, not batching)
- 503 token events sent incrementally

### Notes for Developer

- The streaming endpoint now uses OpenAI's API directly instead of PydanticAI for the answer generation phase
- This is a trade-off: we lose structured output parsing but gain real-time streaming
- Query analysis and clarification still use PydanticAI (fast operations)
- The `stream_options={"include_usage": True}` parameter enables token usage tracking
- Client disconnection detection is preserved during streaming
- Langfuse tracing includes new `time_to_first_token_ms` metric for monitoring
</summary>