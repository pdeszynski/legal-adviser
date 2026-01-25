# Temporal Workflows

This directory contains Temporal workflow definitions for the Legal AI Platform.

## Workflow Structure

Workflows are organized by domain:

- `document/` - Document processing workflows (generation, export, analysis)
- `ai/` - AI-powered workflows (query processing, case research)
- `notification/` - Notification workflows (email, in-app)
- `billing/` - Billing workflows (subscription renewal, invoicing)

## Creating a New Workflow

1. Create a new file in the appropriate domain directory
2. Import and use the `@workflow` decorator from Temporal SDK
3. Define the workflow interface and implementation
4. Register the workflow in `temporal.constants.ts`

## Example

```typescript
import { workflow } from '@temporalio/workflow';

export interface MyWorkflowInput {
  userId: string;
  data: unknown;
}

export async function myWorkflow(input: MyWorkflowInput): Promise<unknown> {
  // Workflow logic here
  return { success: true };
}
```

## Best Practices

1. **Keep workflows deterministic**: Workflows should only make deterministic decisions
2. **Use activities for side effects**: All I/O operations should be in activities
3. **Handle signals and queries**: Add signal handlers for external events and query handlers for state inspection
4. **Set appropriate timeouts**: Configure execution and task timeouts based on expected duration
