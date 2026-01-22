I'll analyze the error and fix the login form issue. Let me start by examining the LoggingInterceptor that's causing the problem.

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/logger/logger.interceptor.ts"
}
The error shows that `request` is `undefined` when calling `context.switchToHttp().getRequest()`. This could happen in GraphQL context or when the request object isn't available. Let me check how this interceptor is being used and understand the context better.

🔧 Tool: Grep
Input: {
  "pattern": "LoggingInterceptor",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/app.module.ts",
  "offset": 165,
  "limit": 30
}
Let me also check the AuditLoggingInterceptor to see how it handles the request:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/interceptors/audit-logging.interceptor.ts"
}
Now I understand the issue. The `LoggingInterceptor` is not handling the case where the request might be undefined (similar to how `AuditLoggingInterceptor` handles it). The error happens because:

1. `context.switchToHttp().getRequest()` can return `undefined` in certain contexts (like GraphQL requests where the request structure differs)
2. The code tries to destructure `method`, `url`, `ip` from an undefined request

Let me fix the `LoggingInterceptor` to handle cases where the request is not available:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix LoggingInterceptor to handle undefined request",
      "status": "in_progress",
      "activeForm": "Fixing LoggingInterceptor to handle undefined request"
    },
    {
      "content": "Test the fix with Playwright verification",
      "status": "pending",
      "activeForm": "Testing the fix with Playwright verification"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/logger/logger.interceptor.ts",
  "old_string": "  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {\n    const request = context.switchToHttp().getRequest();\n    const { method, url, ip } = request;\n    const userAgent = request.get('user-agent') || '';\n    const correlationId = request.correlationId || 'N/A';\n\n    this.logger.log(\n      `[${correlationId}] ${method} ${url} - ${ip} - ${userAgent}`,\n    );\n\n    const now = Date.now();\n\n    return next.handle().pipe(\n      tap({\n        next: () => {\n          const response = context.switchToHttp().getResponse();\n          const statusCode = response.statusCode;\n          const responseTime = Date.now() - now;\n\n          this.logger.log(\n            `[${correlationId}] ${method} ${url} - ${statusCode} - ${responseTime}ms`,\n          );\n        },\n        error: (error) => {\n          const responseTime = Date.now() - now;\n          this.logger.error(\n            `[${correlationId}] ${method} ${url} - Error: ${error.message} - ${responseTime}ms`,\n          );\n        },\n      }),\n    );\n  }",
  "new_string": "  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {\n    const request = context.switchToHttp().getRequest();\n\n    // Handle cases where request is not available (e.g., GraphQL, subscriptions, etc.)\n    if (!request) {\n      return next.handle();\n    }\n\n    const { method, url, ip } = request;\n    const userAgent = request.get?.('user-agent') || '';\n    const correlationId = request.correlationId || 'N/A';\n\n    this.logger.log(\n      `[${correlationId}] ${method} ${url} - ${ip} - ${userAgent}`,\n    );\n\n    const now = Date.now();\n\n    return next.handle().pipe(\n      tap({\n        next: () => {\n          const response = context.switchToHttp().getResponse();\n          const statusCode = response.statusCode;\n          const responseTime = Date.now() - now;\n\n          this.logger.log(\n            `[${correlationId}] ${method} ${url} - ${statusCode} - ${responseTime}ms`,\n          );\n        },\n        error: (error) => {\n          const responseTime = Date.now() - now;\n          this.logger.error(\n            `[${correlationId}] ${method} ${url} - Error: ${error.message} - ${responseTime}ms`,\n          );\n        },\n      }),\n    );\n  }"
}
Now let me update the todo and verify the fix works:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Fixing LoggingInterceptor to handle undefined request",
      "content": "Fix LoggingInterceptor to handle undefined request",
      "status": "completed"
    },
    {
      "activeForm": "Testing the fix with Playwright verification",
      "content": "Test the fix with Playwright verification",
      "status": "in_progress"
    }
  ]
}
Let me check if there are any existing E2E tests for login:

🔧 Tool: Glob
Input: {
  "pattern": "**/*login*.spec.ts",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend"
}

🔧 Tool: Glob
Input: {
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend",
  "pattern": "**/tests/**/*.spec.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/tests/playwright/graphql-auth.spec.ts"
}
There's already a Playwright test for authentication. Let me run the backend and execute the test to verify the fix:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/backend && npx playwright test graphql-auth.spec.ts 2>&1",
  "description": "Run Playwright auth test to verify login fix",
  "timeout": 120000
}
