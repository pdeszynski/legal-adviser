# Chat Data Cleanup Runbook

## Overview

This runbook documents the process for cleaning up empty assistant messages in the database. These empty messages were caused by a bug in the streaming response flow where the `content` field was not being populated correctly.

## Problem Description

Due to a bug in the AI streaming response handling, some assistant messages were saved to the database with:
- `content` field empty (NULL or empty string)
- `rawContent` field potentially containing the actual response data
- `metadata` field potentially containing clarification data

## Recovery Strategy

1. **RawContent Recovery**: If `rawContent` has data, copy it to `content`
2. **Clarification Metadata Recovery**: If `metadata.clarification` exists, serialize to JSON and store in `content`
3. **Truly Empty Messages**: Messages with neither `rawContent` nor clarification metadata cannot be recovered

## GraphQL API Endpoints

All endpoints require admin authentication.

### 1. Analyze Empty Messages

```graphql
query AnalyzeEmptyMessages {
  analyzeEmptyMessages {
    totalEmptyMessages
    recoverableFromRawContent
    withClarificationMetadata
    trulyEmpty
    affectedSessions
    affectedUsers
    messages {
      messageId
      sessionId
      userId
      hasRecoverableRawContent
      hasClarificationMetadata
    }
  }
}
```

### 2. Get Empty Messages for Specific Session

```graphql
query EmptyMessagesForSession {
  emptyMessagesForSession(sessionId: "uuid-here") {
    messageId
    content
    rawContent
    hasRecoverableRawContent
    hasClarificationMetadata
  }
}
```

### 3. Get Empty Messages for Specific User

```graphql
query EmptyMessagesForUser {
  emptyMessagesForUser(userId: "user-uuid-here") {
    messageId
    sessionId
    hasRecoverableRawContent
    hasClarificationMetadata
  }
}
```

### 4. Generate Affected Users Report

```graphql
query AffectedUsersReport {
  affectedUsersForEmptyMessages {
    totalAffectedUsers
    totalEmptyMessages
    users {
      userId
      emptyMessageCount
      affectedSessionCount
      sessionIds
    }
  }
}
```

### 5. Cleanup Empty Messages (Dry Run)

```graphql
mutation CleanupEmptyMessagesDryRun {
  cleanupEmptyMessages(input: {
    execute: false
    recoverFromRawContent: true
    recoverFromClarification: true
    markForDeletion: false
  }) {
    recoveredFromRawContent
    recoveredFromClarification
    unrecoverable
    affectedSessions
    affectedUsers
    sessionIds
  }
}
```

### 6. Cleanup Empty Messages (Execute)

```graphql
mutation CleanupEmptyMessagesExecute {
  cleanupEmptyMessages(input: {
    execute: true
    recoverFromRawContent: true
    recoverFromClarification: true
    markForDeletion: false
  }) {
    recoveredFromRawContent
    recoveredFromClarification
    unrecoverable
    affectedSessions
    affectedUsers
    sessionIds
  }
}
```

## Cleanup Procedure

### Staging Environment

1. **Analysis Phase**
   - Run `analyzeEmptyMessages` to get a full picture
   - Review the number of affected messages and users
   - Identify which recovery strategies will work

2. **Verification Phase**
   - Run `emptyMessagesForSession` on sample sessions
   - Verify that `rawContent` or clarification data exists
   - Confirm recovery will work correctly

3. **Dry Run Phase**
   - Run `cleanupEmptyMessages` with `execute: false`
   - Review the expected results
   - Confirm the numbers match analysis

4. **Execution Phase**
   - Run `cleanupEmptyMessages` with `execute: true`
   - Monitor logs for any errors
   - Verify data integrity after completion

5. **Validation Phase**
   - Re-run `analyzeEmptyMessages` - should show 0 results
   - Check sample sessions to verify content is populated
   - Run affected users report to confirm cleanup

### Production Environment

Follow the same procedure as staging, but:

1. **Pre-execution checklist:**
   - [ ] Staging cleanup completed successfully
   - [ ] Database backup created
   - [ ] Maintenance window scheduled (if needed)
   - [ ] Monitoring alerts configured

2. **Execution:**
   - Run during low-traffic period
   - Monitor server performance
   - Have rollback plan ready

## Post-Cleanup Actions

### User Notification

If users were affected by the bug:

1. Use the `affectedUsersForEmptyMessages` report to identify users
2. Send notification explaining the issue was fixed
3. Users may need to refresh their chat history

### Monitoring

After cleanup:
- Monitor error rates for chat functionality
- Check for any empty content issues in logs
- Verify user reports decrease

## Rollback Plan

If issues arise after cleanup:

1. Restore from pre-cleanup backup
2. Investigate the root cause of the issue
3. Fix the cleanup script
4. Re-test in staging

## Service Class

`ChatDataCleanupService` in `apps/backend/src/modules/chat/services/chat-data-cleanup.service.ts`

## Key Methods

| Method | Purpose |
|--------|---------|
| `analyzeEmptyMessages()` | Full analysis of empty messages |
| `cleanupEmptyMessages(input)` | Perform cleanup with options |
| `generateAffectedUsersReport()` | User notification report |
| `getEmptyMessagesForSession(id)` | Debug specific session |
| `getEmptyMessagesForUser(id)` | Debug specific user |

## Related Files

- `apps/backend/src/modules/chat/dto/chat-data-cleanup.dto.ts` - DTOs
- `apps/backend/src/modules/chat/chat-data-cleanup.resolver.ts` - GraphQL resolver
- `apps/backend/src/modules/chat/services/chat-data-cleanup.service.ts` - Service

## Troubleshooting

### Issue: Empty messages still appear after cleanup

**Solution:**
1. Verify `execute: true` was used
2. Check for newly created empty messages (bug may still be active)
3. Run analysis again to see current state

### Issue: Recovery from rawContent not working

**Solution:**
1. Verify `rawContent` field has data
2. Check database constraints on `content` field
3. Review service logs for errors

### Issue: Clarification metadata not being serialized

**Solution:**
1. Verify `metadata->'clarification'` JSONB path exists
2. Check clarification data structure matches expected format
3. Review JSON serialization in service method

## Prevention

To prevent future empty messages:

1. Ensure database validation prevents empty `content` (see related features)
2. Add frontend validation before saving messages
3. Monitor for empty content in application logs
4. Add alerts for high rate of empty messages
