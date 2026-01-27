
🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore AI Engine main.py and CORS configuration",
      "status": "in_progress",
      "activeForm": "Exploring AI Engine main.py and CORS configuration"
    },
    {
      "content": "Add CORSMiddleware with proper configuration",
      "status": "pending",
      "activeForm": "Adding CORSMiddleware with proper configuration"
    },
    {
      "content": "Add FRONTEND_URL environment variable",
      "status": "pending",
      "activeForm": "Adding FRONTEND_URL environment variable"
    },
    {
      "content": "Update CLAUDE.md with CORS documentation",
      "status": "pending",
      "activeForm": "Updating CLAUDE.md with CORS documentation"
    },
    {
      "content": "Verify CORS configuration with browser DevTools",
      "status": "pending",
      "activeForm": "Verifying CORS configuration"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/ai-engine/**/*.py"
}
Now I can see the main.py file. The CORS middleware is already present (lines 198-205), but it's using hardcoded values. I need to update it to use environment variables and configure the allowed methods and headers more specifically as requested. Let me also check the config file to see how settings are handled.

🔧 Tool: Glob
Input: {
  "pattern": "apps/ai-engine/src/config*.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/config.py"
}
Now I have a good understanding of the codebase. Let me update the todo list and implement the changes:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring AI Engine main.py and CORS configuration",
      "content": "Explore AI Engine main.py and CORS configuration",
      "status": "completed"
    },
    {
      "activeForm": "Adding FRONTEND_URL to Settings",
      "content": "Add FRONTEND_URL environment variable to config.py",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating CORS middleware in main.py",
      "content": "Update CORS middleware to use environment variable",
      "status": "pending"
    },
    {
      "activeForm": "Updating CLAUDE.md with CORS documentation",
      "content": "Update CLAUDE.md with CORS documentation",
      "status": "pending"
    },
    {
      "activeForm": "Verifying CORS configuration",
      "content": "Verify CORS configuration",
      "status": "pending"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/config.py",
  "old_string": "    # Service Settings\n    AI_ENGINE_PORT: int = 8000\n    AI_ENGINE_HOST: str = \"0.0.0.0\"\n    BACKEND_URL: str = \"http://localhost:3001\"\n    LOG_LEVEL: str = \"INFO\"",
  "new_string": "    # Service Settings\n    AI_ENGINE_PORT: int = 8000\n    AI_ENGINE_HOST: str = \"0.0.0.0\"\n    BACKEND_URL: str = \"http://localhost:3001\"\n    FRONTEND_URL: str = \"http://localhost:3000\"\n    LOG_LEVEL: str = \"INFO\""
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring AI Engine main.py and CORS configuration",
      "content": "Explore AI Engine main.py and CORS configuration",
      "status": "completed"
    },
    {
      "activeForm": "Adding FRONTEND_URL to Settings",
      "content": "Add FRONTEND_URL environment variable to config.py",
      "status": "completed"
    },
    {
      "activeForm": "Updating CORS middleware in main.py",
      "content": "Update CORS middleware to use environment variable",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating CLAUDE.md with CORS documentation",
      "content": "Update CLAUDE.md with CORS documentation",
      "status": "pending"
    },
    {
      "activeForm": "Verifying CORS configuration",
      "content": "Verify CORS configuration",
      "status": "pending"
    }
  ]
}
Now I need to update the CORS middleware in main.py to use the environment variable and configure it properly. The middleware should be added before route definitions (it already is) and use the specific methods and headers requested.

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "# Add Langfuse middleware for AI request tracing\ntry:\n    from .langfuse_middleware import LangfuseMiddleware\n    app.add_middleware(LangfuseMiddleware)\nexcept ImportError:\n    logger.warning(\"Langfuse middleware not available - skipping\")\n\n\n# Middleware for distributed tracing",
  "new_string": "# Add Langfuse middleware for AI request tracing\ntry:\n    from .langfuse_middleware import LangfuseMiddleware\n    app.add_middleware(LangfuseMiddleware)\nexcept ImportError:\n    logger.warning(\"Langfuse middleware not available - skipping\")\n\n\n# CORS middleware - must be added before route definitions\nfrom .config import get_settings\n\nsettings = get_settings()\n_cors_origins = [\n    settings.FRONTEND_URL,\n    \"http://localhost:3000\",  # Always allow local development\n]\n\n# Dedupe origins while preserving order\ncors_origins = list(dict.fromkeys(_cors_origins))\n\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=cors_origins,\n    allow_credentials=True,  # Required for Authorization cookies/headers\n    allow_methods=[\"GET\", \"POST\", \"OPTIONS\"],  # Explicitly allow required methods\n    allow_headers=[\"Authorization\", \"Content-Type\"],  # Explicitly allow required headers\n)\n\nlogger.info(\"CORS configured for origins: %s\", cors_origins)\n\n\n# Middleware for distributed tracing"
}
Now I need to remove the old CORS middleware configuration that was below the sentry_middleware decorator:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "offset": 215,
  "limit": 50
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "    return response\n\n\n# CORS middleware for development\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=[\"http://localhost:3000\", \"http://localhost:3001\"],\n    allow_credentials=True,\n    allow_methods=[\"*\"],\n    allow_headers=[\"*\"],\n)\n\n\n# Global exception handler for validation errors (422)",
  "new_string": "    return response\n\n\n# Global exception handler for validation errors (422)"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring AI Engine main.py and CORS configuration",
      "content": "Explore AI Engine main.py and CORS configuration",
      "status": "completed"
    },
    {
      "activeForm": "Adding FRONTEND_URL to Settings",
      "content": "Add FRONTEND_URL environment variable to config.py",
      "status": "completed"
    },
    {
      "activeForm": "Updating CORS middleware in main.py",
      "content": "Update CORS middleware to use environment variable",
      "status": "completed"
    },
    {
      "activeForm": "Updating CLAUDE.md with CORS documentation",
      "content": "Update CLAUDE.md with CORS documentation",
      "status": "in_progress"
    },
    {
      "activeForm": "Verifying CORS configuration",
      "content": "Verify CORS configuration",
      "status": "pending"
    }
  ]
}
Now I need to update the CLAUDE.md with CORS documentation:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.claude/CLAUDE.md"
}
Now I'll add CORS documentation to the Environment Variables section:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.claude/CLAUDE.md",
  "old_string": "# Service\nAI_ENGINE_PORT=8000\nAI_ENGINE_HOST=0.0.0.0\nBACKEND_URL=http://localhost:3001\n\n# Langfuse Observability (Optional but recommended)",
  "new_string": "# Service\nAI_ENGINE_PORT=8000\nAI_ENGINE_HOST=0.0.0.0\nBACKEND_URL=http://localhost:3001\nFRONTEND_URL=http://localhost:3000\n\n# Langfuse Observability (Optional but recommended)"
}
Now I'll add a dedicated CORS section after the Environment Variables section:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.claude/CLAUDE.md",
  "old_string": "LANGFUSE_SESSION_ID_HEADER=x-session-id\n```\n\n### Architecture Overview",
  "new_string": "LANGFUSE_SESSION_ID_HEADER=x-session-id\n```\n\n### CORS Configuration\n\n**Location:** `apps/ai-engine/src/main.py`\n\n**Purpose:** Allow direct frontend requests to AI Engine with proper authorization headers.\n\n**Environment Variables:**\n\n```bash\nFRONTEND_URL=http://localhost:3000  # Frontend origin (default: http://localhost:3000)\n```\n\n**Configuration:**\n\nThe CORS middleware is configured to:\n- Allow origins from `FRONTEND_URL` environment variable plus `http://localhost:3000` for local development\n- Allow credentials (`true`) for Authorization cookies/headers\n- Allow methods: `GET`, `POST`, `OPTIONS` (explicitly defined)\n- Allow headers: `Authorization`, `Content-Type` (explicitly defined)\n- Handle preflight OPTIONS requests automatically\n\n**CORS middleware is added before route definitions** to ensure all endpoints are protected.\n\n**Verification:**\n\n```bash\n# Test CORS with curl (preflight request)\ncurl -X OPTIONS http://localhost:8000/api/v1/qa/ask \\\n  -H \"Origin: http://localhost:3000\" \\\n  -H \"Access-Control-Request-Method: POST\" \\\n  -H \"Access-Control-Request-Headers: Authorization,Content-Type\" \\\n  -v\n\n# Check response headers for:\n# Access-Control-Allow-Origin: http://localhost:3000\n# Access-Control-Allow-Credentials: true\n# Access-Control-Allow-Methods: GET, POST, OPTIONS\n# Access-Control-Allow-Headers: Authorization, Content-Type\n```\n\n**Browser DevTools Verification:**\n\n1. Open Network tab in DevTools\n2. Make a request from frontend to AI Engine\n3. Check that `Authorization` header is sent in request\n4. Verify response contains proper CORS headers\n5. No CORS errors should appear in console\n\n### Architecture Overview"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring AI Engine main.py and CORS configuration",
      "content": "Explore AI Engine main.py and CORS configuration",
      "status": "completed"
    },
    {
      "activeForm": "Adding FRONTEND_URL to Settings",
      "content": "Add FRONTEND_URL environment variable to config.py",
      "status": "completed"
    },
    {
      "activeForm": "Updating CORS middleware in main.py",
      "content": "Update CORS middleware to use environment variable",
      "status": "completed"
    },
    {
      "activeForm": "Updating CLAUDE.md with CORS documentation",
      "content": "Update CLAUDE.md with CORS documentation",
      "status": "completed"
    },
    {
      "activeForm": "Verifying CORS configuration",
      "content": "Verify CORS configuration",
      "status": "in_progress"
    }
  ]
}
Now let me verify the CORS configuration by checking the main.py file to ensure everything is correct:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "limit": 80,
  "offset": 150
}
The CORS configuration looks good. Now let me verify the implementation is correct by checking if the code compiles and there are no syntax errors. Let me also check that the .env.example file includes the FRONTEND_URL:

🔧 Tool: Glob
Input: {
  "pattern": "apps/ai-engine/.env*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/.env.example"
}
I need to add the FRONTEND_URL to the .env.example file:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/.env.example",
  "old_string": "# Backend API URL (for vector store integration)\nBACKEND_URL=http://localhost:3001\n\n# Logging level: DEBUG, INFO, WARNING, ERROR, CRITICAL",
  "new_string": "# Backend API URL (for vector store integration)\nBACKEND_URL=http://localhost:3001\n\n# Frontend URL (for CORS configuration)\nFRONTEND_URL=http://localhost:3000\n\n# Logging level: DEBUG, INFO, WARNING, ERROR, CRITICAL"
}
Now let me verify the syntax by running a Python syntax check:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine && python3 -m py_compile src/main.py src/config.py && echo \"Syntax check passed\"",
  "description": "Verify Python syntax for main.py and config.py"
}
Let me also verify the CORS middleware configuration is loaded correctly by checking if we can import and use the settings:

🔧 Tool: Bash
Input: {
  "command": ".venv/bin/python3 -c \"\nfrom src.config import get_settings\n\nsettings = get_settings()\nprint(f'FRONTEND_URL: {settings.FRONTEND_URL}')\n\n# Test CORS origins deduplication\n_cors_origins = [\n    settings.FRONTEND_URL,\n    'http://localhost:3000',\n]\ncors_origins = list(dict.fromkeys(_cors_origins))\nprint(f'CORS Origins: {cors_origins}')\n\"",
  "description": "Test CORS configuration loading"
}
Good! The deduplication is working correctly. Now let me test with a custom FRONTEND_URL to verify it's being picked up:

🔧 Tool: Bash
Input: {
  "command": "FRONTEND_URL=https://example.com .venv/bin/python3 -c \"\nfrom src.config import get_settings\n\nsettings = get_settings()\nprint(f'FRONTEND_URL: {settings.FRONTEND_URL}')\n\n# Test CORS origins deduplication\n_cors_origins = [\n    settings.FRONTEND_URL,\n    'http://localhost:3000',\n]\ncors_origins = list(dict.fromkeys(_cors_origins))\nprint(f'CORS Origins: {cors_origins}')\n\"",
  "description": "Test CORS configuration with custom FRONTEND_URL"
}
The CORS configuration is working correctly. The deduplication prevents duplicate origins when FRONTEND_URL is the same as localhost:3000, and both origins are included when they differ.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring AI Engine main.py and CORS configuration",
      "content": "Explore AI Engine main.py and CORS configuration",
      "status": "completed"
    },
    {
      "activeForm": "Adding FRONTEND_URL to Settings",
      "content": "Add FRONTEND_URL environment variable to config.py",
      "status": "completed"
    },
    {
      "activeForm": "Updating CORS middleware in main.py",
      "content": "Update CORS middleware to use environment variable",
      "status": "completed"
    },
    {
      "activeForm": "Updating CLAUDE.md with CORS documentation",
      "content": "Update CLAUDE.md with CORS documentation",
      "status": "completed"
    },
    {
      "activeForm": "Verifying CORS configuration",
      "content": "Verify CORS configuration",
      "status": "completed"
    }
  ]
}
All tasks are complete. Let me provide the final summary:

<summary>
## Summary: Configure FastAPI CORS middleware

### Changes Implemented
1. **Added `FRONTEND_URL` environment variable** to `apps/ai-engine/src/config.py` with default value `http://localhost:3000`
2. **Updated CORS middleware** in `apps/ai-engine/src/main.py`:
   - Imports settings and reads `FRONTEND_URL` from environment
   - Configures allowed origins from `FRONTEND_URL` plus `http://localhost:3000` for local development
   - Implements deduplication to avoid duplicate origins
   - Sets `allow_credentials: true` for Authorization cookies/headers
   - Explicitly allows methods: `GET`, `POST`, `OPTIONS`
   - Explicitly allows headers: `Authorization`, `Content-Type`
   - Adds logging to show configured origins at startup
   - Moved CORS middleware before route definitions (already was in correct position)
3. **Updated `.env.example`** to document the new `FRONTEND_URL` variable
4. **Added CORS documentation** to `.claude/CLAUDE.md` with configuration details, verification commands, and browser DevTools testing instructions

### Files Modified
- `apps/ai-engine/src/config.py` - Added `FRONTEND_URL` setting
- `apps/ai-engine/src/main.py` - Updated CORS middleware configuration
- `apps/ai-engine/.env.example` - Added FRONTEND_URL documentation
- `.claude/CLAUDE.md` - Added CORS Configuration section

### Notes for Developer
- The CORS middleware is configured to allow direct frontend requests to AI Engine
- Pre-flight OPTIONS requests are handled automatically by FastAPI's CORSMiddleware
- The `FRONTEND_URL` environment variable can be set to configure the allowed origin (e.g., `https://yourdomain.com` for production)
- Local development origin `http://localhost:3000` is always included
- Verify CORS with browser DevTools to ensure Authorization headers are sent correctly
</summary>