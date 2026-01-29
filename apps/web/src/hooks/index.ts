export { useDocumentProgress } from './useDocumentProgress';
export type {
  DocumentProgressEvent,
  ConnectionState,
  UseDocumentProgressReturn,
} from './useDocumentProgress';

export { useNotifications } from './useNotifications';
export type {
  UseNotificationsReturn,
  InAppNotification,
  InAppNotificationType,
} from './useNotifications';

export { useIsAdmin } from './use-is-admin';

export { useCollaboration } from './use-collaboration';
export type {
  UserCursor,
  DocumentOperation,
  CollaborationState,
  CollaborationActions,
} from './use-collaboration';

export { useDocumentComments, CommentResolutionStatus } from './use-document-comments';
export type {
  DocumentComment,
  CommentPosition,
  CreateCommentInput,
  UpdateCommentInput,
  UseDocumentCommentsReturn,
} from './use-document-comments';

export { useSystemSettings } from './use-system-settings';
export type { SystemSetting, UseSystemSettingsReturn } from './use-system-settings';

export { useFormSubmission, getMutationLoadingState } from './use-form-submission';
export type { UseFormSubmissionOptions, UseFormSubmissionReturn } from './use-form-submission';

export { useQueryErrors, hasDataProviderErrors, getDataProviderErrors } from './use-query-errors';
export type { QueryErrorsResult } from './use-query-errors';

export { useTableWithSkeleton } from './use-table-with-skeleton';
export type {
  UseTableWithSkeletonProps,
  UseTableWithSkeletonResult,
} from './use-table-with-skeleton';

export { useFormWithSkeleton } from './use-form-with-skeleton';
export type { UseFormWithSkeletonProps, UseFormWithSkeletonResult } from './use-form-with-skeleton';

export { useUserRole } from './use-user-role';
export type { UserRole, UseUserRoleReturn } from './use-user-role';

export { useDocumentMonitoring } from './use-document-monitoring';
export type {
  DocumentQueueMetrics,
  DocumentActivityEntry,
  RecentDocumentActivity,
  UseDocumentMonitoringReturn,
} from './use-document-monitoring';

export { useDeleteChatSession } from './use-delete-chat-session';
export type { DeleteChatSessionOptions } from './use-delete-chat-session';
