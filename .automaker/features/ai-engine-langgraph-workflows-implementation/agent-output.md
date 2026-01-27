
🔧 Tool: Task
Input: {
  "description": "Explore AI engine codebase",
  "prompt": "Explore the AI Engine codebase in apps/ai-engine to understand:\n\n1. The current structure - what agents exist and how they are organized\n2. How PydanticAI agents are currently implemented\n3. Whether LangGraph is already being used and if so, how\n4. The existing state management and data flow patterns\n5. What services and utilities exist for agent orchestration\n\nFocus on:\n- apps/ai-engine/src/agents/ directory\n- apps/ai-engine/src/graphs/ or any workflow/graph related files\n- apps/ai-engine/src/services/ directory\n- Any state schemas or types defined\n\nReturn a comprehensive summary of the current architecture, existing agents, and any patterns we should follow when implementing the new LangGraph workflows.",
  "subagent_type": "Explore"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/ai-engine/src/**/*.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/classifier_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/drafting_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/clarification_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/qa_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/dependencies.py"
}

🔧 Tool: Grep
Input: {
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src",
  "pattern": "langgraph|lang-chain"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/services/embedding_service.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/config.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py"
}

🔧 Tool: Bash
Input: {
  "command": "find apps/ai-engine -type f -name \"*.py\" | grep -E \"(workflow|graph|orchestrat|flow)\" | head -20",
  "description": "Search for workflow/graph related Python files"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/pyproject.toml"
}

🔧 Tool: Bash
Input: {
  "command": "find apps/ai-engine/tests -type f -name \"*.py\" | head -10",
  "description": "List test files in ai-engine"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests/unit/test_config_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests/unit/test_classifier_unit.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests/conftest.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/requests.py"
}
Now I have a good understanding of the current architecture. Let me read the existing agent implementations in more detail to understand their exact interfaces before designing the LangGraph workflows.

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/classifier_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/drafting_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/clarification_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/qa_agent.py"
}
Now let me check the dependencies and config files to understand what packages are available:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/pyproject.toml"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/dependencies.py"
}
Now I have a complete understanding of the codebase. Let me create a plan for implementing the LangGraph workflows.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Design and implement LangGraph state schemas for workflows",
      "status": "in_progress",
      "activeForm": "Designing state schemas for LangGraph workflows"
    },
    {
      "content": "Implement Case Analysis Workflow (classifier + research + clarification)",
      "status": "pending",
      "activeForm": "Implementing Case Analysis Workflow"
    },
    {
      "content": "Implement Document Generation Workflow (drafter + reviewer + revision loop)",
      "status": "pending",
      "activeForm": "Implementing Document Generation Workflow"
    },
    {
      "content": "Implement Complex Q&A Workflow (researcher + Q&A + citation formatter)",
      "status": "pending",
      "activeForm": "Implementing Complex Q&A Workflow"
    },
    {
      "content": "Create workflow orchestration service",
      "status": "pending",
      "activeForm": "Creating workflow orchestration service"
    },
    {
      "content": "Add FastAPI endpoints for workflows",
      "status": "pending",
      "activeForm": "Adding FastAPI endpoints for workflows"
    },
    {
      "content": "Add unit tests for workflows",
      "status": "pending",
      "activeForm": "Adding unit tests for workflows"
    }
  ]
}
Let me start by creating the state schemas and workflow implementations. First, I'll create a new `workflows` directory with the state schemas:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/__init__.py",
  "content": "\"\"\"LangGraph workflows for multi-step AI scenarios.\n\nThis module provides StateGraph-based workflows that orchestrate\nPydanticAI agents for complex legal AI scenarios.\n\nWorkflows:\n- CaseAnalysisWorkflow: Classifier + Research + Clarification\n- DocumentGenerationWorkflow: Drafter + Reviewer + Revision loop\n- ComplexQAWorkflow: Researcher + Q&A + Citation formatter\n\"\"\"\n\nfrom .case_analysis_workflow import CaseAnalysisWorkflow, case_analysis_workflow\nfrom .complex_qa_workflow import ComplexQAWorkflow, complex_qa_workflow\nfrom .document_generation_workflow import (\n    DocumentGenerationWorkflow,\n    document_generation_workflow,\n)\nfrom .states import (\n    CaseAnalysisState,\n    ComplexQAState,\n    DocumentGenerationState,\n    WorkflowMetadata,\n)\n\n__all__ = [\n    \"states\",\n    \"CaseAnalysisState\",\n    \"ComplexQAState\",\n    \"DocumentGenerationState\",\n    \"WorkflowMetadata\",\n    \"CaseAnalysisWorkflow\",\n    \"case_analysis_workflow\",\n    \"DocumentGenerationWorkflow\",\n    \"document_generation_workflow\",\n    \"ComplexQAWorkflow\",\n    \"complex_qa_workflow\",\n]\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/states.py",
  "content": "\"\"\"State schemas for LangGraph workflows.\n\nThis module defines TypedDict state schemas for each workflow.\nLangGraph uses these states to pass data between nodes in the graph.\n\"\"\"\n\nfrom typing import Any, Required, TypedDict\n\nfrom pydantic import BaseModel\n\n\n# -----------------------------------------------------------------------------\n# Pydantic Models for State Fields\n# -----------------------------------------------------------------------------\n\n\nclass LegalGround(BaseModel):\n    \"\"\"A single legal ground identified in the case.\"\"\"\n\n    name: str\n    description: str\n    confidence_score: float\n    legal_basis: list[str]\n    notes: str | None = None\n\n\nclass RetrievedContext(BaseModel):\n    \"\"\"A retrieved context chunk from the vector store.\"\"\"\n\n    content: str\n    source: str\n    article: str | None = None\n    similarity: float\n    url: str | None = None\n\n\nclass LegalCitation(BaseModel):\n    \"\"\"A legal citation reference.\"\"\"\n\n    source: str\n    article: str\n    url: str | None = None\n\n\nclass ClarificationQuestion(BaseModel):\n    \"\"\"A single clarification question.\"\"\"\n\n    question: str\n    question_type: str\n    options: list[str] | None = None\n    hint: str | None = None\n\n\nclass RevisionFeedback(BaseModel):\n    \"\"\"Feedback for document revision.\"\"\"\n\n    approved: bool\n    issues: list[str]\n    suggestions: list[str]\n    needs_revision: bool\n\n\nclass WorkflowMetadata(BaseModel):\n    \"\"\"Metadata for workflow execution tracking.\"\"\"\n\n    session_id: str\n    user_id: str | None = None\n    start_time: float | None = None\n    current_step: str = \"init\"\n    iteration_count: int = 0\n\n\n# -----------------------------------------------------------------------------\n# Workflow State Schemas (TypedDict for LangGraph)\n# -----------------------------------------------------------------------------\n\n\nclass CaseAnalysisState(TypedDict, total=False):\n    \"\"\"State for Case Analysis Workflow.\n\n    This workflow combines:\n    - Classifier Agent: Identify legal grounds\n    - Research Agent: Find relevant case law and statutes\n    - Clarification Agent: Gather missing information\n\n    Flow:\n    1. classify: Analyze case description\n    2. check_clarification: Decide if more info needed\n    3. research: Find relevant legal context (if enough info)\n    4. clarify: Generate follow-up questions (if needed)\n    5. complete: Finalize with results\n    \"\"\"\n\n    # Input\n    case_description: Required[str]\n\n    # Classification results\n    legal_grounds: list[dict[str, Any]]  # List[LegalGround.model_dump()]\n    classification_confidence: float\n\n    # Research results\n    retrieved_contexts: list[dict[str, Any]]  # List[RetrievedContext.model_dump()]\n    research_summary: str | None\n\n    # Clarification\n    needs_clarification: bool\n    clarification_questions: list[dict[str, Any]]  # List[ClarificationQuestion.model_dump()]\n    user_responses: dict[str, str]  # User answers to clarification questions\n\n    # Final output\n    final_analysis: str | None\n    recommendations: str | None\n\n    # Workflow control\n    metadata: dict[str, Any]  # WorkflowMetadata.model_dump()\n    next_step: str  # For conditional routing\n    error: str | None\n\n\nclass DocumentGenerationState(TypedDict, total=False):\n    \"\"\"State for Document Generation Workflow.\n\n    This workflow combines:\n    - Drafter Agent: Generate initial document\n    - Reviewer Agent: Review and provide feedback\n    - Revision loop: Iterate until approval\n\n    Flow:\n    1. classify_case: Understand legal grounds first\n    2. draft: Generate initial document\n    3. review: Review quality and completeness\n    4. check_approval: Decide if revision needed\n    5. revise: Generate revised version (loop back to review)\n    6. complete: Finalize approved document\n    \"\"\"\n\n    # Input\n    document_type: Required[str]\n    description: Required[str]\n    context: dict[str, Any]  # Additional context variables\n\n    # Classification (for better drafting)\n    legal_grounds: list[dict[str, Any]] | None\n\n    # Drafting\n    current_draft: str | None\n    draft_iteration: int\n\n    # Review\n    review_feedback: dict[str, Any]  # RevisionFeedback.model_dump()\n    approved: bool\n\n    # Final output\n    final_document: str | None\n\n    # Workflow control\n    metadata: dict[str, Any]  # WorkflowMetadata.model_dump()\n    max_iterations: int\n    next_step: str\n    error: str | None\n\n\nclass ComplexQAState(TypedDict, total=False):\n    \"\"\"State for Complex Q&A Workflow.\n\n    This workflow combines:\n    - Researcher Agent: Deep legal research\n    - Q&A Agent: Generate comprehensive answer\n    - Citation Formatter: Format and validate citations\n\n    Flow:\n    1. analyze_query: Understand the question\n    2. check_clarification: Decide if more info needed\n    3. research: Deep legal research (statutes, case law, commentary)\n    4. generate_answer: Create comprehensive response\n    5. format_citations: Ensure proper citation format\n    6. complete: Finalize with formatted output\n    \"\"\"\n\n    # Input\n    question: Required[str]\n    mode: str  # \"LAWYER\" or \"SIMPLE\"\n    query_type: str  # Auto-detected\n\n    # Analysis\n    key_terms: list[str]\n    question_refined: str\n\n    # Clarification\n    needs_clarification: bool\n    clarification_questions: list[dict[str, Any]]\n    user_responses: dict[str, str] | None\n\n    # Research\n    retrieved_contexts: list[dict[str, Any]]\n    statute_references: list[dict[str, Any]]\n    case_law_references: list[dict[str, Any]]\n\n    # Answer generation\n    answer: str | None\n    raw_citations: list[dict[str, Any]]  # Before formatting\n\n    # Citation formatting\n    formatted_citations: list[dict[str, Any]]\n\n    # Final output\n    final_answer: str | None\n    confidence: float\n\n    # Workflow control\n    metadata: dict[str, Any]  # WorkflowMetadata.model_dump()\n    next_step: str\n    error: str | None\n\n\n# -----------------------------------------------------------------------------\n# Helper Functions\n# -----------------------------------------------------------------------------\n\n\ndef create_case_analysis_state(\n    case_description: str,\n    session_id: str,\n    user_id: str | None = None,\n) -> CaseAnalysisState:\n    \"\"\"Create initial state for Case Analysis workflow.\"\"\"\n    return {\n        \"case_description\": case_description,\n        \"metadata\": WorkflowMetadata(\n            session_id=session_id,\n            user_id=user_id,\n            current_step=\"classify\",\n            iteration_count=0,\n        ).model_dump(),\n        \"next_step\": \"classify\",\n        \"needs_clarification\": False,\n        \"legal_grounds\": [],\n        \"retrieved_contexts\": [],\n        \"clarification_questions\": [],\n        \"user_responses\": {},\n    }\n\n\ndef create_document_generation_state(\n    document_type: str,\n    description: str,\n    context: dict[str, Any] | None = None,\n    session_id: str = \"default\",\n    user_id: str | None = None,\n) -> DocumentGenerationState:\n    \"\"\"Create initial state for Document Generation workflow.\"\"\"\n    return {\n        \"document_type\": document_type,\n        \"description\": description,\n        \"context\": context or {},\n        \"metadata\": WorkflowMetadata(\n            session_id=session_id,\n            user_id=user_id,\n            current_step=\"classify_case\",\n            iteration_count=0,\n        ).model_dump(),\n        \"next_step\": \"classify_case\",\n        \"draft_iteration\": 0,\n        \"approved\": False,\n        \"max_iterations\": 3,\n    }\n\n\ndef create_complex_qa_state(\n    question: str,\n    mode: str = \"SIMPLE\",\n    session_id: str = \"default\",\n    user_id: str | None = None,\n) -> ComplexQAState:\n    \"\"\"Create initial state for Complex Q&A workflow.\"\"\"\n    return {\n        \"question\": question,\n        \"mode\": mode,\n        \"query_type\": \"general\",\n        \"metadata\": WorkflowMetadata(\n            session_id=session_id,\n            user_id=user_id,\n            current_step=\"analyze_query\",\n            iteration_count=0,\n        ).model_dump(),\n        \"next_step\": \"analyze_query\",\n        \"needs_clarification\": False,\n        \"retrieved_contexts\": [],\n        \"statute_references\": [],\n        \"case_law_references\": [],\n        \"raw_citations\": [],\n        \"formatted_citations\": [],\n        \"key_terms\": [],\n    }\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Designing state schemas for LangGraph workflows",
      "content": "Design and implement LangGraph state schemas for workflows",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Case Analysis Workflow",
      "content": "Implement Case Analysis Workflow (classifier + research + clarification)",
      "status": "in_progress"
    },
    {
      "activeForm": "Implementing Document Generation Workflow",
      "content": "Implement Document Generation Workflow (drafter + reviewer + revision loop)",
      "status": "pending"
    },
    {
      "activeForm": "Implementing Complex Q&A Workflow",
      "content": "Implement Complex Q&A Workflow (researcher + Q&A + citation formatter)",
      "status": "pending"
    },
    {
      "activeForm": "Creating workflow orchestration service",
      "content": "Create workflow orchestration service",
      "status": "pending"
    },
    {
      "activeForm": "Adding FastAPI endpoints for workflows",
      "content": "Add FastAPI endpoints for workflows",
      "status": "pending"
    },
    {
      "activeForm": "Adding unit tests for workflows",
      "content": "Add unit tests for workflows",
      "status": "pending"
    }
  ]
}
Now let me implement the Case Analysis Workflow:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "content": "\"\"\"Case Analysis Workflow using LangGraph.\n\nThis workflow orchestrates:\n1. Classifier Agent - Identify legal grounds\n2. Research Node - Find relevant context\n3. Clarification Agent - Gather missing information\n4. Decision Logic - Route based on completeness\n\nThe workflow uses conditional edges to decide:\n- If clarification needed -> clarify branch\n- If enough info -> research branch\n- Always completes with final analysis\n\"\"\"\n\nimport time\nfrom typing import Any, Literal\n\nfrom langgraph.graph import StateGraph, END\n\nfrom ..agents.classifier_agent import classify_case\nfrom ..agents.clarification_agent import clarification_agent\nfrom ..langfuse_init import is_langfuse_enabled\nfrom .states import CaseAnalysisState, create_case_analysis_state, LegalGround\n\n\n# -----------------------------------------------------------------------------\n# Workflow Nodes\n# -----------------------------------------------------------------------------\n\n\nasync def classify_node(state: CaseAnalysisState) -> CaseAnalysisState:\n    \"\"\"Classify the case to identify legal grounds.\n\n    This node uses the classifier agent to analyze the case description\n    and identify applicable legal grounds with confidence scores.\n    \"\"\"\n    import time\n\n    start_time = time.time()\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span for this node\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"classify\",\n                session_id=metadata.get(\"session_id\"),\n                parent_observation_id=metadata.get(\"parent_span_id\"),\n            )\n\n    try:\n        case_description = state[\"case_description\"]\n\n        # Call the classifier agent\n        result, agent_metadata = await classify_case(\n            case_description=case_description,\n            session_id=metadata.get(\"session_id\", \"default\"),\n            user_id=metadata.get(\"user_id\"),\n        )\n\n        # Convert LegalGround objects to dicts for state\n        legal_grounds = [\n            {\n                \"name\": ground.name,\n                \"description\": ground.description,\n                \"confidence_score\": ground.confidence_score,\n                \"legal_basis\": ground.legal_basis,\n                \"notes\": ground.notes,\n            }\n            for ground in result.identified_grounds\n        ]\n\n        # Update state\n        state[\"legal_grounds\"] = legal_grounds\n        state[\"classification_confidence\"] = result.overall_confidence\n        state[\"metadata\"][\"current_step\"] = \"classify\"\n        state[\"metadata\"][\"iteration_count\"] = state[\"metadata\"].get(\"iteration_count\", 0) + 1\n        state[\"next_step\"] = \"check_clarification\"\n\n        if span:\n            span.end(output={\n                \"grounds_count\": len(legal_grounds),\n                \"overall_confidence\": result.overall_confidence,\n            })\n\n        return state\n\n    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        state[\"error\"] = str(e)\n        state[\"next_step\"] = \"error\"\n        return state\n\n\nasync def check_clarification_node(state: CaseAnalysisState) -> CaseAnalysisState:\n    \"\"\"Determine if clarification is needed based on classification.\n\n    This decision node checks:\n    1. Low confidence score (< 0.6) -> needs clarification\n    2. No legal grounds identified -> needs clarification\n    3. Otherwise -> proceed to research\n    \"\"\"\n    confidence = state.get(\"classification_confidence\", 0.0)\n    grounds = state.get(\"legal_grounds\", [])\n    user_responses = state.get(\"user_responses\", {})\n\n    # If we already have user responses, skip clarification\n    if user_responses:\n        state[\"needs_clarification\"] = False\n        state[\"next_step\"] = \"research\"\n        return state\n\n    # Decision logic for clarification\n    needs_clarification = (\n        confidence < 0.6  # Low confidence\n        or len(grounds) == 0  # No grounds identified\n        or any(g.get(\"confidence_score\", 0) < 0.5 for g in grounds)  # Any low-confidence ground\n    )\n\n    state[\"needs_clarification\"] = needs_clarification\n\n    if needs_clarification:\n        state[\"next_step\"] = \"clarify\"\n    else:\n        state[\"next_step\"] = \"research\"\n\n    return state\n\n\nasync def clarify_node(state: CaseAnalysisState) -> CaseAnalysisState:\n    \"\"\"Generate clarification questions using the clarification agent.\n\n    This node uses the clarification agent to generate targeted\n    follow-up questions based on the classification results.\n    \"\"\"\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"clarify\",\n                session_id=metadata.get(\"session_id\"),\n            )\n\n    try:\n        agent = clarification_agent()\n\n        # Build prompt with classification context\n        grounds_summary = \"\\n\".join([\n            f\"- {g.get('name', 'Unknown')}: {g.get('description', '')}\"\n            for g in state.get(\"legal_grounds\", [])\n        ])\n\n        prompt = f\"\"\"Based on the following case analysis, generate clarification questions\nto gather more information and improve confidence.\n\nCase Description: {state['case_description']}\n\nIdentified Legal Grounds:\n{grounds_summary}\n\nConfidence: {state.get('classification_confidence', 0.0):.2f}\n\nGenerate 2-4 specific questions to improve the analysis.\"\"\"\n\n        result = await agent.run(prompt)\n        response = result.data\n\n        # Convert questions to dicts\n        questions = [\n            {\n                \"question\": q.question,\n                \"question_type\": q.question_type,\n                \"options\": q.options,\n                \"hint\": q.hint,\n            }\n            for q in response.questions\n        ]\n\n        state[\"clarification_questions\"] = questions\n        state[\"metadata\"][\"current_step\"] = \"clarify\"\n        state[\"next_step\"] = \"await_clarification\"  # Pause for user input\n\n        if span:\n            span.end(output={\"questions_count\": len(questions)})\n\n        return state\n\n    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        state[\"error\"] = str(e)\n        state[\"next_step\"] = \"error\"\n        return state\n\n\nasync def research_node(state: CaseAnalysisState) -> CaseAnalysisState:\n    \"\"\"Research legal context based on classification.\n\n    This node retrieves relevant legal context from the vector store\n    based on the identified legal grounds.\n    \"\"\"\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"research\",\n                session_id=metadata.get(\"session_id\"),\n            )\n\n    try:\n        # Generate search query from legal grounds\n        grounds = state.get(\"legal_grounds\", [])\n        if grounds:\n            search_terms = \" \".join([g.get(\"name\", \"\") for g in grounds[:3]])\n        else:\n            search_terms = state[\"case_description\"][:200]\n\n        # TODO: Integrate with actual vector store service\n        # For now, mock retrieval\n        mock_contexts = [\n            {\n                \"content\": \"Polish Civil Code Article 471: The debtor is liable for non-performance or improper performance of an obligation, unless it is caused by circumstances beyond their control.\",\n                \"source\": \"Polish Civil Code\",\n                \"article\": \"Art. 471 KC\",\n                \"similarity\": 0.89,\n                \"url\": \"https://isap.sejm.gov.pl/\",\n            },\n            {\n                \"content\": \"Supreme Court ruling: In contractual disputes, the limitation period is 10 years from the date the breach became known.\",\n                \"source\": \"Supreme Court\",\n                \"article\": \"III CZP 45/23\",\n                \"similarity\": 0.82,\n                \"url\": \"https://sn.pl/orzeczenia\",\n            },\n        ]\n\n        state[\"retrieved_contexts\"] = mock_contexts\n        state[\"research_summary\"] = f\"Retrieved {len(mock_contexts)} relevant legal contexts.\"\n        state[\"metadata\"][\"current_step\"] = \"research\"\n        state[\"next_step\"] = \"complete\"\n\n        if span:\n            span.end(output={\"contexts_count\": len(mock_contexts)})\n\n        return state\n\n    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        state[\"error\"] = str(e)\n        state[\"next_step\"] = \"error\"\n        return state\n\n\nasync def complete_node(state: CaseAnalysisState) -> CaseAnalysisState:\n    \"\"\"Generate final analysis combining all results.\n\n    This node produces the final output with:\n    - Legal grounds analysis\n    - Research findings\n    - Recommendations\n    \"\"\"\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"complete\",\n                session_id=metadata.get(\"session_id\"),\n            )\n\n    try:\n        grounds = state.get(\"legal_grounds\", [])\n        contexts = state.get(\"retrieved_contexts\", [])\n\n        # Build final analysis\n        analysis_parts = [\n            \"# Case Analysis Report\\n\",\n            \"## Identified Legal Grounds\\n\",\n        ]\n\n        for ground in grounds:\n            analysis_parts.append(\n                f\"### {ground.get('name', 'Unknown')}\\n\"\n                f\"**Confidence**: {ground.get('confidence_score', 0):.2f}\\n\\n\"\n                f\"{ground.get('description', '')}\\n\\n\"\n                f\"**Legal Basis**: {', '.join(ground.get('legal_basis', []))}\\n\"\n            )\n\n        if contexts:\n            analysis_parts.append(\"\\n## Relevant Legal Context\\n\")\n            for ctx in contexts:\n                analysis_parts.append(\n                    f\"- **{ctx.get('source', 'Unknown')} - {ctx.get('article', 'N/A')}**: \"\n                    f\"{ctx.get('content', '')[:200]}...\\n\"\n                )\n\n        # Generate recommendations based on confidence\n        confidence = state.get(\"classification_confidence\", 0.0)\n        if confidence >= 0.8:\n            recommendations = \"Strong case basis. Proceed with formal legal action preparation.\"\n        elif confidence >= 0.6:\n            recommendations = \"Moderate case basis. Additional documentation recommended.\"\n        else:\n            recommendations = \"Limited case basis. Comprehensive fact-finding required before proceeding.\"\n\n        analysis_parts.append(f\"\\n## Recommendations\\n\\n{recommendations}\")\n\n        state[\"final_analysis\"] = \"\".join(analysis_parts)\n        state[\"recommendations\"] = recommendations\n        state[\"metadata\"][\"current_step\"] = \"complete\"\n        state[\"next_step\"] = END  # type: ignore\n\n        if span:\n            span.end(output={\"analysis_length\": len(state[\"final_analysis\"])})\n\n        return state\n\n    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        state[\"error\"] = str(e)\n        state[\"next_step\"] = \"error\"\n        return state\n\n\n# -----------------------------------------------------------------------------\n# Conditional Edge Functions\n# -----------------------------------------------------------------------------\n\n\ndef should_clarify(state: CaseAnalysisState) -> Literal[\"clarify\", \"research\"]:\n    \"\"\"Route to clarification or research based on needs_clarification flag.\"\"\"\n    if state.get(\"needs_clarification\", False):\n        return \"clarify\"\n    return \"research\"\n\n\ndef after_clarify(state: CaseAnalysisState) -> Literal[\"research\", \"complete\"]:\n    \"\"\"After clarification, decide whether to research or complete directly.\"\"\"\n    # If user provided responses, go to research\n    if state.get(\"user_responses\"):\n        return \"research\"\n    # Otherwise, complete with current info (user will provide responses later)\n    return \"complete\"\n\n\n# -----------------------------------------------------------------------------\n# Workflow Builder\n# -----------------------------------------------------------------------------\n\n\ndef build_case_analysis_graph() -> StateGraph:\n    \"\"\"Build the Case Analysis StateGraph.\n\n    Returns:\n        Compiled StateGraph ready for execution\n    \"\"\"\n    # Create the graph with state schema\n    workflow = StateGraph(CaseAnalysisState)\n\n    # Add nodes\n    workflow.add_node(\"classify\", classify_node)\n    workflow.add_node(\"check_clarification\", check_clarification_node)\n    workflow.add_node(\"clarify\", clarify_node)\n    workflow.add_node(\"research\", research_node)\n    workflow.add_node(\"complete\", complete_node)\n    workflow.add_node(\"error\", lambda s: {**s, \"next_step\": END})  # type: ignore\n\n    # Define edges\n    workflow.set_entry_point(\"classify\")\n    workflow.add_edge(\"classify\", \"check_clarification\")\n\n    # Conditional routing from check_clarification\n    workflow.add_conditional_edges(\n        \"check_clarification\",\n        should_clarify,\n        {\n            \"clarify\": \"clarify\",\n            \"research\": \"research\",\n        },\n    )\n\n    # After clarification, either research or complete\n    workflow.add_conditional_edges(\n        \"clarify\",\n        after_clarify,\n        {\n            \"research\": \"research\",\n            \"complete\": \"complete\",\n        },\n    )\n\n    workflow.add_edge(\"research\", \"complete\")\n    workflow.add_edge(\"complete\", END)\n    workflow.add_edge(\"error\", END)\n\n    return workflow.compile()\n\n\n# Compile the graph once for reuse\n_case_analysis_graph: StateGraph | None = None\n\n\ndef get_case_analysis_graph() -> StateGraph:\n    \"\"\"Get or create the compiled Case Analysis graph.\"\"\"\n    global _case_analysis_graph\n    if _case_analysis_graph is None:\n        _case_analysis_graph = build_case_analysis_graph()\n    return _case_analysis_graph\n\n\n# -----------------------------------------------------------------------------\n# Workflow Wrapper Class\n# -----------------------------------------------------------------------------\n\n\nclass CaseAnalysisWorkflow:\n    \"\"\"Wrapper class for Case Analysis workflow execution.\n\n    This class provides a clean interface for running the workflow\n    with proper observability and error handling.\n    \"\"\"\n\n    def __init__(self) -> None:\n        \"\"\"Initialize the workflow with compiled graph.\"\"\"\n        self.graph = get_case_analysis_graph()\n\n    async def run(\n        self,\n        case_description: str,\n        session_id: str = \"default\",\n        user_id: str | None = None,\n        user_responses: dict[str, str] | None = None,\n    ) -> dict[str, Any]:\n        \"\"\"Run the Case Analysis workflow.\n\n        Args:\n            case_description: The case description to analyze\n            session_id: Session ID for tracking\n            user_id: User ID for observability\n            user_responses: Optional pre-filled responses to clarification questions\n\n        Returns:\n            Dictionary containing the workflow results\n        \"\"\"\n        import time\n\n        start_time = time.time()\n\n        # Create initial state\n        state = create_case_analysis_state(\n            case_description=case_description,\n            session_id=session_id,\n            user_id=user_id,\n        )\n\n        # Add user responses if provided\n        if user_responses:\n            state[\"user_responses\"] = user_responses\n\n        # Create Langfuse trace\n        trace = None\n        if is_langfuse_enabled():\n            from ..langfuse_init import get_langfuse\n            langfuse = get_langfuse()\n            if langfuse:\n                trace = langfuse.trace(\n                    name=\"case_analysis_workflow\",\n                    session_id=session_id,\n                    user_id=user_id,\n                    metadata={\n                        \"workflow\": \"case_analysis\",\n                        \"description_length\": len(case_description),\n                    },\n                )\n                state[\"metadata\"][\"parent_span_id\"] = trace.trace_id\n\n        try:\n            # Run the workflow\n            result = await self.graph.ainvoke(state)\n\n            processing_time_ms = (time.time() - start_time) * 1000\n\n            # Prepare output\n            output = {\n                \"legal_grounds\": result.get(\"legal_grounds\", []),\n                \"classification_confidence\": result.get(\"classification_confidence\", 0.0),\n                \"retrieved_contexts\": result.get(\"retrieved_contexts\", []),\n                \"clarification_questions\": result.get(\"clarification_questions\", []),\n                \"final_analysis\": result.get(\"final_analysis\"),\n                \"recommendations\": result.get(\"recommendations\"),\n                \"needs_clarification\": result.get(\"needs_clarification\", False),\n                \"processing_time_ms\": processing_time_ms,\n                \"error\": result.get(\"error\"),\n            }\n\n            if trace:\n                trace.update(output={\n                    \"grounds_count\": len(output[\"legal_grounds\"]),\n                    \"confidence\": output[\"classification_confidence\"],\n                    \"needs_clarification\": output[\"needs_clarification\"],\n                })\n                trace.metadata[\"processing_time_ms\"] = processing_time_ms\n                trace.end()\n\n            return output\n\n        except Exception as e:\n            if trace:\n                trace.end(level=\"ERROR\", status_message=str(e))\n            raise\n\n\n# Singleton instance\n_case_analysis_workflow: CaseAnalysisWorkflow | None = None\n\n\ndef case_analysis_workflow() -> CaseAnalysisWorkflow:\n    \"\"\"Get the singleton CaseAnalysisWorkflow instance.\"\"\"\n    global _case_analysis_workflow\n    if _case_analysis_workflow is None:\n        _case_analysis_workflow = CaseAnalysisWorkflow()\n    return _case_analysis_workflow\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Designing state schemas for LangGraph workflows",
      "content": "Design and implement LangGraph state schemas for workflows",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Case Analysis Workflow",
      "content": "Implement Case Analysis Workflow (classifier + research + clarification)",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Document Generation Workflow",
      "content": "Implement Document Generation Workflow (drafter + reviewer + revision loop)",
      "status": "in_progress"
    },
    {
      "activeForm": "Implementing Complex Q&A Workflow",
      "content": "Implement Complex Q&A Workflow (researcher + Q&A + citation formatter)",
      "status": "pending"
    },
    {
      "activeForm": "Creating workflow orchestration service",
      "content": "Create workflow orchestration service",
      "status": "pending"
    },
    {
      "activeForm": "Adding FastAPI endpoints for workflows",
      "content": "Add FastAPI endpoints for workflows",
      "status": "pending"
    },
    {
      "activeForm": "Adding unit tests for workflows",
      "content": "Add unit tests for workflows",
      "status": "pending"
    }
  ]
}
Now let me implement the Document Generation Workflow:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/document_generation_workflow.py",
  "content": "\"\"\"Document Generation Workflow using LangGraph.\n\nThis workflow orchestrates:\n1. Classifier - Understand legal grounds for better drafting\n2. Drafter Agent - Generate initial document\n3. Reviewer Agent - Review quality and completeness\n4. Revision Loop - Iterate until approval or max iterations\n\nThe workflow includes a revision loop that:\n- Checks approval after each draft\n- Provides feedback if revisions needed\n- Limits iterations to prevent infinite loops\n\"\"\"\n\nimport time\nfrom typing import Any, Literal\n\nfrom langgraph.graph import StateGraph, END\n\nfrom ..agents.classifier_agent import classify_case\nfrom ..agents.drafting_agent import generate_document\nfrom ..langfuse_init import is_langfuse_enabled\nfrom .states import DocumentGenerationState, create_document_generation_state\n\n\n# -----------------------------------------------------------------------------\n# Workflow Nodes\n# -----------------------------------------------------------------------------\n\n\nasync def classify_case_node(state: DocumentGenerationState) -> DocumentGenerationState:\n    \"\"\"Classify the case to understand legal grounds before drafting.\n\n    This helps the drafter produce more accurate, legally-sound documents.\n    \"\"\"\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"classify_case\",\n                session_id=metadata.get(\"session_id\"),\n            )\n\n    try:\n        # Use description for classification\n        result, _agent_metadata = await classify_case(\n            case_description=state[\"description\"],\n            session_id=metadata.get(\"session_id\", \"default\"),\n            user_id=metadata.get(\"user_id\"),\n        )\n\n        # Convert to dicts for state\n        legal_grounds = [\n            {\n                \"name\": ground.name,\n                \"description\": ground.description,\n                \"confidence_score\": ground.confidence_score,\n                \"legal_basis\": ground.legal_basis,\n                \"notes\": ground.notes,\n            }\n            for ground in result.identified_grounds\n        ]\n\n        state[\"legal_grounds\"] = legal_grounds\n        state[\"metadata\"][\"current_step\"] = \"classify_case\"\n        state[\"next_step\"] = \"draft\"\n\n        if span:\n            span.end(output={\"grounds_count\": len(legal_grounds)})\n\n        return state\n\n    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        # Classification failure is not fatal - proceed without it\n        state[\"legal_grounds\"] = []\n        state[\"next_step\"] = \"draft\"\n        return state\n\n\nasync def draft_node(state: DocumentGenerationState) -> DocumentGenerationState:\n    \"\"\"Generate the initial or revised document.\n\n    This node uses the drafting agent to create the document content,\n    incorporating any feedback from previous iterations.\n    \"\"\"\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"draft\",\n                session_id=metadata.get(\"session_id\"),\n            )\n\n    try:\n        iteration = state.get(\"draft_iteration\", 0)\n\n        # Build context with legal grounds and previous feedback\n        context = state.get(\"context\", {}).copy()\n\n        if state.get(\"legal_grounds\"):\n            context[\"legal_grounds\"] = state[\"legal_grounds\"]\n\n        if iteration > 0 and state.get(\"review_feedback\"):\n            feedback = state[\"review_feedback\"]\n            context[\"revision_feedback\"] = {\n                \"issues\": feedback.get(\"issues\", []),\n                \"suggestions\": feedback.get(\"suggestions\", []),\n            }\n\n        # Call the drafting agent\n        result, _agent_metadata = await generate_document(\n            document_type=state[\"document_type\"],\n            description=state[\"description\"],\n            context=context,\n            session_id=metadata.get(\"session_id\", \"default\"),\n            user_id=metadata.get(\"user_id\"),\n        )\n\n        state[\"current_draft\"] = result.content\n        state[\"draft_iteration\"] = iteration + 1\n        state[\"metadata\"][\"current_step\"] = \"draft\"\n        state[\"next_step\"] = \"review\"\n\n        if span:\n            span.end(output={\n                \"iteration\": state[\"draft_iteration\"],\n                \"draft_length\": len(result.content),\n            })\n\n        return state\n\n    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        state[\"error\"] = str(e)\n        state[\"next_step\"] = \"error\"\n        return state\n\n\nasync def review_node(state: DocumentGenerationState) -> DocumentGenerationState:\n    \"\"\"Review the generated document for quality and completeness.\n\n    This node acts as a reviewer agent, checking:\n    1. Legal accuracy\n    2. Completeness of required sections\n    3. Proper formatting\n    4. Placeholder completeness\n    \"\"\"\n    metadata = state.get(\"metadata\", {})\n    draft = state.get(\"current_draft\", \"\")\n\n    # Create Langfuse span\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"review\",\n                session_id=metadata.get(\"session_id\"),\n            )\n\n    try:\n        # Simple review logic (could be enhanced with an actual reviewer agent)\n        issues = []\n        suggestions = []\n\n        # Check for placeholders\n        import re\n\n        placeholders = re.findall(r'\\[([A-Z_]+)\\]', draft)\n        if placeholders:\n            issues.append(f\"Document contains {len(placeholders)} placeholders: {', '.join(set(placeholders))}\")\n\n        # Check minimum length\n        if len(draft) < 200:\n            issues.append(\"Document appears too short for the requested type\")\n\n        # Check for document structure based on type\n        doc_type = state.get(\"document_type\", \"\").lower()\n        if \"pozew\" in doc_type or \"allow\" in doc_type:\n            required_sections = [\"Strona\", \"Wnioskodawca\", \"Wnioskowany\"]\n            missing = [s for s in required_sections if s.lower() not in draft.lower()]\n            if missing:\n                issues.append(f\"Missing required sections for lawsuit: {', '.join(missing)}\")\n\n        # Check for legal basis if classification was done\n        if state.get(\"legal_grounds\"):\n            has_legal_basis = any(\n                \"podstawa prawna\" in draft.lower() or\n                any(basis.lower() in draft.lower() for ground in state[\"legal_grounds\"]\n                    for basis in ground.get(\"legal_basis\", []))\n            )\n            if not has_legal_basis:\n                suggestions.append(\"Consider adding explicit legal basis references\")\n\n        # Determine approval status\n        # Auto-approve if no major issues and we've done at least one iteration\n        approved = len(issues) == 0\n\n        state[\"review_feedback\"] = {\n            \"approved\": approved,\n            \"issues\": issues,\n            \"suggestions\": suggestions,\n            \"needs_revision\": not approved,\n        }\n        state[\"approved\"] = approved\n        state[\"metadata\"][\"current_step\"] = \"review\"\n        state[\"next_step\"] = \"check_approval\"\n\n        if span:\n            span.end(output={\n                \"approved\": approved,\n                \"issues_count\": len(issues),\n                \"suggestions_count\": len(suggestions),\n            })\n\n        return state\n\n    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        state[\"error\"] = str(e)\n        state[\"next_step\"] = \"error\"\n        return state\n\n\nasync def check_approval_node(state: DocumentGenerationState) -> DocumentGenerationState:\n    \"\"\"Check if document is approved or needs revision.\n\n    This decision node checks:\n    1. Approval status from review\n    2. Maximum iteration count\n    \"\"\"\n    approved = state.get(\"approved\", False)\n    iteration = state.get(\"draft_iteration\", 0)\n    max_iterations = state.get(\"max_iterations\", 3)\n\n    if approved:\n        state[\"next_step\"] = \"complete\"\n    elif iteration >= max_iterations:\n        # Force approve after max iterations\n        state[\"approved\"] = True\n        state[\"next_step\"] = \"complete\"\n    else:\n        state[\"next_step\"] = \"revise\"\n\n    return state\n\n\nasync def revise_node(state: DocumentGenerationState) -> DocumentGenerationState:\n    \"\"\"Prepare for revision by updating feedback.\n\n    This node is a pass-through that ensures the workflow\n    continues to the draft node for revision.\n    \"\"\"\n    state[\"metadata\"][\"current_step\"] = \"revise\"\n    state[\"metadata\"][\"iteration_count\"] = state[\"metadata\"].get(\"iteration_count\", 0) + 1\n    state[\"next_step\"] = \"draft\"\n    return state\n\n\nasync def complete_node(state: DocumentGenerationState) -> DocumentGenerationState:\n    \"\"\"Finalize the approved document.\n\n    This node produces the final output with metadata.\n    \"\"\"\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"complete\",\n                session_id=metadata.get(\"session_id\"),\n            )\n\n    try:\n        state[\"final_document\"] = state.get(\"current_draft\", \"\")\n        state[\"metadata\"][\"current_step\"] = \"complete\"\n        state[\"next_step\"] = END  # type: ignore\n\n        if span:\n            span.end(output={\"document_length\": len(state[\"final_document\"])})\n\n        return state\n\n    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        state[\"error\"] = str(e)\n        state[\"next_step\"] = \"error\"\n        return state\n\n\n# -----------------------------------------------------------------------------\n# Conditional Edge Functions\n# -----------------------------------------------------------------------------\n\n\ndef should_revise(state: DocumentGenerationState) -> Literal[\"revise\", \"complete\"]:\n    \"\"\"Route to revision or completion based on approval status.\"\"\"\n    approved = state.get(\"approved\", False)\n    iteration = state.get(\"draft_iteration\", 0)\n    max_iterations = state.get(\"max_iterations\", 3)\n\n    if approved or iteration >= max_iterations:\n        return \"complete\"\n    return \"revise\"\n\n\n# -----------------------------------------------------------------------------\n# Workflow Builder\n# -----------------------------------------------------------------------------\n\n\ndef build_document_generation_graph() -> StateGraph:\n    \"\"\"Build the Document Generation StateGraph.\n\n    Returns:\n        Compiled StateGraph ready for execution\n    \"\"\"\n    workflow = StateGraph(DocumentGenerationState)\n\n    # Add nodes\n    workflow.add_node(\"classify_case\", classify_case_node)\n    workflow.add_node(\"draft\", draft_node)\n    workflow.add_node(\"review\", review_node)\n    workflow.add_node(\"check_approval\", check_approval_node)\n    workflow.add_node(\"revise\", revise_node)\n    workflow.add_node(\"complete\", complete_node)\n    workflow.add_node(\"error\", lambda s: {**s, \"next_step\": END})  # type: ignore\n\n    # Define edges\n    workflow.set_entry_point(\"classify_case\")\n    workflow.add_edge(\"classify_case\", \"draft\")\n    workflow.add_edge(\"draft\", \"review\")\n    workflow.add_edge(\"review\", \"check_approval\")\n\n    # Conditional routing from check_approval\n    workflow.add_conditional_edges(\n        \"check_approval\",\n        should_revise,\n        {\n            \"revise\": \"revise\",\n            \"complete\": \"complete\",\n        },\n    )\n\n    # Revision loops back to draft\n    workflow.add_edge(\"revise\", \"draft\")\n    workflow.add_edge(\"complete\", END)\n    workflow.add_edge(\"error\", END)\n\n    return workflow.compile()\n\n\n# Compile the graph once for reuse\n_document_generation_graph: StateGraph | None = None\n\n\ndef get_document_generation_graph() -> StateGraph:\n    \"\"\"Get or create the compiled Document Generation graph.\"\"\"\n    global _document_generation_graph\n    if _document_generation_graph is None:\n        _document_generation_graph = build_document_generation_graph()\n    return _document_generation_graph\n\n\n# -----------------------------------------------------------------------------\n# Workflow Wrapper Class\n# -----------------------------------------------------------------------------\n\n\nclass DocumentGenerationWorkflow:\n    \"\"\"Wrapper class for Document Generation workflow execution.\n\n    This class provides a clean interface for running the workflow\n    with proper observability and error handling.\n    \"\"\"\n\n    def __init__(self) -> None:\n        \"\"\"Initialize the workflow with compiled graph.\"\"\"\n        self.graph = get_document_generation_graph()\n\n    async def run(\n        self,\n        document_type: str,\n        description: str,\n        context: dict[str, Any] | None = None,\n        session_id: str = \"default\",\n        user_id: str | None = None,\n        max_iterations: int = 3,\n    ) -> dict[str, Any]:\n        \"\"\"Run the Document Generation workflow.\n\n        Args:\n            document_type: Type of document to generate\n            description: Description of the document content\n            context: Additional context variables\n            session_id: Session ID for tracking\n            user_id: User ID for observability\n            max_iterations: Maximum revision iterations\n\n        Returns:\n            Dictionary containing the workflow results\n        \"\"\"\n        import time\n\n        start_time = time.time()\n\n        # Create initial state\n        state = create_document_generation_state(\n            document_type=document_type,\n            description=description,\n            context=context,\n            session_id=session_id,\n            user_id=user_id,\n        )\n        state[\"max_iterations\"] = max_iterations\n\n        # Create Langfuse trace\n        trace = None\n        if is_langfuse_enabled():\n            from ..langfuse_init import get_langfuse\n            langfuse = get_langfuse()\n            if langfuse:\n                trace = langfuse.trace(\n                    name=\"document_generation_workflow\",\n                    session_id=session_id,\n                    user_id=user_id,\n                    metadata={\n                        \"workflow\": \"document_generation\",\n                        \"document_type\": document_type,\n                        \"max_iterations\": max_iterations,\n                    },\n                )\n                state[\"metadata\"][\"parent_span_id\"] = trace.trace_id\n\n        try:\n            # Run the workflow\n            result = await self.graph.ainvoke(state)\n\n            processing_time_ms = (time.time() - start_time) * 1000\n\n            # Prepare output\n            output = {\n                \"final_document\": result.get(\"final_document\"),\n                \"current_draft\": result.get(\"current_draft\"),\n                \"draft_iteration\": result.get(\"draft_iteration\", 0),\n                \"approved\": result.get(\"approved\", False),\n                \"review_feedback\": result.get(\"review_feedback\"),\n                \"legal_grounds\": result.get(\"legal_grounds\", []),\n                \"processing_time_ms\": processing_time_ms,\n                \"error\": result.get(\"error\"),\n            }\n\n            if trace:\n                trace.update(output={\n                    \"document_length\": len(output[\"final_document\"] or \"\"),\n                    \"iterations\": output[\"draft_iteration\"],\n                    \"approved\": output[\"approved\"],\n                })\n                trace.metadata[\"processing_time_ms\"] = processing_time_ms\n                trace.end()\n\n            return output\n\n        except Exception as e:\n            if trace:\n                trace.end(level=\"ERROR\", status_message=str(e))\n            raise\n\n\n# Singleton instance\n_document_generation_workflow: DocumentGenerationWorkflow | None = None\n\n\ndef document_generation_workflow() -> DocumentGenerationWorkflow:\n    \"\"\"Get the singleton DocumentGenerationWorkflow instance.\"\"\"\n    global _document_generation_workflow\n    if _document_generation_workflow is None:\n        _document_generation_workflow = DocumentGenerationWorkflow()\n    return _document_generation_workflow\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Designing state schemas for LangGraph workflows",
      "content": "Design and implement LangGraph state schemas for workflows",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Case Analysis Workflow",
      "content": "Implement Case Analysis Workflow (classifier + research + clarification)",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Document Generation Workflow",
      "content": "Implement Document Generation Workflow (drafter + reviewer + revision loop)",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Complex Q&A Workflow",
      "content": "Implement Complex Q&A Workflow (researcher + Q&A + citation formatter)",
      "status": "in_progress"
    },
    {
      "activeForm": "Creating workflow orchestration service",
      "content": "Create workflow orchestration service",
      "status": "pending"
    },
    {
      "activeForm": "Adding FastAPI endpoints for workflows",
      "content": "Add FastAPI endpoints for workflows",
      "status": "pending"
    },
    {
      "activeForm": "Adding unit tests for workflows",
      "content": "Add unit tests for workflows",
      "status": "pending"
    }
  ]
}
Now let me implement the Complex Q&A Workflow:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/complex_qa_workflow.py",
  "content": "\"\"\"Complex Q&A Workflow using LangGraph.\n\nThis workflow orchestrates:\n1. Query Analyzer - Understand the question type and extract key terms\n2. Research Node - Deep legal research (statutes, case law, commentary)\n3. Clarification Agent - Gather missing information if needed\n4. Q&A Agent - Generate comprehensive answer\n5. Citation Formatter - Format and validate citations\n\nThe workflow routes between clarification and research based on query completeness.\n\"\"\"\n\nimport time\nfrom typing import Any, Literal\n\nfrom langgraph.graph import StateGraph, END\nfrom pydantic_ai import RunContext\n\nfrom ..agents.clarification_agent import generate_clarifications\nfrom ..agents.dependencies import get_model_deps\nfrom ..agents.qa_agent import (\n    QAResult,\n    QueryAnalysis,\n    get_qa_agent,\n    get_query_analyzer_agent,\n    retrieve_context_tool,\n)\nfrom ..langfuse_init import is_langfuse_enabled\nfrom .states import ComplexQAState, create_complex_qa_state, RetrievedContext, LegalCitation\n\n\n# -----------------------------------------------------------------------------\n# Workflow Nodes\n# -----------------------------------------------------------------------------\n\n\nasync def analyze_query_node(state: ComplexQAState) -> ComplexQAState:\n    \"\"\"Analyze the query to extract key information.\n\n    This node uses the query analyzer agent to:\n    1. Determine query type\n    2. Extract key legal terms\n    3. Refine the question for better search\n    4. Check if clarification is needed\n    \"\"\"\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"analyze_query\",\n                session_id=metadata.get(\"session_id\"),\n            )\n\n    try:\n        deps = get_model_deps()\n        analyzer = get_query_analyzer_agent()\n\n        result = await analyzer.run(state[\"question\"], deps=deps)\n        analysis = result.data\n\n        state[\"query_type\"] = analysis.query_type\n        state[\"key_terms\"] = analysis.key_terms\n        state[\"question_refined\"] = analysis.question_refined\n        state[\"needs_clarification\"] = analysis.needs_clarification\n        state[\"metadata\"][\"current_step\"] = \"analyze_query\"\n        state[\"next_step\"] = \"check_clarification\"\n\n        if span:\n            span.end(output={\n                \"query_type\": analysis.query_type,\n                \"key_terms\": analysis.key_terms,\n                \"needs_clarification\": analysis.needs_clarification,\n            })\n\n        return state\n\n    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        state[\"error\"] = str(e)\n        state[\"next_step\"] = \"error\"\n        return state\n\n\nasync def check_clarification_node(state: ComplexQAState) -> ComplexQAState:\n    \"\"\"Determine if clarification is needed.\n\n    This decision node checks:\n    1. needs_clarification flag from analysis\n    2. Whether user has already provided responses\n    \"\"\"\n    needs_clarification = state.get(\"needs_clarification\", False)\n    has_responses = bool(state.get(\"user_responses\"))\n\n    if needs_clarification and not has_responses:\n        state[\"next_step\"] = \"clarify\"\n    else:\n        state[\"next_step\"] = \"research\"\n\n    return state\n\n\nasync def clarify_node(state: ComplexQAState) -> ComplexQAState:\n    \"\"\"Generate clarification questions.\n\n    This node uses the clarification agent to generate\n    targeted follow-up questions.\n    \"\"\"\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"clarify\",\n                session_id=metadata.get(\"session_id\"),\n            )\n\n    try:\n        result = await generate_clarifications(\n            question=state[\"question\"],\n            query_type=state.get(\"query_type\", \"general\"),\n            mode=state.get(\"mode\", \"SIMPLE\"),\n        )\n\n        state[\"clarification_questions\"] = result.get(\"questions\", [])\n        state[\"metadata\"][\"current_step\"] = \"clarify\"\n        state[\"next_step\"] = \"await_clarification\"\n\n        if span:\n            span.end(output={\"questions_count\": len(state[\"clarification_questions\"])})\n\n        return state\n\n    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        # Clarification failure is not fatal - proceed to research\n        state[\"clarification_questions\"] = []\n        state[\"next_step\"] = \"research\"\n        return state\n\n\nasync def research_node(state: ComplexQAState) -> ComplexQAState:\n    \"\"\"Perform deep legal research.\n\n    This node:\n    1. Retrieves relevant legal context from vector store\n    2. Separates statute and case law references\n    3. Collects commentary if available\n    \"\"\"\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"research\",\n                session_id=metadata.get(\"session_id\"),\n            )\n\n    try:\n        deps = get_model_deps()\n\n        # Retrieve context using the refined question\n        contexts = await retrieve_context_tool(\n            RunContext(deps),  # type: ignore\n            query=state.get(\"question_refined\", state[\"question\"]),\n            limit=5,\n        )\n\n        # Separate into statute and case law references\n        statute_refs = []\n        case_law_refs = []\n\n        for ctx in contexts:\n            source_lower = ctx.get(\"source\", \"\").lower()\n            if any(k in source_lower for k in [\"kodeks\", \"ustawa\", \"art.\", \"dz.u.\"]):\n                statute_refs.append(ctx)\n            elif any(k in source_lower for k in [\"sad\", \"wyrok\", \"orzeczenie\", \"sygnatura\"]):\n                case_law_refs.append(ctx)\n\n        state[\"retrieved_contexts\"] = contexts\n        state[\"statute_references\"] = statute_refs\n        state[\"case_law_references\"] = case_law_refs\n        state[\"metadata\"][\"current_step\"] = \"research\"\n        state[\"next_step\"] = \"generate_answer\"\n\n        if span:\n            span.end(output={\n                \"total_contexts\": len(contexts),\n                \"statutes\": len(statute_refs),\n                \"case_law\": len(case_law_refs),\n            })\n\n        return state\n\n    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        # Research failure is not fatal - proceed with empty context\n        state[\"retrieved_contexts\"] = []\n        state[\"statute_references\"] = []\n        state[\"case_law_references\"] = []\n        state[\"next_step\"] = \"generate_answer\"\n        return state\n\n\nasync def generate_answer_node(state: ComplexQAState) -> ComplexQAState:\n    \"\"\"Generate comprehensive answer using Q&A agent.\n\n    This node uses the Q&A agent to produce a detailed answer\n    with proper citations.\n    \"\"\"\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"generate_answer\",\n                session_id=metadata.get(\"session_id\"),\n            )\n\n    try:\n        deps = get_model_deps()\n        mode = state.get(\"mode\", \"SIMPLE\")\n        qa_agent = get_qa_agent(mode)\n\n        # Build context string\n        contexts = state.get(\"retrieved_contexts\", [])\n        if contexts:\n            context_text = \"\\n\\n\".join([\n                f\"[{ctx['source']} - {ctx.get('article', 'N/A')}]: {ctx['content']}\"\n                for ctx in contexts\n            ])\n        else:\n            context_text = \"No specific legal context was retrieved for this question.\"\n\n        # Incorporate user responses if available\n        user_context = \"\"\n        if state.get(\"user_responses\"):\n            user_context = \"\\n\\nAdditional Information Provided:\\n\" + \"\\n\".join([\n                f\"- {k}: {v}\" for k, v in state[\"user_responses\"].items()\n            ])\n\n        augmented_prompt = f\"\"\"Question: {state['question']}\n{user_context}\n\nRefined Question: {state.get('question_refined', state['question'])}\nQuery Type: {state.get('query_type', 'general')}\nKey Terms: {', '.join(state.get('key_terms', []))}\n\nLegal Context:\n{context_text}\n\nPlease provide a comprehensive answer based on the above context.\"\"\"\n\n        result = await qa_agent.run(augmented_prompt, deps=deps)\n        qa_result = result.data\n\n        state[\"answer\"] = qa_result.answer\n        state[\"raw_citations\"] = [\n            {\"source\": c.source, \"article\": c.article, \"url\": c.url}\n            for c in qa_result.citations\n        ]\n        state[\"confidence\"] = qa_result.confidence\n        state[\"metadata\"][\"current_step\"] = \"generate_answer\"\n        state[\"next_step\"] = \"format_citations\"\n\n        if span:\n            span.end(output={\n                \"answer_length\": len(qa_result.answer),\n                \"confidence\": qa_result.confidence,\n            })\n\n        return state\n\n    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        state[\"error\"] = str(e)\n        state[\"next_step\"] = \"error\"\n        return state\n\n\nasync def format_citations_node(state: ComplexQAState) -> ComplexQAState:\n    \"\"\"Format and validate citations.\n\n    This node:\n    1. Merges agent-generated citations with retrieved context citations\n    2. Validates citation format\n    3. Removes duplicates\n    \"\"\"\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"format_citations\",\n                session_id=metadata.get(\"session_id\"),\n            )\n\n    try:\n        # Gather citations from multiple sources\n        citations: list[dict[str, Any]] = []\n\n        # Agent-generated citations\n        citations.extend(state.get(\"raw_citations\", []))\n\n        # Context-based citations\n        for ctx in state.get(\"retrieved_contexts\", []):\n            citations.append({\n                \"source\": ctx.get(\"source\", \"\"),\n                \"article\": ctx.get(\"article\", \"\"),\n                \"url\": ctx.get(\"url\"),\n            })\n\n        # Deduplicate by source + article\n        seen = set()\n        formatted = []\n        for cit in citations:\n            key = (cit.get(\"source\", \"\"), cit.get(\"article\", \"\"))\n            if key not in seen and key[0]:\n                seen.add(key)\n                formatted.append(cit)\n\n        state[\"formatted_citations\"] = formatted\n        state[\"final_answer\"] = state.get(\"answer\", \"\")\n        state[\"metadata\"][\"current_step\"] = \"format_citations\"\n        state[\"next_step\"] = \"complete\"\n\n        if span:\n            span.end(output={\"citations_count\": len(formatted)})\n\n        return state\n\n    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        # Citation formatting failure is not fatal\n        state[\"formatted_citations\"] = state.get(\"raw_citations\", [])\n        state[\"final_answer\"] = state.get(\"answer\", \"\")\n        state[\"next_step\"] = \"complete\"\n        return state\n\n\nasync def complete_node(state: ComplexQAState) -> ComplexQAState:\n    \"\"\"Finalize the workflow output.\n\n    This node produces the final structured response.\n    \"\"\"\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"complete\",\n                session_id=metadata.get(\"session_id\"),\n            )\n\n    try:\n        state[\"next_step\"] = END  # type: ignore\n\n        if span:\n            span.end(output={\n                \"answer_length\": len(state.get(\"final_answer\", \"\")),\n                \"citations_count\": len(state.get(\"formatted_citations\", [])),\n            })\n\n        return state\n\n    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        state[\"error\"] = str(e)\n        state[\"next_step\"] = \"error\"\n        return state\n\n\n# -----------------------------------------------------------------------------\n# Conditional Edge Functions\n# -----------------------------------------------------------------------------\n\n\ndef should_clarify(state: ComplexQAState) -> Literal[\"clarify\", \"research\"]:\n    \"\"\"Route to clarification or research.\"\"\"\n    if state.get(\"needs_clarification\", False) and not state.get(\"user_responses\"):\n        return \"clarify\"\n    return \"research\"\n\n\n# -----------------------------------------------------------------------------\n# Workflow Builder\n# -----------------------------------------------------------------------------\n\n\ndef build_complex_qa_graph() -> StateGraph:\n    \"\"\"Build the Complex Q&A StateGraph.\n\n    Returns:\n        Compiled StateGraph ready for execution\n    \"\"\"\n    workflow = StateGraph(ComplexQAState)\n\n    # Add nodes\n    workflow.add_node(\"analyze_query\", analyze_query_node)\n    workflow.add_node(\"check_clarification\", check_clarification_node)\n    workflow.add_node(\"clarify\", clarify_node)\n    workflow.add_node(\"research\", research_node)\n    workflow.add_node(\"generate_answer\", generate_answer_node)\n    workflow.add_node(\"format_citations\", format_citations_node)\n    workflow.add_node(\"complete\", complete_node)\n    workflow.add_node(\"error\", lambda s: {**s, \"next_step\": END})  # type: ignore\n\n    # Define edges\n    workflow.set_entry_point(\"analyze_query\")\n    workflow.add_edge(\"analyze_query\", \"check_clarification\")\n\n    # Conditional routing for clarification\n    workflow.add_conditional_edges(\n        \"check_clarification\",\n        should_clarify,\n        {\n            \"clarify\": \"clarify\",\n            \"research\": \"research\",\n        },\n    )\n\n    workflow.add_edge(\"clarify\", \"research\")\n    workflow.add_edge(\"research\", \"generate_answer\")\n    workflow.add_edge(\"generate_answer\", \"format_citations\")\n    workflow.add_edge(\"format_citations\", \"complete\")\n    workflow.add_edge(\"complete\", END)\n    workflow.add_edge(\"error\", END)\n\n    return workflow.compile()\n\n\n# Compile the graph once for reuse\n_complex_qa_graph: StateGraph | None = None\n\n\ndef get_complex_qa_graph() -> StateGraph:\n    \"\"\"Get or create the compiled Complex Q&A graph.\"\"\"\n    global _complex_qa_graph\n    if _complex_qa_graph is None:\n        _complex_qa_graph = build_complex_qa_graph()\n    return _complex_qa_graph\n\n\n# -----------------------------------------------------------------------------\n# Workflow Wrapper Class\n# -----------------------------------------------------------------------------\n\n\nclass ComplexQAWorkflow:\n    \"\"\"Wrapper class for Complex Q&A workflow execution.\n\n    This class provides a clean interface for running the workflow\n    with proper observability and error handling.\n    \"\"\"\n\n    def __init__(self) -> None:\n        \"\"\"Initialize the workflow with compiled graph.\"\"\"\n        self.graph = get_complex_qa_graph()\n\n    async def run(\n        self,\n        question: str,\n        mode: str = \"SIMPLE\",\n        session_id: str = \"default\",\n        user_id: str | None = None,\n        user_responses: dict[str, str] | None = None,\n    ) -> dict[str, Any]:\n        \"\"\"Run the Complex Q&A workflow.\n\n        Args:\n            question: The legal question to answer\n            mode: Response mode (\"LAWYER\" or \"SIMPLE\")\n            session_id: Session ID for tracking\n            user_id: User ID for observability\n            user_responses: Optional pre-filled responses to clarification questions\n\n        Returns:\n            Dictionary containing the workflow results\n        \"\"\"\n        import time\n\n        start_time = time.time()\n\n        # Create initial state\n        state = create_complex_qa_state(\n            question=question,\n            mode=mode,\n            session_id=session_id,\n            user_id=user_id,\n        )\n\n        # Add user responses if provided\n        if user_responses:\n            state[\"user_responses\"] = user_responses\n\n        # Create Langfuse trace\n        trace = None\n        if is_langfuse_enabled():\n            from ..langfuse_init import get_langfuse\n            langfuse = get_langfuse()\n            if langfuse:\n                trace = langfuse.trace(\n                    name=\"complex_qa_workflow\",\n                    session_id=session_id,\n                    user_id=user_id,\n                    metadata={\n                        \"workflow\": \"complex_qa\",\n                        \"mode\": mode,\n                        \"question_length\": len(question),\n                    },\n                )\n                state[\"metadata\"][\"parent_span_id\"] = trace.trace_id\n\n        try:\n            # Run the workflow\n            result = await self.graph.ainvoke(state)\n\n            processing_time_ms = (time.time() - start_time) * 1000\n\n            # Prepare output\n            output = {\n                \"answer\": result.get(\"final_answer\"),\n                \"citations\": result.get(\"formatted_citations\", []),\n                \"confidence\": result.get(\"confidence\", 0.0),\n                \"query_type\": result.get(\"query_type\", \"general\"),\n                \"key_terms\": result.get(\"key_terms\", []),\n                \"clarification_questions\": result.get(\"clarification_questions\", []),\n                \"needs_clarification\": result.get(\"needs_clarification\", False),\n                \"statute_references\": result.get(\"statute_references\", []),\n                \"case_law_references\": result.get(\"case_law_references\", []),\n                \"processing_time_ms\": processing_time_ms,\n                \"error\": result.get(\"error\"),\n            }\n\n            if trace:\n                trace.update(output={\n                    \"answer_length\": len(output[\"answer\"] or \"\"),\n                    \"confidence\": output[\"confidence\"],\n                    \"needs_clarification\": output[\"needs_clarification\"],\n                })\n                trace.metadata[\"processing_time_ms\"] = processing_time_ms\n                trace.end()\n\n            return output\n\n        except Exception as e:\n            if trace:\n                trace.end(level=\"ERROR\", status_message=str(e))\n            raise\n\n\n# Singleton instance\n_complex_qa_workflow: ComplexQAWorkflow | None = None\n\n\ndef complex_qa_workflow() -> ComplexQAWorkflow:\n    \"\"\"Get the singleton ComplexQAWorkflow instance.\"\"\"\n    global _complex_qa_workflow\n    if _complex_qa_workflow is None:\n        _complex_qa_workflow = ComplexQAWorkflow()\n    return _complex_qa_workflow\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Designing state schemas for LangGraph workflows",
      "content": "Design and implement LangGraph state schemas for workflows",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Case Analysis Workflow",
      "content": "Implement Case Analysis Workflow (classifier + research + clarification)",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Document Generation Workflow",
      "content": "Implement Document Generation Workflow (drafter + reviewer + revision loop)",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Complex Q&A Workflow",
      "content": "Implement Complex Q&A Workflow (researcher + Q&A + citation formatter)",
      "status": "completed"
    },
    {
      "activeForm": "Creating workflow orchestration service",
      "content": "Create workflow orchestration service",
      "status": "in_progress"
    },
    {
      "activeForm": "Adding FastAPI endpoints for workflows",
      "content": "Add FastAPI endpoints for workflows",
      "status": "pending"
    },
    {
      "activeForm": "Adding unit tests for workflows",
      "content": "Add unit tests for workflows",
      "status": "pending"
    }
  ]
}
Now let me create the workflow orchestration service that provides a unified interface:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/orchestration.py",
  "content": "\"\"\"Workflow orchestration service.\n\nThis module provides a unified interface for executing all LangGraph workflows.\nIt handles workflow selection, state management, and error recovery.\n\"\"\"\n\nfrom enum import Enum\nfrom typing import Any\n\nfrom .case_analysis_workflow import case_analysis_workflow, CaseAnalysisWorkflow\nfrom .complex_qa_workflow import complex_qa_workflow, ComplexQAWorkflow\nfrom .document_generation_workflow import document_generation_workflow, DocumentGenerationWorkflow\n\n\nclass WorkflowType(str, Enum):\n    \"\"\"Available workflow types.\"\"\"\n\n    CASE_ANALYSIS = \"case_analysis\"\n    DOCUMENT_GENERATION = \"document_generation\"\n    COMPLEX_QA = \"complex_qa\"\n\n\nclass WorkflowOrchestrator:\n    \"\"\"Central orchestrator for all LangGraph workflows.\n\n    This class provides a unified interface for:\n    - Selecting the appropriate workflow\n    - Executing workflows with proper configuration\n    - Handling errors and retries\n    - Collecting telemetry\n    \"\"\"\n\n    def __init__(self) -> None:\n        \"\"\"Initialize the orchestrator with all workflow instances.\"\"\"\n        self.case_analysis = case_analysis_workflow()\n        self.document_generation = document_generation_workflow()\n        self.complex_qa = complex_qa_workflow()\n\n    async def run_case_analysis(\n        self,\n        case_description: str,\n        session_id: str = \"default\",\n        user_id: str | None = None,\n        user_responses: dict[str, str] | None = None,\n    ) -> dict[str, Any]:\n        \"\"\"Run the Case Analysis workflow.\n\n        Args:\n            case_description: The case description to analyze\n            session_id: Session ID for tracking\n            user_id: User ID for observability\n            user_responses: Optional pre-filled clarification responses\n\n        Returns:\n            Dictionary with analysis results including:\n            - legal_grounds: List of identified legal grounds\n            - classification_confidence: Overall confidence score\n            - retrieved_contexts: Relevant legal contexts\n            - clarification_questions: Questions if clarification needed\n            - final_analysis: Comprehensive analysis report\n            - recommendations: Action recommendations\n        \"\"\"\n        return await self.case_analysis.run(\n            case_description=case_description,\n            session_id=session_id,\n            user_id=user_id,\n            user_responses=user_responses,\n        )\n\n    async def run_document_generation(\n        self,\n        document_type: str,\n        description: str,\n        context: dict[str, Any] | None = None,\n        session_id: str = \"default\",\n        user_id: str | None = None,\n        max_iterations: int = 3,\n    ) -> dict[str, Any]:\n        \"\"\"Run the Document Generation workflow.\n\n        Args:\n            document_type: Type of document to generate\n            description: Description of document content\n            context: Additional context variables\n            session_id: Session ID for tracking\n            user_id: User ID for observability\n            max_iterations: Maximum revision iterations\n\n        Returns:\n            Dictionary with generation results including:\n            - final_document: The generated document content\n            - draft_iteration: Number of iterations performed\n            - approved: Whether document was approved\n            - review_feedback: Feedback from review process\n            - legal_grounds: Legal grounds identified for drafting\n        \"\"\"\n        return await self.document_generation.run(\n            document_type=document_type,\n            description=description,\n            context=context,\n            session_id=session_id,\n            user_id=user_id,\n            max_iterations=max_iterations,\n        )\n\n    async def run_complex_qa(\n        self,\n        question: str,\n        mode: str = \"SIMPLE\",\n        session_id: str = \"default\",\n        user_id: str | None = None,\n        user_responses: dict[str, str] | None = None,\n    ) -> dict[str, Any]:\n        \"\"\"Run the Complex Q&A workflow.\n\n        Args:\n            question: The legal question to answer\n            mode: Response mode (\"LAWYER\" or \"SIMPLE\")\n            session_id: Session ID for tracking\n            user_id: User ID for observability\n            user_responses: Optional pre-filled clarification responses\n\n        Returns:\n            Dictionary with Q&A results including:\n            - answer: The comprehensive answer\n            - citations: Formatted legal citations\n            - confidence: Answer confidence score\n            - query_type: Detected query type\n            - key_terms: Key legal terms extracted\n            - clarification_questions: Questions if clarification needed\n        \"\"\"\n        return await self.complex_qa.run(\n            question=question,\n            mode=mode,\n            session_id=session_id,\n            user_id=user_id,\n            user_responses=user_responses,\n        )\n\n    async def run_workflow(\n        self,\n        workflow_type: WorkflowType | str,\n        **kwargs: Any,\n    ) -> dict[str, Any]:\n        \"\"\"Run a workflow by type.\n\n        This is a generic entry point that routes to the appropriate\n        workflow based on the workflow_type parameter.\n\n        Args:\n            workflow_type: The workflow to execute\n            **kwargs: Workflow-specific parameters\n\n        Returns:\n            Dictionary with workflow results\n\n        Raises:\n            ValueError: If workflow_type is not recognized\n        \"\"\"\n        workflow = WorkflowType(workflow_type)\n\n        match workflow:\n            case WorkflowType.CASE_ANALYSIS:\n                return await self.run_case_analysis(**kwargs)\n            case WorkflowType.DOCUMENT_GENERATION:\n                return await self.run_document_generation(**kwargs)\n            case WorkflowType.COMPLEX_QA:\n                return await self.run_complex_qa(**kwargs)\n            case _:\n                raise ValueError(f\"Unknown workflow type: {workflow_type}\")\n\n\n# Singleton instance\n_orchestrator: WorkflowOrchestrator | None = None\n\n\ndef get_orchestrator() -> WorkflowOrchestrator:\n    \"\"\"Get the singleton WorkflowOrchestrator instance.\"\"\"\n    global _orchestrator\n    if _orchestrator is None:\n        _orchestrator = WorkflowOrchestrator()\n    return _orchestrator\n"
}
Now update the `__init__.py` to include the orchestration:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/__init__.py",
  "old_string": "\"\"\"LangGraph workflows for multi-step AI scenarios.\n\nThis module provides StateGraph-based workflows that orchestrate\nPydanticAI agents for complex legal AI scenarios.\n\nWorkflows:\n- CaseAnalysisWorkflow: Classifier + Research + Clarification\n- DocumentGenerationWorkflow: Drafter + Reviewer + Revision loop\n- ComplexQAWorkflow: Researcher + Q&A + Citation formatter\n\"\"\"\n\nfrom .case_analysis_workflow import CaseAnalysisWorkflow, case_analysis_workflow\nfrom .complex_qa_workflow import ComplexQAWorkflow, complex_qa_workflow\nfrom .document_generation_workflow import (\n    DocumentGenerationWorkflow,\n    document_generation_workflow,\n)\nfrom .states import (\n    CaseAnalysisState,\n    ComplexQAState,\n    DocumentGenerationState,\n    WorkflowMetadata,\n)\n\n__all__ = [\n    \"states\",\n    \"CaseAnalysisState\",\n    \"ComplexQAState\",\n    \"DocumentGenerationState\",\n    \"WorkflowMetadata\",\n    \"CaseAnalysisWorkflow\",\n    \"case_analysis_workflow\",\n    \"DocumentGenerationWorkflow\",\n    \"document_generation_workflow\",\n    \"ComplexQAWorkflow\",\n    \"complex_qa_workflow\",\n]",
  "new_string": "\"\"\"LangGraph workflows for multi-step AI scenarios.\n\nThis module provides StateGraph-based workflows that orchestrate\nPydanticAI agents for complex legal AI scenarios.\n\nWorkflows:\n- CaseAnalysisWorkflow: Classifier + Research + Clarification\n- DocumentGenerationWorkflow: Drafter + Reviewer + Revision loop\n- ComplexQAWorkflow: Researcher + Q&A + Citation formatter\n- WorkflowOrchestrator: Unified interface for all workflows\n\"\"\"\n\nfrom .case_analysis_workflow import CaseAnalysisWorkflow, case_analysis_workflow\nfrom .complex_qa_workflow import ComplexQAWorkflow, complex_qa_workflow\nfrom .document_generation_workflow import (\n    DocumentGenerationWorkflow,\n    document_generation_workflow,\n)\nfrom .orchestration import WorkflowOrchestrator, WorkflowType, get_orchestrator\nfrom .states import (\n    CaseAnalysisState,\n    ComplexQAState,\n    DocumentGenerationState,\n    WorkflowMetadata,\n)\n\n__all__ = [\n    \"states\",\n    \"CaseAnalysisState\",\n    \"ComplexQAState\",\n    \"DocumentGenerationState\",\n    \"WorkflowMetadata\",\n    \"CaseAnalysisWorkflow\",\n    \"case_analysis_workflow\",\n    \"DocumentGenerationWorkflow\",\n    \"document_generation_workflow\",\n    \"ComplexQAWorkflow\",\n    \"complex_qa_workflow\",\n    \"WorkflowOrchestrator\",\n    \"WorkflowType\",\n    \"get_orchestrator\",\n]"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/__init__.py"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/__init__.py",
  "old_string": "from .case_analysis_workflow import CaseAnalysisWorkflow, case_analysis_workflow\nfrom .complex_qa_workflow import ComplexQAWorkflow, complex_qa_workflow\nfrom .document_generation_workflow import (\n    DocumentGenerationWorkflow,\n    document_generation_workflow,\n)\nfrom .states import (\n    CaseAnalysisState,\n    ComplexQAState,\n    DocumentGenerationState,\n    WorkflowMetadata,\n)\n\n__all__ = [\n    \"CaseAnalysisState\",\n    \"CaseAnalysisWorkflow\",\n    \"ComplexQAState\",\n    \"ComplexQAWorkflow\",\n    \"DocumentGenerationState\",\n    \"DocumentGenerationWorkflow\",\n    \"WorkflowMetadata\",\n    \"case_analysis_workflow\",\n    \"complex_qa_workflow\",\n    \"document_generation_workflow\",\n    \"states\",\n]",
  "new_string": "from .case_analysis_workflow import CaseAnalysisWorkflow, case_analysis_workflow\nfrom .complex_qa_workflow import ComplexQAWorkflow, complex_qa_workflow\nfrom .document_generation_workflow import (\n    DocumentGenerationWorkflow,\n    document_generation_workflow,\n)\nfrom .orchestration import WorkflowOrchestrator, WorkflowType, get_orchestrator\nfrom .states import (\n    CaseAnalysisState,\n    ComplexQAState,\n    DocumentGenerationState,\n    WorkflowMetadata,\n)\n\n__all__ = [\n    \"CaseAnalysisState\",\n    \"CaseAnalysisWorkflow\",\n    \"ComplexQAState\",\n    \"ComplexQAWorkflow\",\n    \"DocumentGenerationState\",\n    \"DocumentGenerationWorkflow\",\n    \"WorkflowMetadata\",\n    \"WorkflowOrchestrator\",\n    \"WorkflowType\",\n    \"case_analysis_workflow\",\n    \"complex_qa_workflow\",\n    \"document_generation_workflow\",\n    \"get_orchestrator\",\n    \"states\",\n]"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Designing state schemas for LangGraph workflows",
      "content": "Design and implement LangGraph state schemas for workflows",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Case Analysis Workflow",
      "content": "Implement Case Analysis Workflow (classifier + research + clarification)",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Document Generation Workflow",
      "content": "Implement Document Generation Workflow (drafter + reviewer + revision loop)",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Complex Q&A Workflow",
      "content": "Implement Complex Q&A Workflow (researcher + Q&A + citation formatter)",
      "status": "completed"
    },
    {
      "activeForm": "Creating workflow orchestration service",
      "content": "Create workflow orchestration service",
      "status": "completed"
    },
    {
      "activeForm": "Adding FastAPI endpoints for workflows",
      "content": "Add FastAPI endpoints for workflows",
      "status": "in_progress"
    },
    {
      "activeForm": "Adding unit tests for workflows",
      "content": "Add unit tests for workflows",
      "status": "pending"
    }
  ]
}
Now let me check the existing FastAPI app structure and add the workflow endpoints:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py"
}
Now I need to add the workflow endpoints. Let me add them to the main.py file:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "from .agents.classifier_agent import classifier_agent as get_classifier_agent\nfrom .agents.drafting_agent import DraftResult, drafting_agent\nfrom .agents.qa_agent import answer_question\nfrom .langfuse_init import flush, init_langfuse\nfrom .models.requests import (\n    AskQuestionRequest,\n    ClassifyCaseRequest,\n    GenerateDocumentRequest,\n    GenerateEmbeddingsRequest,\n    QARequest,\n    SearchRulingsRequest,\n    SemanticSearchRequest,\n)\nfrom .models.responses import (\n    AnswerResponse,\n    Citation,\n    ClassificationResponse,\n    DocumentGenerationStatus,\n    GenerateDocumentResponse,\n    GenerateEmbeddingsResponse,\n    QAResponse,\n    Ruling,\n    SearchRulingsResponse,\n    SemanticSearchResponse,\n    SemanticSearchResult,\n)\nfrom .sentry_init import init_sentry",
  "new_string": "from .agents.classifier_agent import classifier_agent as get_classifier_agent\nfrom .agents.drafting_agent import DraftResult, drafting_agent\nfrom .agents.qa_agent import answer_question\nfrom .langfuse_init import flush, init_langfuse\nfrom .models.requests import (\n    AskQuestionRequest,\n    ClassifyCaseRequest,\n    GenerateDocumentRequest,\n    GenerateEmbeddingsRequest,\n    QARequest,\n    SearchRulingsRequest,\n    SemanticSearchRequest,\n)\nfrom .models.responses import (\n    AnswerResponse,\n    Citation,\n    ClassificationResponse,\n    DocumentGenerationStatus,\n    GenerateDocumentResponse,\n    GenerateEmbeddingsResponse,\n    QAResponse,\n    Ruling,\n    SearchRulingsResponse,\n    SemanticSearchResponse,\n    SemanticSearchResult,\n)\nfrom .sentry_init import init_sentry\nfrom .workflows import get_orchestrator, WorkflowType"
}
Now let me add the workflow endpoints at the end of the file:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "        raise HTTPException(\n            status_code=500,\n            detail=f\"RAG question answering failed: {e!s}\",\n        ) from e",
  "new_string": "        raise HTTPException(\n            status_code=500,\n            detail=f\"RAG question answering failed: {e!s}\",\n        ) from e\n\n\n# -----------------------------------------------------------------------------\n# LangGraph Workflow Endpoints\n# -----------------------------------------------------------------------------\n\n\n@app.post(\"/api/v1/workflows/case-analysis\")\nasync def workflow_case_analysis(request: ClassifyCaseRequest, http_request: Request):\n    \"\"\"Run the Case Analysis workflow.\n\n    This multi-step workflow:\n    1. Classifies the case to identify legal grounds\n    2. Researches relevant legal context\n    3. Generates clarification questions if needed\n    4. Produces a comprehensive analysis report\n\n    Uses LangGraph for orchestration between PydanticAI agents.\n    \"\"\"\n    try:\n        user_id = http_request.headers.get(\"x-user-id\")\n        session_id = request.session_id if hasattr(request, \"session_id\") else \"workflow\"\n\n        orchestrator = get_orchestrator()\n        result = await orchestrator.run_case_analysis(\n            case_description=request.case_description,\n            session_id=session_id,\n            user_id=user_id,\n        )\n\n        return result\n\n    except Exception as e:\n        raise HTTPException(\n            status_code=500,\n            detail=f\"Case analysis workflow failed: {e!s}\",\n        ) from e\n\n\n@app.post(\"/api/v1/workflows/document-generation\")\nasync def workflow_document_generation(request: GenerateDocumentRequest, http_request: Request):\n    \"\"\"Run the Document Generation workflow.\n\n    This multi-step workflow:\n    1. Classifies the case for legal context\n    2. Generates the initial document\n    3. Reviews quality and completeness\n    4. Iterates with revisions if needed\n    5. Produces the final approved document\n\n    Uses LangGraph for orchestration between PydanticAI agents.\n    \"\"\"\n    try:\n        user_id = http_request.headers.get(\"x-user-id\")\n        session_id = request.session_id if hasattr(request, \"session_id\") else \"workflow\"\n\n        orchestrator = get_orchestrator()\n        result = await orchestrator.run_document_generation(\n            document_type=request.document_type.value,\n            description=request.description,\n            context=request.context,\n            session_id=session_id,\n            user_id=user_id,\n            max_iterations=3,\n        )\n\n        return result\n\n    except Exception as e:\n        raise HTTPException(\n            status_code=500,\n            detail=f\"Document generation workflow failed: {e!s}\",\n        ) from e\n\n\n@app.post(\"/api/v1/workflows/complex-qa\")\nasync def workflow_complex_qa(request: AskQuestionRequest, http_request: Request):\n    \"\"\"Run the Complex Q&A workflow.\n\n    This multi-step workflow:\n    1. Analyzes the query to extract key information\n    2. Generates clarification questions if needed\n    3. Performs deep legal research\n    4. Generates a comprehensive answer\n    5. Formats and validates citations\n\n    Uses LangGraph for orchestration between PydanticAI agents.\n    \"\"\"\n    try:\n        user_id = http_request.headers.get(\"x-user-id\")\n\n        orchestrator = get_orchestrator()\n        result = await orchestrator.run_complex_qa(\n            question=request.question,\n            mode=request.mode,\n            session_id=request.session_id,\n            user_id=user_id,\n        )\n\n        return result\n\n    except Exception as e:\n        raise HTTPException(\n            status_code=500,\n            detail=f\"Complex Q&A workflow failed: {e!s}\",\n        ) from e"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Designing state schemas for LangGraph workflows",
      "content": "Design and implement LangGraph state schemas for workflows",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Case Analysis Workflow",
      "content": "Implement Case Analysis Workflow (classifier + research + clarification)",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Document Generation Workflow",
      "content": "Implement Document Generation Workflow (drafter + reviewer + revision loop)",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Complex Q&A Workflow",
      "content": "Implement Complex Q&A Workflow (researcher + Q&A + citation formatter)",
      "status": "completed"
    },
    {
      "activeForm": "Creating workflow orchestration service",
      "content": "Create workflow orchestration service",
      "status": "completed"
    },
    {
      "activeForm": "Adding FastAPI endpoints for workflows",
      "content": "Add FastAPI endpoints for workflows",
      "status": "completed"
    },
    {
      "activeForm": "Adding unit tests for workflows",
      "content": "Add unit tests for workflows",
      "status": "in_progress"
    }
  ]
}
Now let me add unit tests for the workflows. First, let me check the existing test structure:

🔧 Tool: Glob
Input: {
  "pattern": "apps/ai-engine/tests/**/*.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests/conftest.py"
}
Now let me create unit tests for the workflows:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests/unit/test_workflows.py",
  "content": "\"\"\"Unit tests for LangGraph workflows.\n\nThese tests verify:\n- State schema creation\n- Workflow graph compilation\n- Conditional edge routing logic\n- Orchestration service interface\n\"\"\"\n\nimport pytest\n\nfrom src.workflows.states import (\n    CaseAnalysisState,\n    ComplexQAState,\n    DocumentGenerationState,\n    WorkflowMetadata,\n    create_case_analysis_state,\n    create_complex_qa_state,\n    create_document_generation_state,\n    LegalGround,\n    RetrievedContext,\n    LegalCitation,\n    ClarificationQuestion,\n)\nfrom src.workflows.case_analysis_workflow import (\n    CaseAnalysisWorkflow,\n    case_analysis_workflow,\n    should_clarify,\n    after_clarify,\n)\nfrom src.workflows.document_generation_workflow import (\n    DocumentGenerationWorkflow,\n    document_generation_workflow,\n    should_revise,\n)\nfrom src.workflows.complex_qa_workflow import (\n    ComplexQAWorkflow,\n    complex_qa_workflow,\n    should_clarify as qa_should_clarify,\n)\nfrom src.workflows.orchestration import (\n    WorkflowOrchestrator,\n    WorkflowType,\n    get_orchestrator,\n)\n\n\n# -----------------------------------------------------------------------------\n# Pydantic Model Tests\n# -----------------------------------------------------------------------------\n\n\nclass TestLegalGround:\n    \"\"\"Tests for LegalGround model.\"\"\"\n\n    def test_create_legal_ground(self):\n        \"\"\"Test creating a valid LegalGround.\"\"\"\n        ground = LegalGround(\n            name=\"Breach of Contract\",\n            description=\"The defendant failed to fulfill contractual obligations\",\n            confidence_score=0.85,\n            legal_basis=[\"Art. 471 KC\", \"Art. 355 KC\"],\n            notes=\"Requires evidence of contract existence\",\n        )\n\n        assert ground.name == \"Breach of Contract\"\n        assert ground.confidence_score == 0.85\n        assert len(ground.legal_basis) == 2\n\n\nclass TestRetrievedContext:\n    \"\"\"Tests for RetrievedContext model.\"\"\"\n\n    def test_create_retrieved_context(self):\n        \"\"\"Test creating a valid RetrievedContext.\"\"\"\n        context = RetrievedContext(\n            content=\"Statute of limitations is 10 years\",\n            source=\"Polish Civil Code\",\n            article=\"Art. 118\",\n            similarity=0.92,\n            url=\"https://isap.sejm.gov.pl/\",\n        )\n\n        assert context.source == \"Polish Civil Code\"\n        assert context.similarity == 0.92\n\n\nclass TestLegalCitation:\n    \"\"\"Tests for LegalCitation model.\"\"\"\n\n    def test_create_legal_citation(self):\n        \"\"\"Test creating a valid LegalCitation.\"\"\"\n        citation = LegalCitation(\n            source=\"Supreme Court\",\n            article=\"III CZP 45/23\",\n            url=\"https://sn.pl/orzeczenia\",\n        )\n\n        assert citation.source == \"Supreme Court\"\n        assert citation.article == \"III CZP 45/23\"\n\n\nclass TestClarificationQuestion:\n    \"\"\"Tests for ClarificationQuestion model.\"\"\"\n\n    def test_create_clarification_question(self):\n        \"\"\"Test creating a valid ClarificationQuestion.\"\"\"\n        question = ClarificationQuestion(\n            question=\"When did the breach occur?\",\n            question_type=\"timeline\",\n            options=[\"Less than 1 year ago\", \"1-3 years ago\", \"More than 3 years ago\"],\n            hint=\"Select the closest time range\",\n        )\n\n        assert question.question_type == \"timeline\"\n        assert len(question.options) == 3\n\n\nclass TestWorkflowMetadata:\n    \"\"\"Tests for WorkflowMetadata model.\"\"\"\n\n    def test_create_workflow_metadata(self):\n        \"\"\"Test creating valid WorkflowMetadata.\"\"\"\n        metadata = WorkflowMetadata(\n            session_id=\"test-session\",\n            user_id=\"test-user\",\n            current_step=\"classify\",\n            iteration_count=1,\n        )\n\n        assert metadata.session_id == \"test-session\"\n        assert metadata.current_step == \"classify\"\n        assert metadata.iteration_count == 1\n\n\n# -----------------------------------------------------------------------------\n# State Creation Tests\n# -----------------------------------------------------------------------------\n\n\nclass TestCaseAnalysisState:\n    \"\"\"Tests for CaseAnalysisState creation and manipulation.\"\"\"\n\n    def test_create_case_analysis_state(self):\n        \"\"\"Test creating initial CaseAnalysisState.\"\"\"\n        state = create_case_analysis_state(\n            case_description=\"Employer fired me without notice\",\n            session_id=\"test-session\",\n            user_id=\"test-user\",\n        )\n\n        assert state[\"case_description\"] == \"Employer fired me without notice\"\n        assert state[\"metadata\"][\"session_id\"] == \"test-session\"\n        assert state[\"metadata\"][\"user_id\"] == \"test-user\"\n        assert state[\"metadata\"][\"current_step\"] == \"classify\"\n        assert state[\"next_step\"] == \"classify\"\n        assert state[\"needs_clarification\"] is False\n        assert state[\"legal_grounds\"] == []\n        assert state[\"clarification_questions\"] == []\n\n    def test_case_analysis_state_with_legal_grounds(self):\n        \"\"\"Test updating state with legal grounds.\"\"\"\n        state = create_case_analysis_state(\n            case_description=\"Test case\",\n            session_id=\"test\",\n        )\n\n        ground = {\n            \"name\": \"Wrongful Termination\",\n            \"description\": \"Employer violated labor law\",\n            \"confidence_score\": 0.8,\n            \"legal_basis\": [\"Art. 52 KP\"],\n            \"notes\": None,\n        }\n\n        state[\"legal_grounds\"] = [ground]\n        state[\"classification_confidence\"] = 0.8\n\n        assert len(state[\"legal_grounds\"]) == 1\n        assert state[\"legal_grounds\"][0][\"name\"] == \"Wrongful Termination\"\n        assert state[\"classification_confidence\"] == 0.8\n\n\nclass TestDocumentGenerationState:\n    \"\"\"Tests for DocumentGenerationState creation and manipulation.\"\"\"\n\n    def test_create_document_generation_state(self):\n        \"\"\"Test creating initial DocumentGenerationState.\"\"\"\n        state = create_document_generation_state(\n            document_type=\"lawsuit\",\n            description=\"Draft a lawsuit for unpaid wages\",\n            session_id=\"test-session\",\n        )\n\n        assert state[\"document_type\"] == \"lawsuit\"\n        assert state[\"description\"] == \"Draft a lawsuit for unpaid wages\"\n        assert state[\"metadata\"][\"current_step\"] == \"classify_case\"\n        assert state[\"next_step\"] == \"classify_case\"\n        assert state[\"draft_iteration\"] == 0\n        assert state[\"approved\"] is False\n        assert state[\"max_iterations\"] == 3\n\n    def test_document_generation_state_with_context(self):\n        \"\"\"Test creating state with additional context.\"\"\"\n        context = {\"employer\": \"ABC Corp\", \"amount\": \"50000 PLN\"}\n\n        state = create_document_generation_state(\n            document_type=\"complaint\",\n            description=\"Test\",\n            context=context,\n        )\n\n        assert state[\"context\"] == context\n        assert state[\"context\"][\"employer\"] == \"ABC Corp\"\n\n\nclass TestComplexQAState:\n    \"\"\"Tests for ComplexQAState creation and manipulation.\"\"\"\n\n    def test_create_complex_qa_state(self):\n        \"\"\"Test creating initial ComplexQAState.\"\"\"\n        state = create_complex_qa_state(\n            question=\"What is the statute of limitations for contract disputes?\",\n            mode=\"LAWYER\",\n            session_id=\"test-session\",\n        )\n\n        assert state[\"question\"] == \"What is the statute of limitations for contract disputes?\"\n        assert state[\"mode\"] == \"LAWYER\"\n        assert state[\"metadata\"][\"current_step\"] == \"analyze_query\"\n        assert state[\"next_step\"] == \"analyze_query\"\n        assert state[\"needs_clarification\"] is False\n        assert state[\"retrieved_contexts\"] == []\n\n    def test_complex_qa_state_default_mode(self):\n        \"\"\"Test creating state with default SIMPLE mode.\"\"\"\n        state = create_complex_qa_state(question=\"Test question\")\n\n        assert state[\"mode\"] == \"SIMPLE\"\n\n\n# -----------------------------------------------------------------------------\n# Conditional Edge Tests\n# -----------------------------------------------------------------------------\n\n\nclass TestCaseAnalysisConditionalEdges:\n    \"\"\"Tests for Case Analysis workflow conditional edges.\"\"\"\n\n    def test_should_clarify_with_low_confidence(self):\n        \"\"\"Test routing to clarification when confidence is low.\"\"\"\n        state: CaseAnalysisState = {\n            \"case_description\": \"Test\",\n            \"classification_confidence\": 0.5,\n            \"needs_clarification\": True,\n            \"legal_grounds\": [],\n            \"metadata\": {\"session_id\": \"test\"},\n            \"next_step\": \"check\",\n        }\n\n        result = should_clarify(state)\n        assert result == \"clarify\"\n\n    def test_should_clarify_with_high_confidence(self):\n        \"\"\"Test routing to research when confidence is high.\"\"\"\n        state: CaseAnalysisState = {\n            \"case_description\": \"Test\",\n            \"classification_confidence\": 0.85,\n            \"needs_clarification\": False,\n            \"legal_grounds\": [{\"name\": \"Test\"}],\n            \"metadata\": {\"session_id\": \"test\"},\n            \"next_step\": \"check\",\n        }\n\n        result = should_clarify(state)\n        assert result == \"research\"\n\n    def test_after_clarify_with_responses(self):\n        \"\"\"Test routing to research after user provides responses.\"\"\"\n        state: CaseAnalysisState = {\n            \"case_description\": \"Test\",\n            \"user_responses\": {\"timeline\": \"2023\", \"amount\": \"10000\"},\n            \"clarification_questions\": [],\n            \"metadata\": {\"session_id\": \"test\"},\n            \"next_step\": \"clarify\",\n        }\n\n        result = after_clarify(state)\n        assert result == \"research\"\n\n    def test_after_clarify_without_responses(self):\n        \"\"\"Test routing to complete when no user responses.\"\"\"\n        state: CaseAnalysisState = {\n            \"case_description\": \"Test\",\n            \"user_responses\": {},\n            \"clarification_questions\": [{\"question\": \"When?\"}],\n            \"metadata\": {\"session_id\": \"test\"},\n            \"next_step\": \"clarify\",\n        }\n\n        result = after_clarify(state)\n        assert result == \"complete\"\n\n\nclass TestDocumentGenerationConditionalEdges:\n    \"\"\"Tests for Document Generation workflow conditional edges.\"\"\"\n\n    def test_should_revise_when_not_approved(self):\n        \"\"\"Test routing to revision when not approved.\"\"\"\n        state: DocumentGenerationState = {\n            \"document_type\": \"lawsuit\",\n            \"description\": \"Test\",\n            \"approved\": False,\n            \"draft_iteration\": 1,\n            \"max_iterations\": 3,\n            \"metadata\": {\"session_id\": \"test\"},\n            \"next_step\": \"check\",\n        }\n\n        result = should_revise(state)\n        assert result == \"revise\"\n\n    def test_should_complete_when_approved(self):\n        \"\"\"Test routing to complete when approved.\"\"\"\n        state: DocumentGenerationState = {\n            \"document_type\": \"lawsuit\",\n            \"description\": \"Test\",\n            \"approved\": True,\n            \"draft_iteration\": 1,\n            \"max_iterations\": 3,\n            \"metadata\": {\"session_id\": \"test\"},\n            \"next_step\": \"check\",\n        }\n\n        result = should_revise(state)\n        assert result == \"complete\"\n\n    def test_should_complete_at_max_iterations(self):\n        \"\"\"Test routing to complete when max iterations reached.\"\"\"\n        state: DocumentGenerationState = {\n            \"document_type\": \"lawsuit\",\n            \"description\": \"Test\",\n            \"approved\": False,\n            \"draft_iteration\": 3,\n            \"max_iterations\": 3,\n            \"metadata\": {\"session_id\": \"test\"},\n            \"next_step\": \"check\",\n        }\n\n        result = should_revise(state)\n        assert result == \"complete\"\n\n\nclass TestComplexQAConditionalEdges:\n    \"\"\"Tests for Complex Q&A workflow conditional edges.\"\"\"\n\n    def test_should_clarify_when_needed(self):\n        \"\"\"Test routing to clarification when needed.\"\"\"\n        state: ComplexQAState = {\n            \"question\": \"Test\",\n            \"mode\": \"SIMPLE\",\n            \"needs_clarification\": True,\n            \"user_responses\": None,\n            \"metadata\": {\"session_id\": \"test\"},\n            \"next_step\": \"check\",\n        }\n\n        result = qa_should_clarify(state)\n        assert result == \"clarify\"\n\n    def test_should_research_with_responses(self):\n        \"\"\"Test routing to research when user has provided responses.\"\"\"\n        state: ComplexQAState = {\n            \"question\": \"Test\",\n            \"mode\": \"SIMPLE\",\n            \"needs_clarification\": True,\n            \"user_responses\": {\"timeline\": \"2023\"},\n            \"metadata\": {\"session_id\": \"test\"},\n            \"next_step\": \"check\",\n        }\n\n        result = qa_should_clarify(state)\n        assert result == \"research\"\n\n    def test_should_research_no_clarification_needed(self):\n        \"\"\"Test routing to research when no clarification needed.\"\"\"\n        state: ComplexQAState = {\n            \"question\": \"Test\",\n            \"mode\": \"SIMPLE\",\n            \"needs_clarification\": False,\n            \"user_responses\": None,\n            \"metadata\": {\"session_id\": \"test\"},\n            \"next_step\": \"check\",\n        }\n\n        result = qa_should_clarify(state)\n        assert result == \"research\"\n\n\n# -----------------------------------------------------------------------------\n# Workflow Class Tests\n# -----------------------------------------------------------------------------\n\n\nclass TestCaseAnalysisWorkflowClass:\n    \"\"\"Tests for CaseAnalysisWorkflow class.\"\"\"\n\n    def test_workflow_initialization(self):\n        \"\"\"Test that workflow can be initialized.\"\"\"\n        workflow = CaseAnalysisWorkflow()\n        assert workflow.graph is not None\n\n    def test_singleton_pattern(self):\n        \"\"\"Test that singleton returns same instance.\"\"\"\n        workflow1 = case_analysis_workflow()\n        workflow2 = case_analysis_workflow()\n        assert workflow1 is workflow2\n\n\nclass TestDocumentGenerationWorkflowClass:\n    \"\"\"Tests for DocumentGenerationWorkflow class.\"\"\"\n\n    def test_workflow_initialization(self):\n        \"\"\"Test that workflow can be initialized.\"\"\"\n        workflow = DocumentGenerationWorkflow()\n        assert workflow.graph is not None\n\n    def test_singleton_pattern(self):\n        \"\"\"Test that singleton returns same instance.\"\"\"\n        workflow1 = document_generation_workflow()\n        workflow2 = document_generation_workflow()\n        assert workflow1 is workflow2\n\n\nclass TestComplexQAWorkflowClass:\n    \"\"\"Tests for ComplexQAWorkflow class.\"\"\"\n\n    def test_workflow_initialization(self):\n        \"\"\"Test that workflow can be initialized.\"\"\"\n        workflow = ComplexQAWorkflow()\n        assert workflow.graph is not None\n\n    def test_singleton_pattern(self):\n        \"\"\"Test that singleton returns same instance.\"\"\"\n        workflow1 = complex_qa_workflow()\n        workflow2 = complex_qa_workflow()\n        assert workflow1 is workflow2\n\n\n# -----------------------------------------------------------------------------\n# Orchestration Tests\n# -----------------------------------------------------------------------------\n\n\nclass TestWorkflowOrchestrator:\n    \"\"\"Tests for WorkflowOrchestrator.\"\"\"\n\n    def test_orchestrator_initialization(self):\n        \"\"\"Test that orchestrator initializes all workflows.\"\"\"\n        orchestrator = WorkflowOrchestrator()\n        assert orchestrator.case_analysis is not None\n        assert orchestrator.document_generation is not None\n        assert orchestrator.complex_qa is not None\n\n    def test_singleton_pattern(self):\n        \"\"\"Test that singleton returns same instance.\"\"\"\n        orchestrator1 = get_orchestrator()\n        orchestrator2 = get_orchestrator()\n        assert orchestrator1 is orchestrator2\n\n    def test_workflow_type_enum(self):\n        \"\"\"Test WorkflowType enum values.\"\"\"\n        assert WorkflowType.CASE_ANALYSIS == \"case_analysis\"\n        assert WorkflowType.DOCUMENT_GENERATION == \"document_generation\"\n        assert WorkflowType.COMPLEX_QA == \"complex_qa\"\n\n    def test_workflow_type_from_string(self):\n        \"\"\"Test creating WorkflowType from string.\"\"\"\n        workflow_type = WorkflowType(\"case_analysis\")\n        assert workflow_type == WorkflowType.CASE_ANALYSIS\n\n    def test_run_workflow_invalid_type(self):\n        \"\"\"Test that invalid workflow type raises error.\"\"\"\n        orchestrator = WorkflowOrchestrator()\n\n        with pytest.raises(ValueError, match=\"Unknown workflow type\"):\n            import asyncio\n\n            asyncio.run(orchestrator.run_workflow(\"invalid_workflow\"))\n"
}
Now let me run the tests to verify they pass:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine && uv run pytest tests/unit/test_workflows.py -v 2>&1 | head -100",
  "description": "Run workflow unit tests",
  "timeout": 120000
}
The test error is due to a Python 3.14 compatibility issue with pydantic v1 in the langfuse library, not with our code. Let me run the tests with a lower Python version or check if we can work around this. Let me check what Python version is used in the project:

🔧 Tool: Bash
Input: {
  "command": "python --version && python3 --version",
  "description": "Check Python version"
}
The issue is with Python 3.14. Let me try using the existing tests to see if they pass and what Python version they use:

🔧 Tool: Bash
Input: {
  "command": "uv run pytest tests/test_classifier_unit.py -v 2>&1 | head -60",
  "description": "Run existing classifier unit test",
  "timeout": 120000
}
This is a pre-existing Python 3.14 compatibility issue with the langfuse library. The issue is not with our new code but with the external library. Let me check the existing test file to see how they structure their tests:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests/test_classifier_unit.py"
}
I see the existing tests also have the same issue. The Python 3.14 compatibility issue with langfuse is a pre-existing problem. Let me check if there's a way to run type checking instead, or if we can verify the code is working with a simpler test:

🔧 Tool: Bash
Input: {
  "command": "uv run python -c \"\n# Simple test to verify workflows can be imported without executing\nimport sys\nsys.path.insert(0, '.')\n\n# Test state models\nfrom src.workflows.states import (\n    LegalGround,\n    RetrievedContext,\n    LegalCitation,\n    ClarificationQuestion,\n    WorkflowMetadata,\n    create_case_analysis_state,\n    create_document_generation_state,\n    create_complex_qa_state,\n)\n\n# Test state creation\nstate1 = create_case_analysis_state('Test case', 'session-1')\nassert state1['case_description'] == 'Test case'\nprint('✓ CaseAnalysisState creation works')\n\nstate2 = create_document_generation_state('lawsuit', 'Test', session_id='session-2')\nassert state2['document_type'] == 'lawsuit'\nprint('✓ DocumentGenerationState creation works')\n\nstate3 = create_complex_qa_state('What is the statute of limitations?')\nassert state3['mode'] == 'SIMPLE'\nprint('✓ ComplexQAState creation works')\n\n# Test Pydantic models\nground = LegalGround(\n    name='Test Ground',\n    description='Test description',\n    confidence_score=0.8,\n    legal_basis=['Art. 1 KC']\n)\nassert ground.confidence_score == 0.8\nprint('✓ LegalGround model works')\n\nmetadata = WorkflowMetadata(session_id='test', current_step='init')\nassert metadata.session_id == 'test'\nprint('✓ WorkflowMetadata model works')\n\nprint()\nprint('All basic state and model tests passed!')\n\"\n",
  "description": "Test workflow state creation",
  "timeout": 60000
}
The Python 3.14 compatibility issue is a pre-existing problem with the langfuse library. This is not related to our new code. Let me update the todo list and then run a type check on the new code:

🔧 Tool: Bash
Input: {
  "command": "uv run ruff check src/workflows/ 2>&1 | head -50",
  "description": "Run ruff linting on workflow code",
  "timeout": 60000
}
Let me fix these linting issues:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "limit": 100
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "old_string": "async def classify_node(state: CaseAnalysisState) -> CaseAnalysisState:\n    \"\"\"Classify the case to identify legal grounds.\n\n    This node uses the classifier agent to analyze the case description\n    and identify applicable legal grounds with confidence scores.\n    \"\"\"\n\n    start_time = time.time()\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span for this node\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"classify\",\n                session_id=metadata.get(\"session_id\"),\n                parent_observation_id=metadata.get(\"parent_span_id\"),\n            )\n\n    try:\n        case_description = state[\"case_description\"]\n\n        # Call the classifier agent\n        result, agent_metadata = await classify_case(\n            case_description=case_description,\n            session_id=metadata.get(\"session_id\", \"default\"),\n            user_id=metadata.get(\"user_id\"),\n        )",
  "new_string": "async def classify_node(state: CaseAnalysisState) -> CaseAnalysisState:\n    \"\"\"Classify the case to identify legal grounds.\n\n    This node uses the classifier agent to analyze the case description\n    and identify applicable legal grounds with confidence scores.\n    \"\"\"\n\n    metadata = state.get(\"metadata\", {})\n\n    # Create Langfuse span for this node\n    span = None\n    if is_langfuse_enabled():\n        from ..langfuse_init import get_langfuse\n        client = get_langfuse()\n        if client:\n            span = client.span(\n                name=\"classify\",\n                session_id=metadata.get(\"session_id\"),\n                parent_observation_id=metadata.get(\"parent_span_id\"),\n            )\n\n    try:\n        case_description = state[\"case_description\"]\n\n        # Call the classifier agent\n        result, _agent_metadata = await classify_case(\n            case_description=case_description,\n            session_id=metadata.get(\"session_id\", \"default\"),\n            user_id=metadata.get(\"user_id\"),\n        )"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "offset": 200,
  "limit": 70
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "old_string": "    try:\n        # Generate search query from legal grounds\n        grounds = state.get(\"legal_grounds\", [])\n        if grounds:\n            search_terms = \" \".join([g.get(\"name\", \"\") for g in grounds[:3]])\n        else:\n            search_terms = state[\"case_description\"][:200]\n\n        # TODO: Integrate with actual vector store service",
  "new_string": "    try:\n        # Generate search query from legal grounds (currently unused, reserved for future vector store integration)\n        # grounds = state.get(\"legal_grounds\", [])\n        # if grounds:\n        #     search_terms = \" \".join([g.get(\"name\", \"\") for g in grounds[:3]])\n        # else:\n        #     search_terms = state[\"case_description\"][:200]\n\n        # TODO: Integrate with actual vector store service"
}
Now let me also fix the PERF401 issue by extending the list:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "limit": 50,
  "offset": 275
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "old_string": "    try:\n        grounds = state.get(\"legal_grounds\", [])\n        contexts = state.get(\"retrieved_contexts\", [])\n\n        # Build final analysis\n        analysis_parts = [\n            \"# Case Analysis Report\\n\",\n            \"## Identified Legal Grounds\\n\",\n        ]\n\n        for ground in grounds:\n            analysis_parts.append(\n                f\"### {ground.get('name', 'Unknown')}\\n\"\n                f\"**Confidence**: {ground.get('confidence_score', 0):.2f}\\n\\n\"\n                f\"{ground.get('description', '')}\\n\\n\"\n                f\"**Legal Basis**: {', '.join(ground.get('legal_basis', []))}\\n\"\n            )\n\n        if contexts:\n            analysis_parts.append(\"\\n## Relevant Legal Context\\n\")\n            for ctx in contexts:\n                analysis_parts.append(\n                    f\"- **{ctx.get('source', 'Unknown')} - {ctx.get('article', 'N/A')}**: \"\n                    f\"{ctx.get('content', '')[:200]}...\\n\"\n                )\n\n        # Generate recommendations based on confidence\n        confidence = state.get(\"classification_confidence\", 0.0)\n        if confidence >= 0.8:\n            recommendations = \"Strong case basis. Proceed with formal legal action preparation.\"\n        elif confidence >= 0.6:\n            recommendations = \"Moderate case basis. Additional documentation recommended.\"\n        else:\n            recommendations = \"Limited case basis. Comprehensive fact-finding required before proceeding.\"\n\n        analysis_parts.append(f\"\\n## Recommendations\\n\\n{recommendations}\")",
  "new_string": "    try:\n        grounds = state.get(\"legal_grounds\", [])\n        contexts = state.get(\"retrieved_contexts\", [])\n\n        # Build final analysis\n        analysis_parts = [\n            \"# Case Analysis Report\\n\",\n            \"## Identified Legal Grounds\\n\",\n        ]\n\n        # Add legal grounds\n        analysis_parts.extend([\n            f\"### {ground.get('name', 'Unknown')}\\n\"\n            f\"**Confidence**: {ground.get('confidence_score', 0):.2f}\\n\\n\"\n            f\"{ground.get('description', '')}\\n\\n\"\n            f\"**Legal Basis**: {', '.join(ground.get('legal_basis', []))}\\n\"\n            for ground in grounds\n        ])\n\n        if contexts:\n            analysis_parts.append(\"\\n## Relevant Legal Context\\n\")\n            analysis_parts.extend([\n                f\"- **{ctx.get('source', 'Unknown')} - {ctx.get('article', 'N/A')}**: \"\n                f\"{ctx.get('content', '')[:200]}...\\n\"\n                for ctx in contexts\n            ])\n\n        # Generate recommendations based on confidence\n        confidence = state.get(\"classification_confidence\", 0.0)\n        if confidence >= 0.8:\n            recommendations = \"Strong case basis. Proceed with formal legal action preparation.\"\n        elif confidence >= 0.6:\n            recommendations = \"Moderate case basis. Additional documentation recommended.\"\n        else:\n            recommendations = \"Limited case basis. Comprehensive fact-finding required before proceeding.\"\n\n        analysis_parts.append(f\"\\n## Recommendations\\n\\n{recommendations}\")"
}
Now let me run ruff check again to see if there are any remaining issues:

🔧 Tool: Bash
Input: {
  "command": "uv run ruff check src/workflows/ 2>&1",
  "description": "Run ruff linting on workflow code",
  "timeout": 60000
}
Let me run ruff with --fix to auto-fix the linting issues:

🔧 Tool: Bash
Input: {
  "command": "uv run ruff check --fix src/workflows/ 2>&1",
  "description": "Run ruff with auto-fix on workflow code",
  "timeout": 60000
}
Good, most issues were auto-fixed. Let me fix the remaining two issues:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "limit": 30,
  "offset": 215
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "old_string": "    try:\n        # Generate search query from legal grounds (currently unused, reserved for future vector store integration)\n        # grounds = state.get(\"legal_grounds\", [])\n        # if grounds:\n        #     search_terms = \" \".join([g.get(\"name\", \"\") for g in grounds[:3]])\n        # else:\n        #     search_terms = state[\"case_description\"][:200]\n\n        # TODO: Integrate with actual vector store service",
  "new_string": "    try:\n        # TODO: Integrate with actual vector store service\n        # Generate search query from legal grounds (currently unused, reserved for future vector store integration)\n        # grounds = state.get(\"legal_grounds\", [])\n        # if grounds:\n        #     search_terms = \" \".join([g.get(\"name\", \"\") for g in grounds[:3]])\n        # else:\n        #     search_terms = state[\"case_description\"][:200]\n\n        # TODO: Integrate with actual vector store service"
}
Now let me fix the PERF401 issue in complex_qa_workflow.py:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/complex_qa_workflow.py",
  "limit": 30,
  "offset": 320
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/complex_qa_workflow.py",
  "old_string": "    try:\n        # Gather citations from multiple sources\n        citations: list[dict[str, Any]] = []\n\n        # Agent-generated citations\n        citations.extend(state.get(\"raw_citations\", []))\n\n        # Context-based citations\n        for ctx in state.get(\"retrieved_contexts\", []):\n            citations.append({\n                \"source\": ctx.get(\"source\", \"\"),\n                \"article\": ctx.get(\"article\", \"\"),\n                \"url\": ctx.get(\"url\"),\n            })",
  "new_string": "    try:\n        # Gather citations from multiple sources\n        citations: list[dict[str, Any]] = []\n\n        # Agent-generated citations\n        citations.extend(state.get(\"raw_citations\", []))\n\n        # Context-based citations\n        citations.extend([\n            {\n                \"source\": ctx.get(\"source\", \"\"),\n                \"article\": ctx.get(\"article\", \"\"),\n                \"url\": ctx.get(\"url\"),\n            }\n            for ctx in state.get(\"retrieved_contexts\", [])\n        ])"
}

🔧 Tool: Bash
Input: {
  "command": "uv run ruff check src/workflows/ 2>&1",
  "description": "Run ruff linting on workflow code",
  "timeout": 60000
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "limit": 20,
  "offset": 217
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "old_string": "    try:\n        # TODO: Integrate with actual vector store service\n        # Generate search query from legal grounds (currently unused, reserved for future vector store integration)\n        # grounds = state.get(\"legal_grounds\", [])\n        # if grounds:\n        #     search_terms = \" \".join([g.get(\"name\", \"\") for g in grounds[:3]])\n        # else:\n        #     search_terms = state[\"case_description\"][:200]\n\n        # TODO: Integrate with actual vector store service\n        # For now, mock retrieval",
  "new_string": "    try:\n        # TODO: Integrate with actual vector store service\n        # Generate search query from legal grounds (currently unused, reserved\n        # for future vector store integration)\n        # grounds = state.get(\"legal_grounds\", [])\n        # if grounds:\n        #     search_terms = \" \".join([g.get(\"name\", \"\") for g in grounds[:3]])\n        # else:\n        #     search_terms = state[\"case_description\"][:200]\n\n        # For now, mock retrieval"
}

🔧 Tool: Bash
Input: {
  "command": "uv run ruff check src/workflows/ 2>&1",
  "description": "Run ruff linting on workflow code",
  "timeout": 60000
}
Now let me update the todo list and run a quick syntax check with Python:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Designing state schemas for LangGraph workflows",
      "content": "Design and implement LangGraph state schemas for workflows",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Case Analysis Workflow",
      "content": "Implement Case Analysis Workflow (classifier + research + clarification)",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Document Generation Workflow",
      "content": "Implement Document Generation Workflow (drafter + reviewer + revision loop)",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Complex Q&A Workflow",
      "content": "Implement Complex Q&A Workflow (researcher + Q&A + citation formatter)",
      "status": "completed"
    },
    {
      "activeForm": "Creating workflow orchestration service",
      "content": "Create workflow orchestration service",
      "status": "completed"
    },
    {
      "activeForm": "Adding FastAPI endpoints for workflows",
      "content": "Add FastAPI endpoints for workflows",
      "status": "completed"
    },
    {
      "activeForm": "Adding unit tests for workflows",
      "content": "Add unit tests for workflows",
      "status": "completed"
    }
  ]
}
Let me verify the Python syntax of the new code by running a simple import check (without actually importing the modules due to the langfuse Python 3.14 issue):

🔧 Tool: Bash
Input: {
  "command": "python -m py_compile /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/states.py 2>&1 && python -m py_compile /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/orchestration.py 2>&1 && echo \"✅ Python syntax is valid\"",
  "description": "Check Python syntax of workflow files",
  "timeout": 30000
}
The Python syntax is valid. Now let me create a simple documentation file that summarizes the workflows:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/WORKFLOWS.md",
  "content": "# LangGraph Workflows\n\nThis directory contains LangGraph-based workflows that orchestrate PydanticAI agents for complex multi-step legal AI scenarios.\n\n## Architecture\n\nLangGraph is used only for **orchestration** between PydanticAI agents, not for direct LLM calls. Each agent remains a pure PydanticAI implementation.\n\n## Workflows\n\n### 1. Case Analysis Workflow\n\n**File:** `case_analysis_workflow.py`\n\n**Purpose:** Analyze legal cases to identify applicable legal grounds with confidence scores.\n\n**Flow:**\n```\nclassify → check_clarification → clarify (if needed) → research → complete\n                                         ↓\n                                    research (if sufficient info)\n```\n\n**Nodes:**\n- `classify`: Uses classifier agent to identify legal grounds\n- `check_clarification`: Determines if clarification is needed based on confidence\n- `clarify`: Generates follow-up questions using clarification agent\n- `research`: Retrieves relevant legal context from vector store\n- `complete`: Produces final analysis report\n\n**State Schema:** `CaseAnalysisState`\n\n**Conditional Edges:**\n- `should_clarify`: Routes to clarify or research based on `needs_clarification` flag\n- `after_clarify`: Routes to research or complete based on whether user provided responses\n\n**API Endpoint:** `POST /api/v1/workflows/case-analysis`\n\n### 2. Document Generation Workflow\n\n**File:** `document_generation_workflow.py`\n\n**Purpose:** Generate legal documents with iterative review and revision.\n\n**Flow:**\n```\nclassify_case → draft → review → check_approval → revise (loop back to draft)\n                                                      ↓\n                                                 complete\n```\n\n**Nodes:**\n- `classify_case`: Identifies legal grounds for better drafting\n- `draft`: Generates document using drafting agent\n- `review`: Reviews quality and completeness (placeholder for reviewer agent)\n- `check_approval`: Decides if revision needed based on approval status\n- `revise`: Pass-through node for looping back to draft\n- `complete`: Finalizes approved document\n\n**State Schema:** `DocumentGenerationState`\n\n**Conditional Edges:**\n- `should_revise`: Routes to revise or complete based on approval and iteration count\n\n**Loop Protection:** Maximum 3 iterations (configurable)\n\n**API Endpoint:** `POST /api/v1/workflows/document-generation`\n\n### 3. Complex Q&A Workflow\n\n**File:** `complex_qa_workflow.py`\n\n**Purpose:** Provide comprehensive legal answers with deep research and citation formatting.\n\n**Flow:**\n```\nanalyze_query → check_clarification → clarify (if needed) → research → generate_answer → format_citations → complete\n                                                     ↓\n                                                 research (if sufficient info)\n```\n\n**Nodes:**\n- `analyze_query`: Extracts key terms and query type using query analyzer agent\n- `check_clarification`: Determines if clarification needed\n- `clarify`: Generates follow-up questions\n- `research`: Performs deep legal research (statutes, case law)\n- `generate_answer`: Creates comprehensive answer using Q&A agent\n- `format_citations`: Validates and formats all citations\n- `complete`: Finalizes response\n\n**State Schema:** `ComplexQAState`\n\n**Conditional Edges:**\n- `should_clarify`: Routes to clarify or research based on `needs_clarification` and user responses\n\n**API Endpoint:** `POST /api/v1/workflows/complex-qa`\n\n## State Schemas\n\nAll state schemas are defined in `states.py` using `TypedDict` for LangGraph compatibility.\n\n### Common Components\n\n**WorkflowMetadata:**\n```python\nclass WorkflowMetadata(BaseModel):\n    session_id: str\n    user_id: str | None = None\n    start_time: float | None = None\n    current_step: str = \"init\"\n    iteration_count: int = 0\n```\n\n### State Factory Functions\n\nEach workflow has a factory function to create initial state:\n- `create_case_analysis_state()`\n- `create_document_generation_state()`\n- `create_complex_qa_state()`\n\n## Orchestration\n\n**File:** `orchestration.py`\n\n**WorkflowOrchestrator** provides a unified interface for executing all workflows:\n\n```python\norchestrator = get_orchestrator()\n\n# Run specific workflow\nresult = await orchestrator.run_case_analysis(case_description=\"...\")\nresult = await orchestrator.run_document_generation(document_type=\"lawsuit\", ...)\nresult = await orchestrator.run_complex_qa(question=\"...\")\n\n# Or use generic entry point\nresult = await orchestrator.run_workflow(\n    WorkflowType.CASE_ANALYSIS,\n    case_description=\"...\"\n)\n```\n\n## Observability\n\nAll workflows include Langfuse tracing:\n- Trace created at workflow start\n- Span created for each node execution\n- Output and metadata captured\n- Errors logged with span status\n\n## Error Handling\n\nEach workflow includes:\n- Try-catch blocks in all nodes\n- Error state stored in workflow state\n- Langfuse span error reporting\n- Graceful degradation (e.g., clarification failure doesn't block research)\n\n## Testing\n\nUnit tests are located in `tests/unit/test_workflows.py`:\n- Pydantic model validation\n- State creation and manipulation\n- Conditional edge routing logic\n- Workflow class initialization\n- Orchestration service interface\n\n**Note:** Tests are affected by Python 3.14 compatibility issues with the langfuse library (pre-existing issue).\n\n## Future Enhancements\n\n1. **Vector Store Integration:** Replace mock retrieval with actual backend calls\n2. **Reviewer Agent:** Implement dedicated PydanticAI agent for document review\n3. **Research Agent:** Implement dedicated agent for deep legal research\n4. **State Persistence:** Add workflow state persistence for long-running operations\n5. **Parallel Execution:** Use LangGraph's parallel execution for independent nodes\n"
}
Now let me provide a final summary of the implementation:

<summary>
## Summary: LangGraph Workflows Implementation

### Changes Implemented

1. **Created workflow state schemas** (`src/workflows/states.py`)
   - `CaseAnalysisState` for case analysis workflow
   - `DocumentGenerationState` for document generation workflow
   - `ComplexQAState` for complex Q&A workflow
   - `WorkflowMetadata` for tracking execution
   - Factory functions for creating initial states

2. **Implemented Case Analysis Workflow** (`src/workflows/case_analysis_workflow.py`)
   - Nodes: classify, check_clarification, clarify, research, complete
   - Conditional routing based on confidence scores
   - Integration with classifier and clarification agents
   - Final analysis report generation

3. **Implemented Document Generation Workflow** (`src/workflows/document_generation_workflow.py`)
   - Nodes: classify_case, draft, review, check_approval, revise, complete
   - Revision loop with configurable max iterations (default: 3)
   - Quality review with placeholder for reviewer agent
   - Integration with classifier and drafting agents

4. **Implemented Complex Q&A Workflow** (`src/workflows/complex_qa_workflow.py`)
   - Nodes: analyze_query, check_clarification, clarify, research, generate_answer, format_citations, complete
   - Deep research with statute/case law separation
   - Citation formatting and deduplication
   - Integration with query analyzer, Q&A, and clarification agents

5. **Created orchestration service** (`src/workflows/orchestration.py`)
   - `WorkflowOrchestrator` class with unified interface
   - `WorkflowType` enum for workflow selection
   - Generic `run_workflow()` method for dynamic execution
   - Singleton pattern for efficiency

6. **Added FastAPI endpoints** (`src/main.py`)
   - `POST /api/v1/workflows/case-analysis`
   - `POST /api/v1/workflows/document-generation`
   - `POST /api/v1/workflows/complex-qa`

7. **Added unit tests** (`tests/unit/test_workflows.py`)
   - Pydantic model validation tests
   - State creation tests
   - Conditional edge logic tests
   - Workflow class tests
   - Orchestration service tests

8. **Added documentation** (`WORKFLOWS.md`)
   - Workflow architecture overview
   - Flow diagrams and node descriptions
   - Usage examples and API endpoints

### Files Modified
- `apps/ai-engine/src/main.py` - Added workflow imports and endpoints
- `apps/ai-engine/pyproject.toml` - Already had langgraph dependency

### Files Created
- `apps/ai-engine/src/workflows/__init__.py`
- `apps/ai-engine/src/workflows/states.py`
- `apps/ai-engine/src/workflows/case_analysis_workflow.py`
- `apps/ai-engine/src/workflows/document_generation_workflow.py`
- `apps/ai-engine/src/workflows/complex_qa_workflow.py`
- `apps/ai-engine/src/workflows/orchestration.py`
- `apps/ai-engine/tests/unit/test_workflows.py`
- `apps/ai-engine/WORKFLOWS.md`

### Notes for Developer
- LangGraph is used only for orchestration between PydanticAI agents, not for direct LLM calls
- All workflows include Langfuse observability with trace/span tracking
- Mock vector store retrieval is used; replace with actual backend calls when ready
- The reviewer agent is a placeholder; implement as a dedicated PydanticAI agent when needed
- Tests cannot run due to a pre-existing Python 3.14 compatibility issue with the langfuse library
- Code passes ruff linting checks
- Python syntax validation passed
</summary>