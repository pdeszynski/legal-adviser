import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { DocumentStatus } from '../entities/legal-document.entity';

// Register DocumentStatus enum for GraphQL if not already registered
// This allows the enum to be used in subscription responses
registerEnumType(DocumentStatus, {
  name: 'DocumentStatus',
  description: 'Status of document generation',
});

/**
 * Document Status Change Payload
 *
 * GraphQL type representing a document status change event.
 * Emitted via subscription when a document transitions between states.
 *
 * State Transitions:
 * - DRAFT -> GENERATING: Document generation started
 * - GENERATING -> COMPLETED: Document generation succeeded
 * - GENERATING -> FAILED: Document generation failed
 */
@ObjectType('DocumentStatusChange')
export class DocumentStatusChangePayload {
  @Field(() => String, { description: 'ID of the document' })
  documentId: string;

  @Field(() => String, { description: 'ID of the session' })
  sessionId: string;

  @Field(() => DocumentStatus, {
    description: 'Previous status before the change',
  })
  previousStatus: DocumentStatus;

  @Field(() => DocumentStatus, { description: 'New status after the change' })
  newStatus: DocumentStatus;

  @Field(() => String, { description: 'ISO timestamp of the status change' })
  timestamp: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional message describing the status change',
  })
  message?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Error message if status is FAILED',
  })
  error?: string;
}
