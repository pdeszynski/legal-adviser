# GraphQL Codegen Guide

This guide explains how to use GraphQL Code Generator in the Legal AI Platform project. GraphQL Codegen automatically generates TypeScript types and React Query hooks from your GraphQL operations, providing type safety and better developer experience.

## Table of Contents

1. [Overview](#overview)
2. [Configuration](#configuration)
3. [Project Structure](#project-structure)
4. [Defining GraphQL Operations](#defining-graphql-operations)
5. [Using Generated Hooks](#using-generated-hooks)
6. [Fragment Composition](#fragment-composition)
7. [Type Generation Workflow](#type-generation-workflow)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

GraphQL Code Generator (`graphql-codegen`) is a tool that:

- Generates TypeScript types from the backend GraphQL schema
- Creates type-safe React Query hooks for queries and mutations
- Enables autocomplete and compile-time type checking
- Eliminates the need to manually write types for API responses

### Key Benefits

| Benefit              | Description                                         |
| -------------------- | --------------------------------------------------- |
| **Type Safety**      | All GraphQL operations are fully typed              |
| **Autocomplete**     | IDE provides autocomplete for queries and responses |
| **Refactoring**      | Changes to schema are caught at compile time        |
| **Less Boilerplate** | No need to manually write interfaces for API data   |

---

## Configuration

The codegen configuration is located at `apps/web/codegen.yml`:

```yaml
schema:
  # Points to the backend's auto-generated GraphQL schema
  - ../backend/src/schema.gql

documents:
  # GraphQL query/mutation files
  - '**/*.graphql'
  - '**/*.gql'
  # Also scans TypeScript files for GraphQL tagged templates
  - 'src/**/*.{ts,tsx}'

generates:
  # Main output file with types and hooks
  src/generated/graphql.ts:
    plugins:
      - typescript # Schema types
      - typescript-operations # Operation types
      - typescript-react-query # React Query hooks
    config:
      fetcher: ./graphql-fetcher#fetcher
      reactQueryVersion: 5
      strictScalars: true
      enumsAsTypes: true

  # Introspection file for tools
  src/generated/introspection.json:
    plugins:
      - introspection

hooks:
  afterAllFileWrite:
    - pnpm prettier --write
```

### Generated Files

| File                               | Purpose                                |
| ---------------------------------- | -------------------------------------- |
| `src/generated/graphql.ts`         | TypeScript types and React Query hooks |
| `src/generated/graphql-fetcher.ts` | Custom fetcher for GraphQL requests    |
| `src/generated/introspection.json` | Schema introspection for dev tools     |

---

## Project Structure

GraphQL operations are organized in `src/graphql/`:

```
src/graphql/
├── fragments/           # Reusable fragments
│   ├── user.graphql
│   ├── pagination.graphql
│   ├── legal-document.graphql
│   └── ...
├── queries/             # Query operations
│   ├── auth.graphql
│   ├── notifications.graphql
│   └── ...
├── mutations/           # Mutation operations
│   ├── auth.graphql
│   ├── user-preferences.graphql
│   └── ...
├── documents.graphql    # Domain-specific operations
├── chat.graphql
└── admin.graphql
```

---

## Defining GraphQL Operations

### Basic Query

Create a `.graphql` file in `src/graphql/`:

```graphql
# src/graphql/queries/my-query.graphql

query GetCurrentUser {
  me {
    id
    email
    username
  }
}
```

### Query with Variables

```graphql
# src/graphql/queries/documents.graphql

query GetLegalDocuments($filter: LegalDocumentFilter, $paging: CursorPaging) {
  legalDocuments(filter: $filter, paging: $paging) {
    totalCount
    edges {
      node {
        id
        title
        status
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
  }
}
```

### Mutation

```graphql
# src/graphql/mutations/documents.graphql

mutation GenerateDocument($input: GenerateDocumentInput!) {
  generateDocument(input: $input) {
    id
    title
    content
    status
  }
}
```

### Using Fragment Imports

The `#import` directive allows reusing fragments:

```graphql
#import "../fragments/user.graphql"

query Me {
  me {
    ...UserFragment
  }
}
```

---

## Using Generated Hooks

After running codegen, hooks are automatically generated. The naming convention is:

- Queries: `use{OperationName}Query`
- Mutations: `use{OperationName}Mutation`

### Query Example

```tsx
import { useGetLegalDocumentsQuery } from '@/generated/graphql';

export function DocumentList() {
  const { data, isLoading, error } = useGetLegalDocumentsQuery({
    variables: {
      paging: { first: 10 },
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.legalDocuments.edges.map((edge) => (
        <li key={edge.node.id}>{edge.node.title}</li>
      ))}
    </ul>
  );
}
```

### Mutation Example

```tsx
import { useGenerateDocumentMutation } from '@/generated/graphql';

export function GenerateDocumentForm() {
  const [mutate, { loading, error }] = useGenerateDocumentMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const result = await mutate({
        variables: {
          input: {
            templateId: formData.get('templateId') as string,
            parameters: JSON.parse(formData.get('parameters') as string),
          },
        },
      });

      if (result.data?.generateDocument) {
        console.log('Document generated:', result.data.generateDocument);
      }
    } catch (err) {
      console.error('Mutation failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Generating...' : 'Generate Document'}
      </button>
    </form>
  );
}
```

### With Query Options

```tsx
import { useGetLegalDocumentsQuery } from '@/generated/graphql';

export function DocumentList() {
  const { data } = useGetLegalDocumentsQuery({
    variables: { paging: { first: 10 } },
    // Additional React Query options
    options: {
      staleTime: 60000, // Cache for 1 minute
      refetchOnWindowFocus: false,
      enabled: true, // Can be conditional
    },
  });

  // ...
}
```

### Type Selectors (Data Transformation)

Use generics to transform the response shape:

```tsx
import { useGetLegalDocumentsQuery } from '@/generated/graphql';

// Custom selector to extract just the document array
const { data } = useGetLegalDocumentsQuery<{ documents: Array<{ id: string; title: string }> }>({
  select: (data) => ({
    documents: data.legalDocuments.edges.map((e) => ({
      id: e.node.id,
      title: e.node.title,
    })),
  }),
});
```

---

## Fragment Composition

Fragments allow reusable field selections across operations.

### Defining Fragments

```graphql
# src/graphql/fragments/user.graphql

fragment UserFragment on User {
  id
  email
  username
  isActive
  role
}

fragment UserDetailFragment on User {
  ...UserFragment
  disclaimerAccepted
  createdAt
  updatedAt
}
```

### Using Fragments

```graphql
#import "../fragments/user.graphql"

query GetUserList($paging: CursorPaging) {
  users(paging: $paging) {
    edges {
      node {
        ...UserFragment # Uses the fragment
      }
    }
  }
}

query GetUserDetail($id: ID!) {
  user(id: $id) {
    ...UserDetailFragment # Uses extended fragment
  }
}
```

### Nested Fragments

Fragments can include other fragments:

```graphql
fragment DocumentFragment on LegalDocument {
  id
  title
  status
  createdBy {
    ...UserMinimalFragment
  }
}

fragment UserMinimalFragment on User {
  id
  email
  firstName
  lastName
}
```

---

## Type Generation Workflow

### Step 1: Define GraphQL Operation

Create or modify a `.graphql` file:

```graphql
# src/graphql/queries/my-new-query.graphql
query MyNewQuery {
  # fields...
}
```

### Step 2: Run Code Generator

```bash
# From apps/web directory
pnpm codegen

# Or in watch mode (regenerates on file changes)
pnpm codegen:watch
```

### Step 3: Use Generated Hook

```tsx
import { useMyNewQueryQuery } from '@/generated/graphql';

// Hook is now available with full types
const { data } = useMyNewQueryQuery();
```

### What Gets Generated

For each operation, codegen generates:

1. **Input types** - Variables for the operation
2. **Response types** - Shape of the response data
3. **Hook function** - React Query hook with types
4. **Document node** - GraphQL query AST for use with other tools

---

## Best Practices

### 1. Use Fragments for Reusability

**Good:**

```graphql
#import "../fragments/user.graphql"

query Me {
  me {
    ...AuthUserFragment
  }
}
```

**Avoid:**

```graphql
query Me {
  me {
    id
    email
    username
    firstName
    lastName
    # ... repeating everywhere
  }
}
```

### 2. Organize by Domain

Group operations by feature domain:

- `documents.graphql` - Document-related queries/mutations
- `chat.graphql` - Legal Q&A operations
- `admin.graphql` - Admin-specific operations

### 3. Use Typed Variables

```tsx
// The variables object is fully typed
const { data } = useGetLegalDocumentsQuery({
  variables: {
    filter: {
      status: { eq: 'DRAFT' }, // Type-safe enum values
    },
    paging: { first: 10 },
  },
});
```

### 4. Prefer `.graphql` Files

While you can use `gql` tagged templates in TSX files, separate `.graphql` files:

- Are easier to syntax-highlight
- Support the `#import` directive
- Keep concerns separated

### 5. Always Use Imports for Fragments

Use `#import` instead of redefining fragments:

```graphql
#import "../fragments/user.graphql"
#import "../fragments/pagination.graphql"

query GetUsers($paging: CursorPaging) {
  users(paging: $paging) {
    ...UserPageResultFragment
  }
}
```

### 6. Watch Mode During Development

Run `pnpm codegen:watch` in a separate terminal for automatic regeneration.

### 7. Commit Generated Files

Commit `src/generated/graphql.ts` to ensure type consistency across the team.

---

## Troubleshooting

### Codegen command fails

**Problem:** Running `pnpm codegen` throws an error.

**Solutions:**

1. **Ensure backend schema exists:**

   ```bash
   ls apps/backend/src/schema.gql
   ```

   If missing, generate it from the backend:

   ```bash
   cd apps/backend
   pnpm build  # or the command that generates schema.gql
   ```

2. **Check GraphQL syntax:**
   Verify all `.graphql` files have valid syntax. Common issues:
   - Missing comma in argument lists
   - Unclosed braces
   - Invalid fragment imports

3. **Clear and regenerate:**
   ```bash
   rm -rf src/generated
   pnpm codegen
   ```

### Generated types don't match schema

**Problem:** Types are outdated after backend schema changes.

**Solution:**

1. Regenerate the backend schema first
2. Then run frontend codegen:
   ```bash
   cd apps/backend && pnpm build
   cd ../web && pnpm codegen
   ```

### Fragment not found error

**Problem:** Error about missing fragment when using `#import`.

**Solutions:**

1. **Check import path:**

   ```graphql
   #import "../fragments/user.graphql"  # Relative path
   ```

2. **Ensure fragment is defined:**

   ```graphql
   # src/graphql/fragments/user.graphql
   fragment UserFragment on User {
     id
     email
   }
   ```

3. **Verify fragment type:**
   The `on Type` must match an actual GraphQL type:
   ```graphql
   fragment UserFragment on User  # User must exist in schema
   ```

### Hook doesn't exist after generation

**Problem:** `useMyQueryQuery` is not exported.

**Solutions:**

1. **Check operation name:**
   Hooks are generated from operation names:

   ```graphql
   query GetUsers  # -> useGetUsersQuery
   mutation CreateUser  # -> useCreateUserMutation
   ```

2. **Ensure file is scanned:**
   Verify the file matches the pattern in `codegen.yml`:

   ```yaml
   documents:
     - '**/*.graphql' # Should match your file
   ```

3. **Check for duplicate names:**
   Operation names must be unique across all files.

### TypeScript errors with generated types

**Problem:** Type errors after using generated hooks.

**Solutions:**

1. **Restart TypeScript server:**
   In VS Code: Command Palette -> "TypeScript: Restart TS Server"

2. **Check for conflicting types:**
   Ensure you don't have manual types that conflict with generated ones.

3. **Verify enum handling:**
   With `enumsAsTypes: true`, enums are string unions:

   ```tsx
   // Instead of:
   role: Role.ADMIN;

   // Use:
   role: 'ADMIN';
   ```

### Variables type mismatch

**Problem:** TypeScript error on variables object.

**Solution:**
Check the generated input type:

```tsx
import type { GetLegalDocumentsQueryVariables } from '@/generated/graphql';

const variables: GetLegalDocumentsQueryVariables = {
  filter: {
    /* ... */
  }, // Type-checked
};
```

### Watch mode not regenerating

**Problem:** `pnpm codegen:watch` doesn't detect changes.

**Solutions:**

1. **Check file patterns:**
   Ensure changed files match the `documents` patterns in `codegen.yml`

2. **Restart watch mode:**
   Sometimes the watcher needs to be restarted after adding new files

3. **Check for symbolic links:**
   Some watchers don't follow symlinks properly

### Introspection errors

**Problem:** Error related to `introspection.json`.

**Solutions:**

1. **Verify backend is accessible:**
   The introspection plugin may need to reach the GraphQL endpoint

2. **Regenerate separately:**
   ```bash
   pnpm codegen --config codegen.yml
   ```

---

## Additional Resources

- [GraphQL Code Generator Docs](https://the-guild.dev/graphql/codegen)
- [React Query Documentation](https://tanstack.com/query/latest)
- [GraphQL Fragment Composition](https://graphql.org/learn/queries/#fragments)
