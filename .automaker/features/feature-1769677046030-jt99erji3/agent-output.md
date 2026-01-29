Looking at the error, the issue is clear: in `/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/requests.py`, the class `AskQuestionRequest` references `ClarificationAnswer` on line 129, but `ClarificationAnswer` is defined later in the file (or not at all in this file).

Let me examine the file to understand the issue:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/requests.py"
}
I see the issue. `ClarificationAnswer` is defined on line 214, but it's referenced in `AskQuestionRequest` on line 129 (before it's defined). This is a Python forward reference issue.

The fix is to move `ClarificationAnswer` class definition before `AskQuestionRequest`, or use a string annotation for forward reference. Let me fix this:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/requests.py",
  "old_string": "class MessageType(str, Enum):\n    \"\"\"Types of messages that can be sent to the ask-stream endpoint.\"\"\"\n\n    QUESTION = \"QUESTION\"  # Standard user question\n    CLARIFICATION_ANSWER = \"CLARIFICATION_ANSWER\"  # User's answers to clarification questions\n\n\nclass ResponseType(str, Enum):\n    \"\"\"Types of responses in SSE events.\n\n    Indicates the type of content being streamed back to the client.\n    This is included in the metadata of all SSE events.\n    \"\"\"\n\n    TEXT = \"TEXT\"  # Normal text response\n    CLARIFICATION_QUESTION = \"CLARIFICATION_QUESTION\"  # Response contains clarification questions\n\n\nclass AskQuestionRequest(BaseModel):",
  "new_string": "class MessageType(str, Enum):\n    \"\"\"Types of messages that can be sent to the ask-stream endpoint.\"\"\"\n\n    QUESTION = \"QUESTION\"  # Standard user question\n    CLARIFICATION_ANSWER = \"CLARIFICATION_ANSWER\"  # User's answers to clarification questions\n\n\nclass ResponseType(str, Enum):\n    \"\"\"Types of responses in SSE events.\n\n    Indicates the type of content being streamed back to the client.\n    This is included in the metadata of all SSE events.\n    \"\"\"\n\n    TEXT = \"TEXT\"  # Normal text response\n    CLARIFICATION_QUESTION = \"CLARIFICATION_QUESTION\"  # Response contains clarification questions\n\n\nclass ClarificationAnswer(BaseModel):\n    \"\"\"A single clarification answer from the user.\n\n    Leaf type - must be declared before composite types.\n    \"\"\"\n\n    question: str = Field(..., description=\"The question that was asked\")\n    question_type: str = Field(..., description=\"Type of question (e.g., timeline, parties)\")\n    answer: str = Field(..., description=\"The user's answer to the question\")\n\n\nclass AskQuestionRequest(BaseModel):"
}
Now I need to remove the duplicate `ClarificationAnswer` class definition at the bottom of the file:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/requests.py",
  "old_string": "class ClarificationAnswer(BaseModel):\n    \"\"\"A single clarification answer from the user.\"\"\"\n\n    question: str = Field(..., description=\"The question that was asked\")\n    question_type: str = Field(..., description=\"Type of question (e.g., timeline, parties)\")\n    answer: str = Field(..., description=\"The user's answer to the question\")\n\n\nclass ClarificationAnswerRequest(BaseModel):",
  "new_string": "class ClarificationAnswerRequest(BaseModel):"
}
Now I need to check the `__init__.py` file to make sure `ClarificationAnswer` is exported correctly:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/__init__.py"
}
The `__init__.py` is correctly exporting `ClarificationAnswer`. Now let me verify the fix works by testing if the module can be imported:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine && uv run python -c \"from src.models.requests import AskQuestionRequest, ClarificationAnswer; print('Import successful')\"",
  "description": "Test Python imports after fix"
}
Now let me run mypy type checking to ensure there are no type errors:

🔧 Tool: Bash
Input: {
  "command": "uv run mypy src/models/requests.py 2>&1 | head -50",
  "description": "Run mypy type check on requests.py"
}
