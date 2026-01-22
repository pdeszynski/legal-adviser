import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import {
  IsString,
  IsUUID,
  IsInt,
  IsOptional,
  Min,
  IsEnum,
} from 'class-validator';

/**
 * Operation Type Enum
 *
 * Types of cursor operations:
 * - INSERT: User inserted text
 * - DELETE: User deleted text
 * - REPLACE: User replaced text (delete + insert)
 * - CURSOR_MOVE: User moved cursor without editing
 */
export enum CursorOperationType {
  INSERT = 'INSERT',
  DELETE = 'DELETE',
  REPLACE = 'REPLACE',
  CURSOR_MOVE = 'CURSOR_MOVE',
}

registerEnumType(CursorOperationType, {
  name: 'CursorOperationType',
  description: 'Type of cursor operation',
});

/**
 * Cursor Operation Input
 *
 * Represents a single editing operation from a client.
 * Used for Operational Transformation to reconcile concurrent edits.
 */
@ObjectType('CursorOperation')
export class CursorOperationInput {
  @Field(() => ID)
  @IsUUID()
  documentId: string;

  @Field(() => CursorOperationType)
  @IsEnum(CursorOperationType)
  operationType: CursorOperationType;

  /**
   * Position where the operation occurred
   */
  @Field(() => Number)
  @IsInt()
  @Min(0)
  position: number;

  /**
   * Length of text affected (for DELETE/REPLACE)
   */
  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  length?: number;

  /**
   * Text to insert (for INSERT/REPLACE)
   */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  text?: string;

  /**
   * New cursor position after operation
   */
  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  newPosition?: number;

  /**
   * Selection length after operation
   */
  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  selectionLength?: number;

  /**
   * Operation version (for OT reconciliation)
   * Incremented for each operation on the document
   */
  @Field(() => Number)
  @IsInt()
  @Min(0)
  version: number;
}

/**
 * Transformed Operation
 *
 * Result of Operational Transformation.
 * Represents an operation that has been transformed against
 * concurrent operations to maintain document consistency.
 */
@ObjectType('TransformedOperation')
export class TransformedOperation {
  @Field(() => CursorOperationType)
  operationType: CursorOperationType;

  @Field(() => Number)
  position: number;

  @Field(() => Number, { nullable: true })
  length?: number;

  @Field(() => String, { nullable: true })
  text?: string;

  @Field(() => Number)
  version: number;
}
