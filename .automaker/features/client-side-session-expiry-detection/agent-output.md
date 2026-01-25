
🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing auth structure and Apollo setup",
      "status": "in_progress",
      "activeForm": "Exploring existing auth structure and Apollo setup"
    },
    {
      "content": "Create Apollo GraphQL link for 401/403 interception",
      "status": "pending",
      "activeForm": "Creating Apollo GraphQL link for 401/403 interception"
    },
    {
      "content": "Implement client-side authProvider logout method",
      "status": "pending",
      "activeForm": "Implementing client-side authProvider logout method"
    },
    {
      "content": "Create useAuth hook for auth state management",
      "status": "pending",
      "activeForm": "Creating useAuth hook for auth state management"
    },
    {
      "content": "Add automatic redirect to /login on 401/403",
      "status": "pending",
      "activeForm": "Adding automatic redirect to /login on 401/403"
    },
    {
      "content": "Implement user-friendly toast notification",
      "status": "pending",
      "activeForm": "Implementing user-friendly toast notification"
    },
    {
      "content": "Create Playwright test to verify functionality",
      "status": "pending",
      "activeForm": "Creating Playwright test to verify functionality"
    }
  ]
}

🔧 Tool: Task
Input: {
  "description": "Explore auth and Apollo setup",
  "prompt": "Explore the codebase to understand the existing authentication and Apollo GraphQL setup. I need to find:\n\n1. Where Apollo Client is configured (look for ApolloProvider, ApolloClient, HttpLink, etc.)\n2. The authProvider implementation (refine.dev auth provider)\n3. How JWT tokens are stored and managed (localStorage, cookies, etc.)\n4. The current login/logout flow\n5. Any existing error handling or interceptors for GraphQL requests\n\nFocus on:\n- `apps/web/src/` directory\n- Look for files related to auth, apollo, graphql, data-provider\n- Check the refine.dev configuration\n\nReturn a summary of:\n1. Apollo Client configuration file location and current setup\n2. authProvider implementation location and current methods\n3. Token storage mechanism\n4. Any existing error handling for unauthorized responses\n5. Key files that need to be modified",
  "subagent_type": "Explore"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/**/*apollo*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/**/*graphql*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/**/*auth*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/**/*data-provider*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/**/*provider*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/auth-provider/auth-provider.client.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/lib/graphql-errors.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/lib/auth-errors.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/**/*app*.{tsx,ts}"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/**/layout.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/layout.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/_refine_context.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/**/data-provider*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/**/*provider*"
}

🔧 Tool: Bash
Input: {
  "command": "find apps/web/src -name \"*.ts\" -o -name \"*.tsx\" | grep -E \"(provider|data)\" | head -20",
  "description": "Find provider or data related files in web app"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/data-provider/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/session-interceptor-provider/index.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/lib/http-interceptor.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/csrf-provider.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/lib/csrf.ts"
}
The exploration reveals that this app **does not use Apollo Client** - it uses a custom GraphQL data provider with raw fetch calls. Let me examine the existing error handling and session expiry logic more closely.

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/lib/http-interceptor.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/session-interceptor-provider/index.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/data-provider/index.ts"
}
Now I have a good understanding of the existing setup. Let me check how the app structure works to understand where to place the auth context/hook:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/_refine_context.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/auth-provider/auth-provider.client.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/hooks/**/*.ts*"
}
Now I have a clear picture. The app already has:
1. A custom GraphQL data provider (not Apollo)
2. Session interceptor handling for 401/403 responses
3. Toast notifications for session expiry
4. The `SessionInterceptorProvider` that connects logout and redirect

However, looking at the code, I see the issue. The session expiry handling in `data-provider/index.ts` triggers `sessionExpiryHandler()` on 401/403, but:
1. The http-interceptor also has similar logic
2. There might be a conflict or the toast might not be showing correctly

Let me check the toast hook and understand the full flow:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/hooks/use-toast.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "useLogout|logout\\(\\)",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src",
  "output_mode": "files_with_matches"
}
Let me check the layout and Toaster component to understand how toasts are rendered:

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/components/**/toaster*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/app/**/layout.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/ui/toaster.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/layout.tsx"
}
Now I understand the full picture. The issue is that the toast is called from within `http-interceptor.ts`, which runs outside the React component tree. The toast function relies on React state and context, so calling it from a non-React context may not work reliably.

Let me update the todo list and implement the solution:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing auth structure and Apollo setup",
      "content": "Explore existing auth structure and Apollo setup",
      "status": "completed"
    },
    {
      "activeForm": "Creating auth context and useAuth hook",
      "content": "Create auth context and useAuth hook for React component access",
      "status": "in_progress"
    },
    {
      "activeForm": "Fixing session expiry toast notification",
      "content": "Fix session expiry toast notification to work in React context",
      "status": "pending"
    },
    {
      "activeForm": "Ensuring redirect works on SPA navigation",
      "content": "Ensure redirect works on SPA navigation, not just page reload",
      "status": "pending"
    },
    {
      "activeForm": "Creating Playwright test to verify functionality",
      "content": "Create Playwright test to verify functionality",
      "status": "pending"
    }
  ]
}
Now let me create the auth context and useAuth hook. The key insight is that we need to:

1. Create an AuthContext that provides session expiry handling within React
2. Update the SessionInterceptorProvider to use the toast from React context
3. Ensure the redirect works properly

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/contexts/auth-context.tsx",
  "content": "'use client';\n\nimport {\n  createContext,\n  useCallback,\n  useContext,\n  useEffect,\n  type ReactNode,\n} from 'react';\nimport { useRouter } from 'next/navigation';\nimport { useLogout } from '@refinedev/core';\nimport { toast } from '@/hooks/use-toast';\nimport {\n  resetSessionExpiryFlag,\n  type InterceptorOptions,\n} from '@/lib/http-interceptor';\n\n/**\n * Session expiry handler options\n */\ninterface SessionExpiryOptions extends InterceptorOptions {\n  /**\n   * Whether to show a toast notification\n   * @default true\n   */\n  showNotification?: boolean;\n  /**\n   * Custom notification message\n   * @default 'Your session has expired. Please log in again.'\n   */\n  notificationMessage?: string;\n}\n\n/**\n * Auth context interface\n */\ninterface AuthContextValue {\n  /**\n   * Handle session expiry with toast notification and logout\n   */\n  handleSessionExpiry: (options?: SessionExpiryOptions) => void;\n  /**\n   * Reset the session expiry handling flag (call after successful login)\n   */\n  resetSessionFlag: () => void;\n}\n\nconst AuthContext = createContext<AuthContextValue | undefined>(undefined);\n\n/**\n * Auth Provider options\n */\ninterface AuthProviderProps {\n  children: ReactNode;\n}\n\n/**\n * Default options for session expiry handling\n */\nconst DEFAULT_OPTIONS: SessionExpiryOptions = {\n  showNotification: true,\n  notificationMessage: 'Your session has expired. Please log in again.',\n};\n\n/**\n * Flag to prevent multiple simultaneous session expiry handlers\n */\nlet isHandlingSessionExpiry = false;\n\n/**\n * Auth Provider Component\n *\n * Provides session expiry handling that works within the React context.\n * This ensures that toast notifications and redirects work correctly\n * during SPA navigation, not just on full page reload.\n *\n * Place this provider inside the Refine provider to have access to logout.\n */\nexport function AuthProvider({ children }: AuthProviderProps) {\n  const router = useRouter();\n  const { mutate: logout } = useLogout();\n\n  const handleSessionExpiry = useCallback(\n    (options: SessionExpiryOptions = {}) => {\n      // Prevent multiple simultaneous handling\n      if (isHandlingSessionExpiry) {\n        return;\n      }\n\n      isHandlingSessionExpiry = true;\n\n      const opts = { ...DEFAULT_OPTIONS, ...options };\n\n      // Show toast notification (within React context)\n      if (opts.showNotification) {\n        toast({\n          variant: 'destructive',\n          title: 'Session Expired',\n          description: opts.notificationMessage || DEFAULT_OPTIONS.notificationMessage!,\n        });\n      }\n\n      // Small delay to ensure toast is visible before redirect\n      setTimeout(() => {\n        // Perform logout using Refine's logout\n        logout();\n\n        // Redirect to login\n        router.push('/login');\n\n        // Reset flag after a short delay (for next login)\n        setTimeout(() => {\n          isHandlingSessionExpiry = false;\n        }, 1000);\n      }, 100);\n    },\n    [logout, router],\n  );\n\n  const resetSessionFlag = useCallback(() => {\n    resetSessionExpiryFlag();\n    isHandlingSessionExpiry = false;\n  }, []);\n\n  return (\n    <AuthContext.Provider\n      value={{\n        handleSessionExpiry,\n        resetSessionFlag,\n      }}\n    >\n      {children}\n    </AuthContext.Provider>\n  );\n}\n\n/**\n * Hook to access auth context\n *\n * Provides session expiry handling that works in React context.\n *\n * @example\n * ```tsx\n * const { handleSessionExpiry, resetSessionFlag } = useAuthContext();\n *\n * // Call when 401/403 is detected\n * handleSessionExpiry();\n *\n * // Call after successful login to reset state\n * resetSessionFlag();\n * ```\n */\nexport function useAuthContext(): AuthContextValue {\n  const context = useContext(AuthContext);\n  if (!context) {\n    throw new Error('useAuthContext must be used within AuthProvider');\n  }\n  return context;\n}\n"
}
Now let's update the SessionInterceptorProvider to use the AuthContext:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/session-interceptor-provider/index.tsx"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/session-interceptor-provider/index.tsx",
  "old_string": "'use client';\n\nimport { useEffect, type PropsWithChildren } from 'react';\nimport { useRouter } from 'next/navigation';\nimport { useLogout } from '@refinedev/core';\nimport { initializeSessionHandler } from '@/providers/data-provider';\nimport {\n  createSessionExpiryHandler,\n  resetSessionExpiryFlag as resetInterceptorFlag,\n} from '@/lib/http-interceptor';\n\n/**\n * Session Interceptor Provider\n *\n * Initializes the session expiry handling by connecting the data provider's\n * session handler to the Refine logout function and Next.js router.\n *\n * This provider:\n * 1. Sets up the session expiry callback in the data provider\n * 2. Resets the session expiry flag when mounted (useful after login)\n * 3. Handles 401/403 responses by showing a toast and logging out\n *\n * Place this provider near the top of your component tree, inside the Refine provider.\n */\nexport const SessionInterceptorProvider = ({ children }: PropsWithChildren) => {\n  const router = useRouter();\n  const { mutate: logout } = useLogout();\n\n  useEffect(() => {\n    // Define the session expiry handler\n    const handleSessionExpiry = () => {\n      // Show toast is handled by the interceptor\n      // Perform logout\n      logout();\n      // Redirect to login\n      router.push('/login');\n    };\n\n    // Initialize the session handler in the data provider\n    initializeSessionHandler(handleSessionExpiry);\n\n    // Also initialize the interceptor's handler (for direct use)\n    createSessionExpiryHandler({\n      onSessionExpiry: handleSessionExpiry,\n    });\n\n    // Reset flags on mount (in case user just logged in)\n    resetInterceptorFlag();\n\n    // Cleanup on unmount\n    return () => {\n      // Reset handler on unmount\n      initializeSessionHandler(() => {});\n    };\n  }, [logout, router]);\n\n  return <>{children}</>;\n};",
  "new_string": "'use client';\n\nimport { useEffect, type PropsWithChildren } from 'react';\nimport { useAuthContext } from '@/contexts/auth-context';\nimport { initializeSessionHandler } from '@/providers/data-provider';\nimport {\n  resetSessionExpiryFlag as resetInterceptorFlag,\n} from '@/lib/http-interceptor';\n\n/**\n * Session Interceptor Provider\n *\n * Connects the data provider's session handler to the AuthContext.\n * This ensures that 401/403 responses trigger proper toast notifications\n * and redirects during SPA navigation.\n *\n * This provider:\n * 1. Sets up the session expiry callback in the data provider\n * 2. Resets the session expiry flag when mounted (useful after login)\n * 3. Handles 401/403 responses by showing a toast and logging out\n *\n * Place this provider near the top of your component tree, inside the Refine provider\n * and AuthProvider.\n */\nexport const SessionInterceptorProvider = ({ children }: PropsWithChildren) => {\n  const { handleSessionExpiry, resetSessionFlag } = useAuthContext();\n\n  useEffect(() => {\n    // Initialize the session handler in the data provider\n    // This will be called when a 401/403 is detected in GraphQL requests\n    initializeSessionHandler(handleSessionExpiry);\n\n    // Reset flags on mount (in case user just logged in)\n    resetInterceptorFlag();\n    resetSessionFlag();\n\n    // Cleanup on unmount\n    return () => {\n      // Reset handler on unmount\n      initializeSessionHandler(() => {});\n    };\n  }, [handleSessionExpiry, resetSessionFlag]);\n\n  return <>{children}</>;\n};"
}
Now let's update the Refine context to include the AuthProvider:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/_refine_context.tsx",
  "old_string": "'use client';\n\nimport React, { type PropsWithChildren } from 'react';\nimport { type I18nProvider, Refine } from '@refinedev/core';\nimport { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';\nimport routerProvider from '@refinedev/nextjs-router';\nimport { useLocale, useTranslations } from 'next-intl';\nimport { useRouter } from 'next/navigation';\nimport { DevtoolsProvider } from '@providers/devtools';\nimport { CsrfProvider } from '@providers/csrf-provider';\nimport { SessionInterceptorProvider } from '@providers/session-interceptor-provider';\nimport { authProviderClient } from '@providers/auth-provider/auth-provider.client';\nimport { dataProvider } from '@providers/data-provider';\nimport { auditLogProvider } from '@providers/audit-log-provider';\nimport { setUserLocale } from '@i18n';",
  "new_string": "'use client';\n\nimport React, { type PropsWithChildren } from 'react';\nimport { type I18nProvider, Refine } from '@refinedev/core';\nimport { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';\nimport routerProvider from '@refinedev/nextjs-router';\nimport { useLocale, useTranslations } from 'next-intl';\nimport { useRouter } from 'next/navigation';\nimport { DevtoolsProvider } from '@providers/devtools';\nimport { CsrfProvider } from '@providers/csrf-provider';\nimport { SessionInterceptorProvider } from '@providers/session-interceptor-provider';\nimport { AuthProvider } from '@/contexts/auth-context';\nimport { authProviderClient } from '@providers/auth-provider/auth-provider.client';\nimport { dataProvider } from '@providers/data-provider';\nimport { auditLogProvider } from '@providers/audit-log-provider';\nimport { setUserLocale } from '@i18n';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/_refine_context.tsx",
  "old_string": "    >\n      <RefineKbarProvider>\n        <CsrfProvider>\n          <SessionInterceptorProvider>\n            <DevtoolsProvider>\n              <RefineKbar />\n              {children}\n            </DevtoolsProvider>\n          </SessionInterceptorProvider>\n        </CsrfProvider>\n      </RefineKbarProvider>\n    </Refine>",
  "new_string": "    >\n      <RefineKbarProvider>\n        <AuthProvider>\n          <CsrfProvider>\n            <SessionInterceptorProvider>\n              <DevtoolsProvider>\n                <RefineKbar />\n                {children}\n              </DevtoolsProvider>\n            </SessionInterceptorProvider>\n          </CsrfProvider>\n        </AuthProvider>\n      </RefineKbarProvider>\n    </Refine>"
}
Now let's update the todo list and add the useAuth hook for convenience:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing auth structure and Apollo setup",
      "content": "Explore existing auth structure and Apollo setup",
      "status": "completed"
    },
    {
      "activeForm": "Creating auth context and useAuth hook",
      "content": "Create auth context and useAuth hook for React component access",
      "status": "completed"
    },
    {
      "activeForm": "Fixing session expiry toast notification",
      "content": "Fix session expiry toast notification to work in React context",
      "status": "completed"
    },
    {
      "activeForm": "Ensuring redirect works on SPA navigation",
      "content": "Ensure redirect works on SPA navigation, not just page reload",
      "status": "completed"
    },
    {
      "activeForm": "Creating Playwright test to verify functionality",
      "content": "Create Playwright test to verify functionality",
      "status": "in_progress"
    }
  ]
}
Now let me create a Playwright test to verify the session expiry detection works correctly:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/tests/session-expiry-e2e.spec.ts",
  "content": "import { test, expect } from '@playwright/test';\n\n/**\n * E2E Test for Client-Side Session Expiry Detection\n *\n * This test verifies that:\n * 1. 401/403 responses during GraphQL requests trigger logout\n * 2. Toast notification is shown when session expires\n * 3. User is redirected to /login page\n * 4. The redirect works on SPA navigation, not just full page reload\n */\n\nconst GRAPHQL_URL = process.env.GRAPHQL_URL || 'http://localhost:3001/graphql';\n\ntest.describe('Session Expiry Detection', () => {\n  test.beforeEach(async ({ page }) => {\n    // Navigate to a protected page (chat)\n    await page.goto('/chat');\n  });\n\n  test('should show toast and redirect on 401 response during SPA navigation', async ({\n    page,\n  }) => {\n    // First, log in with a valid user\n    await page.goto('/login');\n\n    await page.fill('input[name=\"email\"]', 'admin@refine.dev');\n    await page.fill('input[name=\"password\"]', 'password');\n    await page.click('button[type=\"submit\"]');\n\n    // Wait for navigation to chat after successful login\n    await page.waitForURL('/chat', { timeout: 5000 });\n\n    // Verify we're logged in\n    await expect(page).toHaveURL(/\\/chat/);\n\n    // Intercept GraphQL requests and simulate 401 response\n    await page.route('**/graphql', async (route) => {\n      // Simulate 401 Unauthorized response\n      await route.fulfill({\n        status: 401,\n        contentType: 'application/json',\n        body: JSON.stringify({\n          errors: [\n            {\n              message: 'Unauthorized',\n              extensions: { code: 'UNAUTHENTICATED' },\n            },\n          ],\n        }),\n      });\n    });\n\n    // Trigger a GraphQL request by navigating to settings\n    // This will cause the data provider to fetch and receive the 401\n    await page.click('a[href=\"/settings\"], nav a:has-text(\"Settings\")');\n\n    // Wait for toast to appear\n    await expect(page.getByText('Session Expired')).toBeVisible({\n      timeout: 5000,\n    });\n\n    // Verify the toast message\n    await expect(\n      page.getByText('Your session has expired. Please log in again.'),\n    ).toBeVisible();\n\n    // Verify redirect to login\n    await page.waitForURL('/login', { timeout: 5000 });\n    await expect(page).toHaveURL('/login');\n  });\n\n  test('should show toast and redirect on 403 response', async ({ page }) => {\n    // First, log in\n    await page.goto('/login');\n    await page.fill('input[name=\"email\"]', 'user@example.com');\n    await page.fill('input[name=\"password\"]', 'password123');\n    await page.click('button[type=\"submit\"]');\n    await page.waitForURL('/chat', { timeout: 5000 });\n\n    // Intercept GraphQL requests and simulate 403 response\n    await page.route('**/graphql', async (route) => {\n      await route.fulfill({\n        status: 403,\n        contentType: 'application/json',\n        body: JSON.stringify({\n          errors: [\n            {\n              message: 'Forbidden',\n              extensions: { code: 'FORBIDDEN' },\n            },\n          ],\n        }),\n      });\n    });\n\n    // Trigger a GraphQL request by clicking documents\n    await page.click('a[href=\"/documents\"], nav a:has-text(\"Documents\")');\n\n    // Wait for toast\n    await expect(page.getByText('Session Expired')).toBeVisible({\n      timeout: 5000,\n    });\n\n    // Verify redirect to login\n    await page.waitForURL('/login', { timeout: 5000 });\n    await expect(page).toHaveURL('/login');\n  });\n\n  test('should handle session expiry during document list fetch', async ({\n    page,\n  }) => {\n    // Log in\n    await page.goto('/login');\n    await page.fill('input[name=\"email\"]', 'lawyer@example.com');\n    await page.fill('input[name=\"password\"]', 'password123');\n    await page.click('button[type=\"submit\"]');\n    await page.waitForURL('/chat', { timeout: 5000 });\n\n    // Set up route to return 401 for next GraphQL request\n    await page.route('**/graphql', async (route) => {\n      await route.fulfill({\n        status: 401,\n        contentType: 'application/json',\n        body: JSON.stringify({\n          errors: [\n            {\n              message: 'Invalid token',\n              extensions: { code: 'UNAUTHENTICATED' },\n            },\n          ],\n        }),\n      });\n    });\n\n    // Navigate to documents page (triggers GraphQL query)\n    await page.goto('/documents');\n\n    // Should see toast\n    await expect(page.getByText('Session Expired')).toBeVisible({\n      timeout: 5000,\n    });\n\n    // Should be redirected to login\n    await page.waitForURL('/login', { timeout: 5000 });\n    await expect(page).toHaveURL('/login');\n  });\n});\n"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/piteer/workspace/radca-prawny/legal/apps/web/tests/ 2>/dev/null || echo \"Directory does not exist\"",
  "description": "Check if tests directory exists"
}
There's already a session expiry test. Let me read it to see what we need to verify:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/tests/session-expiry-e2e.spec.ts"
}
Good, there's already a comprehensive test. Now let me run the existing test to verify the implementation works:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/web && npx playwright test session-expiry-e2e.spec.ts --headed 2>&1 | head -100",
  "description": "Run session expiry E2E tests",
  "timeout": 180000
}
