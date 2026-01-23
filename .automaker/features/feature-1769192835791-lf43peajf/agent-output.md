I'll start by reading the file that's causing the build error to understand the issue.

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/data-provider/index.ts",
  "offset": 1000,
  "limit": 50
}
I can see the issue. The variable `queryConfig` is declared as `const` somewhere above, but on line 1020 we're trying to reassign it. Let me look at the declaration of `queryConfig`:

🔧 Tool: Grep
Input: {
  "pattern": "const queryConfig",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/data-provider/index.ts",
  "output_mode": "content",
  "-n": true
}
Found it. `queryConfig` is declared as `const` on line 974, but then we're trying to reassign it on line 1020. Let me see more context around both areas to understand the full scope:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/data-provider/index.ts",
  "limit": 80,
  "offset": 965
}
Now I understand the issue clearly. The problem is:
- Line 974: `const queryConfig = config?.query;` - declares `queryConfig` as a constant
- Line 975: `let mutationConfig = config?.mutation;` - correctly declares `mutationConfig` as `let` so it can be reassigned
- Lines 988-1014: `mutationConfig` is reassigned multiple times (which works because it's `let`)
- Line 1020: tries to reassign `queryConfig`, but it was declared as `const`

The fix is simple: change `const queryConfig` to `let queryConfig` on line 974.

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/data-provider/index.ts",
  "old_string": "  }) => {\n    const queryConfig = config?.query;\n    let mutationConfig = config?.mutation;",
  "new_string": "  }) => {\n    let queryConfig = config?.query;\n    let mutationConfig = config?.mutation;"
}
Now let me verify the build passes by running it:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/web && pnpm run build 2>&1",
  "description": "Build web app to verify fix",
  "timeout": 180000
}
The build passes successfully now. Let me also run the type check to make sure everything is correct:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1",
  "description": "Type check web app",
  "timeout": 120000
}
No type errors. The fix is complete.

<summary>
## Summary: Build does not pass with - TypeScript const reassignment error

### Changes Implemented
- Changed `const queryConfig` to `let queryConfig` on line 974 to allow reassignment

### Files Modified
- `apps/web/src/providers/data-provider/index.ts:974`

### Root Cause
The variable `queryConfig` was declared with `const` but was being reassigned later in the code (line 1020) for URL-based queries. The parallel variable `mutationConfig` was correctly declared with `let` to allow reassignment, but `queryConfig` was not.

### Verification Status
- Build passes successfully (`pnpm run build` in apps/web)
- Type checking passes with no errors (`npx tsc --noEmit`)
</summary>