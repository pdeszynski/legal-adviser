# Temporal Activities

This directory contains Temporal activity definitions for the Legal AI Platform.

## Activity Structure

Activities are organized by domain:

- `document/` - Document processing activities
- `ai/` - AI-powered activities
- `notification/` - Notification activities
- `billing/` - Billing activities

## Creating a New Activity

1. Create a new file in the appropriate domain directory
2. Import and use the `@activity` decorator or define as a plain function
3. Define the activity interface and implementation
4. Register activities with the worker

## Example

```typescript
import { activity } from '@temporalio/activity';

export interface MyActivityInput {
  userId: string;
  data: unknown;
}

export async function myActivity(input: MyActivityInput): Promise<unknown> {
  // Activity logic here (I/O, external API calls, etc.)
  return { success: true };
}
```

## Best Practices

1. **Idempotency**: Activities should be idempotent when possible
2. **Heartbeat**: For long-running activities, send heartbeats
3. **Retry policies**: Configure appropriate retry policies for each activity
4. **Error handling**: Return specific error types for better retry behavior
