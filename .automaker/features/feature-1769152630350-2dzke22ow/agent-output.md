I'll analyze the error and fix it. The issue is that `sentry_sdk.Span` doesn't exist in the version of Sentry SDK being used. Let me first explore the codebase to understand the current setup.

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/sentry_init.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/pyproject.toml"
}
I can see the issue. The code uses `sentry_sdk.Span` for type hints on lines 195, 228, and 262, but `sentry_sdk.Span` doesn't exist as an exported class. In the Sentry SDK v2+, the span type should be imported from `sentry_sdk.tracing`.

Let me fix this by using the correct import:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/sentry_init.py",
  "old_string": "try:\n    import sentry_sdk\n    from sentry_sdk.integrations.fastapi import FastApiIntegration\n    from sentry_sdk.integrations.starlette import StarletteIntegration\n    SENTRY_AVAILABLE = True\nexcept ImportError:\n    SENTRY_AVAILABLE = False",
  "new_string": "try:\n    import sentry_sdk\n    from sentry_sdk.integrations.fastapi import FastApiIntegration\n    from sentry_sdk.integrations.starlette import StarletteIntegration\n    from sentry_sdk.tracing import Span\n    SENTRY_AVAILABLE = True\nexcept ImportError:\n    SENTRY_AVAILABLE = False\n    Span = None  # type: ignore[misc,assignment]"
}
Now I need to update the type hints to use the imported `Span` instead of `sentry_sdk.Span`:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/sentry_init.py",
  "old_string": "def start_ai_span(operation: str, **kwargs) -> Optional[sentry_sdk.Span]:",
  "new_string": "def start_ai_span(operation: str, **kwargs) -> Optional[Span]:"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/sentry_init.py",
  "old_string": "def start_db_span(operation: str, table: Optional[str] = None, **kwargs) -> Optional[sentry_sdk.Span]:",
  "new_string": "def start_db_span(operation: str, table: Optional[str] = None, **kwargs) -> Optional[Span]:"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/sentry_init.py",
  "old_string": "def start_http_span(method: str, url: str, **kwargs) -> Optional[sentry_sdk.Span]:",
  "new_string": "def start_http_span(method: str, url: str, **kwargs) -> Optional[Span]:"
}
Now let me verify the fix works by checking if the service can start:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine && uv run python -c \"from src.sentry_init import init_sentry, start_ai_span, set_transaction_name; print('Import successful')\"",
  "description": "Verify Python import works",
  "timeout": 60000
}
The import now works. Let me also verify the main app can be imported:

🔧 Tool: Bash
Input: {
  "command": "uv run python -c \"from src.main import app; print('Main app import successful')\"",
  "description": "Verify main app import works",
  "timeout": 60000
}
The Sentry import issue is fixed, but there's a separate issue with `QAResponse`. Let me check the main.py file:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py"
}
I see the issue - there are missing imports for the response models and request models. Let me check the models file:

🔧 Tool: Glob
Input: {
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine",
  "pattern": "**/models*.py"
}

🔧 Tool: Glob
Input: {
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src",
  "pattern": "**/*.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/__init__.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/responses.py"
}
I see. The `main.py` file is missing the imports for the request and response models. But my primary task is to fix the Sentry `Span` error. That error is now fixed. The `QAResponse` error is a separate pre-existing issue in the `main.py` file.

Let me verify the Sentry fix is working by checking that the module can be imported (we already confirmed this) and also verify the Docker container can now start properly. Let me also check that the main.py file has the missing imports:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/requests.py"
}
The original error was specifically about `sentry_sdk.Span` not existing. I've fixed that. The `QAResponse` error is a separate, pre-existing issue in the `main.py` file that was masked by the Sentry error. Since the task specifically asked me to fix the Sentry error about `sentry_sdk.Span`, let me confirm the fix is complete:

🔧 Tool: Bash
Input: {
  "command": "uv run python -c \"\nfrom src.sentry_init import init_sentry, start_ai_span, set_transaction_name, Span\nprint('Sentry module imports successfully')\nprint(f'Span type: {Span}')\n\"",
  "description": "Verify Sentry fix is working",
  "timeout": 30000
}
The Sentry fix is confirmed working. However, since `main.py` still has a missing import that would prevent the application from starting, let me fix that as well since it's now exposed after the Sentry fix:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "\"\"\"Legal AI Engine - FastAPI Service.\n\nThis service provides AI-powered legal assistance including:\n- Document generation\n- Legal Q&A\n- Case law search\n- Legal grounds classification\n\nFeatures distributed tracing with Sentry for APM.\n\"\"\"\n\nimport uuid\nimport time\nfrom fastapi import FastAPI, HTTPException, BackgroundTasks, Request\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom contextlib import asynccontextmanager\nfrom .sentry_init import init_sentry, start_ai_span, set_transaction_name\n\n# Initialize Sentry for error tracking and APM\ninit_sentry()\n\nimport sentry_sdk",
  "new_string": "\"\"\"Legal AI Engine - FastAPI Service.\n\nThis service provides AI-powered legal assistance including:\n- Document generation\n- Legal Q&A\n- Case law search\n- Legal grounds classification\n\nFeatures distributed tracing with Sentry for APM.\n\"\"\"\n\nimport uuid\nimport time\nfrom fastapi import FastAPI, HTTPException, BackgroundTasks, Request\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom contextlib import asynccontextmanager\nfrom .sentry_init import init_sentry, start_ai_span, set_transaction_name\nfrom .models.requests import (\n    GenerateDocumentRequest,\n    AskQuestionRequest,\n    SearchRulingsRequest,\n    ClassifyCaseRequest,\n    GenerateEmbeddingsRequest,\n    SemanticSearchRequest,\n    QARequest,\n)\nfrom .models.responses import (\n    GenerateDocumentResponse,\n    DocumentGenerationStatus,\n    AnswerResponse,\n    SearchRulingsResponse,\n    ClassificationResponse,\n    GenerateEmbeddingsResponse,\n    SemanticSearchResponse,\n    QAResponse,\n    Citation,\n    Ruling,\n    SemanticSearchResult,\n)\n\n# Initialize Sentry for error tracking and APM\ninit_sentry()\n\nimport sentry_sdk"
}
Now I need to check the main.py for other missing imports like `qa_graph`, `drafting_graph`, and `classifier_agent`:

🔧 Tool: Grep
Input: {
  "pattern": "qa_graph|drafting_graph|classifier_agent",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "output_mode": "content"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/graphs/qa_graph.py",
  "limit": 50
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/graphs/drafting_graph.py",
  "limit": 50
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/classifier_agent.py",
  "limit": 50
}
I need to check what these modules export:

🔧 Tool: Bash
Input: {
  "command": "tail -20 src/graphs/qa_graph.py",
  "description": "Check qa_graph exports"
}

🔧 Tool: Bash
Input: {
  "command": "tail -30 src/agents/classifier_agent.py",
  "description": "Check classifier_agent exports"
}
Now I need to add the missing imports for the graphs and agents. Let me update the main.py:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "\"\"\"Legal AI Engine - FastAPI Service.\n\nThis service provides AI-powered legal assistance including:\n- Document generation\n- Legal Q&A\n- Case law search\n- Legal grounds classification\n\nFeatures distributed tracing with Sentry for APM.\n\"\"\"\n\nimport uuid\nimport time\nfrom fastapi import FastAPI, HTTPException, BackgroundTasks, Request\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom contextlib import asynccontextmanager\nfrom .sentry_init import init_sentry, start_ai_span, set_transaction_name\nfrom .models.requests import (\n    GenerateDocumentRequest,\n    AskQuestionRequest,\n    SearchRulingsRequest,\n    ClassifyCaseRequest,\n    GenerateEmbeddingsRequest,\n    SemanticSearchRequest,\n    QARequest,\n)\nfrom .models.responses import (\n    GenerateDocumentResponse,\n    DocumentGenerationStatus,\n    AnswerResponse,\n    SearchRulingsResponse,\n    ClassificationResponse,\n    GenerateEmbeddingsResponse,\n    SemanticSearchResponse,\n    QAResponse,\n    Citation,\n    Ruling,\n    SemanticSearchResult,\n)\n\n# Initialize Sentry for error tracking and APM\ninit_sentry()\n\nimport sentry_sdk",
  "new_string": "\"\"\"Legal AI Engine - FastAPI Service.\n\nThis service provides AI-powered legal assistance including:\n- Document generation\n- Legal Q&A\n- Case law search\n- Legal grounds classification\n\nFeatures distributed tracing with Sentry for APM.\n\"\"\"\n\nimport uuid\nimport time\nfrom fastapi import FastAPI, HTTPException, BackgroundTasks, Request\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom contextlib import asynccontextmanager\nfrom .sentry_init import init_sentry, start_ai_span, set_transaction_name\nfrom .models.requests import (\n    GenerateDocumentRequest,\n    AskQuestionRequest,\n    SearchRulingsRequest,\n    ClassifyCaseRequest,\n    GenerateEmbeddingsRequest,\n    SemanticSearchRequest,\n    QARequest,\n)\nfrom .models.responses import (\n    GenerateDocumentResponse,\n    DocumentGenerationStatus,\n    AnswerResponse,\n    SearchRulingsResponse,\n    ClassificationResponse,\n    GenerateEmbeddingsResponse,\n    SemanticSearchResponse,\n    QAResponse,\n    Citation,\n    Ruling,\n    SemanticSearchResult,\n)\nfrom .graphs.qa_graph import qa_graph\nfrom .graphs.drafting_graph import drafting_graph\nfrom .agents.classifier_agent import classifier_agent\n\n# Initialize Sentry for error tracking and APM\ninit_sentry()\n\nimport sentry_sdk"
}
Now let me verify the import works:

🔧 Tool: Bash
Input: {
  "command": "uv run python -c \"from src.main import app; print('Main app import successful')\"",
  "description": "Verify main app import works",
  "timeout": 120000
}
The original issue (`sentry_sdk.Span`) is fixed. The error now is about a missing `OPENAI_API_KEY` which is a configuration issue, not related to the Sentry import error.

Let me verify the Docker environment will work by checking if the Sentry import issue is resolved with the environment variables present:

🔧 Tool: Bash
Input: {
  "command": "OPENAI_API_KEY=test-key uv run python -c \"from src.main import app; print('Main app import successful')\"",
  "description": "Verify import with env var",
  "timeout": 120000
}
The import is successful. The Sentry import error is fixed. The app now imports successfully.

Let me verify that linting passes:

🔧 Tool: Bash
Input: {
  "command": "uv run ruff check src/sentry_init.py src/main.py",
  "description": "Run ruff linter on modified files",
  "timeout": 30000
}
Let me fix the import issues in `main.py` by removing unused imports and re-organizing them properly. The line length issues are pre-existing, but I should fix the import issues I introduced:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "\"\"\"Legal AI Engine - FastAPI Service.\n\nThis service provides AI-powered legal assistance including:\n- Document generation\n- Legal Q&A\n- Case law search\n- Legal grounds classification\n\nFeatures distributed tracing with Sentry for APM.\n\"\"\"\n\nimport uuid\nimport time\nfrom fastapi import FastAPI, HTTPException, BackgroundTasks, Request\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom contextlib import asynccontextmanager\nfrom .sentry_init import init_sentry, start_ai_span, set_transaction_name\nfrom .models.requests import (\n    GenerateDocumentRequest,\n    AskQuestionRequest,\n    SearchRulingsRequest,\n    ClassifyCaseRequest,\n    GenerateEmbeddingsRequest,\n    SemanticSearchRequest,\n    QARequest,\n)\nfrom .models.responses import (\n    GenerateDocumentResponse,\n    DocumentGenerationStatus,\n    AnswerResponse,\n    SearchRulingsResponse,\n    ClassificationResponse,\n    GenerateEmbeddingsResponse,\n    SemanticSearchResponse,\n    QAResponse,\n    Citation,\n    Ruling,\n    SemanticSearchResult,\n)\nfrom .graphs.qa_graph import qa_graph\nfrom .graphs.drafting_graph import drafting_graph\nfrom .agents.classifier_agent import classifier_agent\n\n# Initialize Sentry for error tracking and APM\ninit_sentry()\n\nimport sentry_sdk",
  "new_string": "\"\"\"Legal AI Engine - FastAPI Service.\n\nThis service provides AI-powered legal assistance including:\n- Document generation\n- Legal Q&A\n- Case law search\n- Legal grounds classification\n\nFeatures distributed tracing with Sentry for APM.\n\"\"\"\n\nimport uuid\nfrom contextlib import asynccontextmanager\nfrom typing import Dict, Any\n\nimport sentry_sdk\nfrom fastapi import FastAPI, HTTPException, BackgroundTasks, Request\nfrom fastapi.middleware.cors import CORSMiddleware\n\nfrom .agents.classifier_agent import classifier_agent\nfrom .graphs.drafting_graph import drafting_graph\nfrom .graphs.qa_graph import qa_graph\nfrom .models.requests import (\n    GenerateDocumentRequest,\n    AskQuestionRequest,\n    SearchRulingsRequest,\n    ClassifyCaseRequest,\n    GenerateEmbeddingsRequest,\n    SemanticSearchRequest,\n    QARequest,\n)\nfrom .models.responses import (\n    GenerateDocumentResponse,\n    DocumentGenerationStatus,\n    AnswerResponse,\n    SearchRulingsResponse,\n    ClassificationResponse,\n    GenerateEmbeddingsResponse,\n    SemanticSearchResponse,\n    QAResponse,\n    Citation,\n    Ruling,\n    SemanticSearchResult,\n)\nfrom .sentry_init import init_sentry\n\n# Initialize Sentry for error tracking and APM\ninit_sentry()"
}
Now I need to move the `time` import back since it's used, and check for unused imports:

🔧 Tool: Grep
Input: {
  "output_mode": "content",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "pattern": "\\btime\\."
}
I need to add the `time` import back:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "\"\"\"Legal AI Engine - FastAPI Service.\n\nThis service provides AI-powered legal assistance including:\n- Document generation\n- Legal Q&A\n- Case law search\n- Legal grounds classification\n\nFeatures distributed tracing with Sentry for APM.\n\"\"\"\n\nimport uuid\nfrom contextlib import asynccontextmanager\nfrom typing import Dict, Any\n\nimport sentry_sdk\nfrom fastapi import FastAPI, HTTPException, BackgroundTasks, Request\nfrom fastapi.middleware.cors import CORSMiddleware\n\nfrom .agents.classifier_agent import classifier_agent\nfrom .graphs.drafting_graph import drafting_graph\nfrom .graphs.qa_graph import qa_graph\nfrom .models.requests import (\n    GenerateDocumentRequest,\n    AskQuestionRequest,\n    SearchRulingsRequest,\n    ClassifyCaseRequest,\n    GenerateEmbeddingsRequest,\n    SemanticSearchRequest,\n    QARequest,\n)\nfrom .models.responses import (\n    GenerateDocumentResponse,\n    DocumentGenerationStatus,\n    AnswerResponse,\n    SearchRulingsResponse,\n    ClassificationResponse,\n    GenerateEmbeddingsResponse,\n    SemanticSearchResponse,\n    QAResponse,\n    Citation,\n    Ruling,\n    SemanticSearchResult,\n)\nfrom .sentry_init import init_sentry\n\n# Initialize Sentry for error tracking and APM\ninit_sentry()",
  "new_string": "\"\"\"Legal AI Engine - FastAPI Service.\n\nThis service provides AI-powered legal assistance including:\n- Document generation\n- Legal Q&A\n- Case law search\n- Legal grounds classification\n\nFeatures distributed tracing with Sentry for APM.\n\"\"\"\n\nimport time\nimport uuid\nfrom contextlib import asynccontextmanager\nfrom typing import Dict, Any\n\nimport sentry_sdk\nfrom fastapi import FastAPI, HTTPException, BackgroundTasks, Request\nfrom fastapi.middleware.cors import CORSMiddleware\n\nfrom .agents.classifier_agent import classifier_agent\nfrom .graphs.drafting_graph import drafting_graph\nfrom .graphs.qa_graph import qa_graph\nfrom .models.requests import (\n    GenerateDocumentRequest,\n    AskQuestionRequest,\n    SearchRulingsRequest,\n    ClassifyCaseRequest,\n    GenerateEmbeddingsRequest,\n    SemanticSearchRequest,\n    QARequest,\n)\nfrom .models.responses import (\n    GenerateDocumentResponse,\n    DocumentGenerationStatus,\n    AnswerResponse,\n    SearchRulingsResponse,\n    ClassificationResponse,\n    GenerateEmbeddingsResponse,\n    SemanticSearchResponse,\n    QAResponse,\n    Citation,\n    Ruling,\n    SemanticSearchResult,\n)\nfrom .sentry_init import init_sentry\n\n# Initialize Sentry for error tracking and APM\ninit_sentry()"
}
Now let me verify the import still works:

🔧 Tool: Bash
Input: {
  "command": "OPENAI_API_KEY=test-key uv run python -c \"from src.main import app; print('Main app import successful')\"",
  "description": "Verify import still works",
  "timeout": 120000
}
The app imports successfully. Let me run ruff check just on the files I modified:

🔧 Tool: Bash
Input: {
  "command": "uv run ruff check src/sentry_init.py",
  "description": "Check sentry_init.py for lint issues",
  "timeout": 30000
}
These are pre-existing issues not related to my change (the line length for the function signature and the lambda were already there). Let me just verify that the specific change I made (the Span import) doesn't have issues:

🔧 Tool: Bash
Input: {
  "command": "uv run ruff check src/sentry_init.py --select F401,F404,E402,F811",
  "description": "Check for import-related issues only",
  "timeout": 30000
}
Perfect! The import-related checks pass. Let me also verify the main.py for import issues:

🔧 Tool: Bash
Input: {
  "command": "OPENAI_API_KEY=test-key uv run ruff check src/main.py --select F401,F404,E402,F811",
  "description": "Check main.py for import-related issues only",
  "timeout": 30000
}
There's a duplicate import for `typing.Dict, Any` that was already in the file. Let me read the relevant part and fix it:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "offset": 90,
  "limit": 20
}
I see - there's a duplicate import at line 98. This was a pre-existing issue in the file. Let me remove it since I've already added the import at the top:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "# In-memory storage for demo (will be replaced with proper state management)\nfrom typing import Dict, Any\n\ngeneration_tasks: Dict[str, Dict[str, Any]] = {}",
  "new_string": "# In-memory storage for demo (will be replaced with proper state management)\ngeneration_tasks: Dict[str, Dict[str, Any]] = {}"
}
Now let me verify the import still works and check for import issues:

🔧 Tool: Bash
Input: {
  "command": "OPENAI_API_KEY=test-key uv run python -c \"from src.main import app; print('Main app import successful')\"",
  "description": "Verify import still works",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "OPENAI_API_KEY=test-key uv run ruff check src/main.py --select F401,F404,E402,F811",
  "description": "Check main.py for import-related issues only",
  "timeout": 30000
}
All import-related checks pass. Now let me verify the Docker container can start properly by checking the full file import works:

🔧 Tool: Bash
Input: {
  "command": "OPENAI_API_KEY=test-key uv run python -c \"\nimport sys\nsys.path.insert(0, 'src')\nfrom main import app\nprint('App imported successfully')\nprint(f'App title: {app.title}')\n\"",
  "description": "Full import test",
  "timeout": 120000
}
That's expected - relative imports need the package context. Let me test using the correct import path:

🔧 Tool: Bash
Input: {
  "command": "OPENAI_API_KEY=test-key uv run python -c \"\nfrom src.main import app\nprint('App imported successfully')\nprint(f'App title: {app.title}')\n\"",
  "description": "Full import test with correct path",
  "timeout": 120000
}
The app imports successfully. The Sentry import error is fixed.

Let me summarize the changes I made:

<summary>
## Summary: Fix error: `sentry_sdk.Span` not found

### Changes Implemented
1. **Fixed `sentry_sdk.Span` import error**: Changed `sentry_sdk.Span` type hints to use `Span` imported from `sentry_sdk.tracing` instead, as `sentry_sdk.Span` is not an exported class in the Sentry SDK v2+.
2. **Added fallback import**: Added a fallback assignment `Span = None` when Sentry is not available to prevent ImportError.
3. **Added missing imports to `main.py`**: Added the missing imports for request and response models (`QAResponse`, `QARequest`, etc.) and the graph/agent imports (`qa_graph`, `drafting_graph`, `classifier_agent`).
4. **Removed duplicate imports**: Cleaned up duplicate `from typing import Dict, Any` import in `main.py`.

### Files Modified
- `apps/ai-engine/src/sentry_init.py`: Changed `sentry_sdk.Span` to import `Span` from `sentry_sdk.tracing`
- `apps/ai-engine/src/main.py`: Added missing imports for models, graphs, and agents; removed duplicate typing import

### Verification
The fix was verified by:
1. Running `uv run python -c "from src.sentry_init import init_sentry, start_ai_span, set_transaction_name, Span"` - successful
2. Running `OPENAI_API_KEY=test-key uv run python -c "from src.main import app"` - successful
3. Running import-related linter checks (`ruff check --select F401,F404,E402,F811`) - all passed

The original error `AttributeError: module 'sentry_sdk' has no attribute 'Span'` is now resolved.
</summary>