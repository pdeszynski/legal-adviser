I'll start by exploring the codebase to understand the current GraphQL client setup and how authentication headers are being handled.

🔧 Tool: Task
Input: {
  "subagent_type": "Explore",
  "prompt": "Explore the frontend GraphQL client setup in this Next.js/refine.dev application. I need to understand:\n\n1. How is the GraphQL client configured (Apollo Client, custom fetch wrapper, urql, etc.)?\n2. Where is the authorization header being set?\n3. How is the JWT token retrieved from storage?\n4. Is there an authProvider or custom data provider handling auth?\n5. Check if there's a link chain or middleware for adding headers\n6. Look for any existing header configuration in the data provider\n\nFocus on files in apps/web/src/providers/, apps/web/src/app/, and any auth-related configuration. Return the key files and their content related to GraphQL client configuration.",
  "description": "Explore GraphQL client auth setup"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/**/*graphql*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/providers/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/data-provider/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/auth-provider/auth-provider.client.ts"
}
