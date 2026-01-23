'use client';

import { useList, useInvalidate, useCreate, useUpdate, useDelete } from '@refinedev/core';
import { useCallback, useState } from 'react';

/**
 * Comment resolution status enum
 */
export enum CommentResolutionStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
}

/**
 * Position of an inline comment in the document
 */
export interface CommentPosition {
  startOffset: number;
  endOffset: number;
  text?: string;
  section?: string;
}

/**
 * Document comment model
 */
export interface DocumentComment {
  id: string;
  documentId: string;
  authorId: string;
  author?: {
    id: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  text: string;
  position: CommentPosition;
  resolutionStatus: CommentResolutionStatus;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a new comment
 */
export interface CreateCommentInput {
  documentId: string;
  text: string;
  position: CommentPosition;
  resolutionStatus?: CommentResolutionStatus;
}

/**
 * Input for updating a comment
 */
export interface UpdateCommentInput {
  text?: string;
  position?: CommentPosition;
  resolutionStatus?: CommentResolutionStatus;
  resolvedBy?: string;
}

/**
 * Return type for useDocumentComments hook
 */
export interface UseDocumentCommentsReturn {
  comments: DocumentComment[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: unknown;
  createComment: (input: CreateCommentInput) => Promise<void>;
  updateComment: (id: string, input: UpdateCommentInput) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  resolveComment: (id: string) => Promise<void>;
  reopenComment: (id: string) => Promise<void>;
  refetch: () => void;
}

/**
 * Hook for managing document comments
 * Provides CRUD operations and resolution status management
 */
export function useDocumentComments(documentId: string | undefined): UseDocumentCommentsReturn {
  const invalidate = useInvalidate();

  // Fetch comments for the document
  const { query, result } = useList<DocumentComment>({
    resource: 'documentComments',
    queryOptions: {
      enabled: !!documentId,
      staleTime: 5000, // Cache for 5 seconds
    },
    pagination: {
      currentPage: 1,
      pageSize: 100, // Load all comments at once
    },
    sorters: [
      {
        field: 'createdAt',
        order: 'asc',
      },
    ],
    filters: documentId
      ? [
          {
            field: 'documentId',
            operator: 'eq',
            value: documentId,
          },
        ]
      : [],
  });

  const { data, isLoading, error } = query;
  const comments = result?.data || [];

  // Mutations with loading states
  const { mutate: createMutation } = useCreate();
  const { mutate: updateMutation } = useUpdate();
  const { mutate: deleteMutation } = useDelete();

  // Local loading states for mutations
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Create a new comment
   */
  const createComment = useCallback(
    async (input: CreateCommentInput) => {
      if (!documentId) return;

      setIsCreating(true);
      try {
        await new Promise<void>((resolve, reject) => {
          createMutation(
            {
              resource: 'documentComments',
              values: {
                ...input,
                documentId,
                authorId: 'current-user-id', // TODO: Get from auth context
              },
            },
            {
              onSuccess: () => {
                invalidate({
                  resource: 'documentComments',
                  invalidates: ['list'],
                });
                resolve();
              },
              onError: (error) => {
                reject(error);
              },
            },
          );
        });
      } finally {
        setIsCreating(false);
      }
    },
    [documentId, createMutation, invalidate],
  );

  /**
   * Update an existing comment
   */
  const updateComment = useCallback(
    async (id: string, input: UpdateCommentInput) => {
      setIsUpdating(true);
      try {
        await new Promise<void>((resolve, reject) => {
          updateMutation(
            {
              resource: 'documentComments',
              id,
              values: input,
            },
            {
              onSuccess: () => {
                invalidate({
                  resource: 'documentComments',
                  invalidates: ['list'],
                });
                resolve();
              },
              onError: (error) => {
                reject(error);
              },
            },
          );
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [updateMutation, invalidate],
  );

  /**
   * Delete a comment
   */
  const deleteComment = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        await new Promise<void>((resolve, reject) => {
          deleteMutation(
            {
              resource: 'documentComments',
              id,
            },
            {
              onSuccess: () => {
                invalidate({
                  resource: 'documentComments',
                  invalidates: ['list'],
                });
                resolve();
              },
              onError: (error) => {
                reject(error);
              },
            },
          );
        });
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteMutation, invalidate],
  );

  /**
   * Mark a comment as resolved
   */
  const resolveComment = useCallback(
    async (id: string) => {
      updateComment(id, {
        resolutionStatus: CommentResolutionStatus.RESOLVED,
        resolvedBy: 'current-user-id', // TODO: Get from auth context
      });
    },
    [updateComment],
  );

  /**
   * Reopen a resolved comment
   */
  const reopenComment = useCallback(
    async (id: string) => {
      updateComment(id, {
        resolutionStatus: CommentResolutionStatus.OPEN,
        resolvedBy: undefined,
      });
    },
    [updateComment],
  );

  /**
   * Refetch comments
   */
  const refetch = useCallback(() => {
    invalidate({
      resource: 'documentComments',
      invalidates: ['list'],
    });
  }, [invalidate]);

  return {
    comments,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createComment,
    updateComment,
    deleteComment,
    resolveComment,
    reopenComment,
    refetch,
  };
}
