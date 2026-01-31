'use client';

import React, { useState } from 'react';
import { useList, useCustomMutation } from '@refinedev/core';

type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | null;

interface Document {
  id: string;
  title: string;
  contentRaw: string | null;
  moderationStatus: ModerationStatus;
  moderationReason: string | null;
  flaggedAt: string | null;
  createdAt: string;
  session?: {
    userId: string;
  };
}

export default function DocumentModerationPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>(
    'PENDING',
  );
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  const { query, result } = useList<Document>({
    resource: 'legalDocuments',
    pagination: { pageSize: 50 },
    sorters: [{ field: 'flaggedAt', order: 'asc' }],
    filters:
      statusFilter === 'all'
        ? []
        : [
            {
              field: 'moderationStatus',
              operator: 'eq',
              value: statusFilter,
            },
          ],
  });

  const { data, isLoading, refetch } = query;
  const { mutation: approveMutationResult, mutate: approveMutation } = useCustomMutation();
  const { mutation: rejectMutationResult, mutate: rejectMutation } = useCustomMutation();
  const isApproving = approveMutationResult.isPending;
  const isRejecting = rejectMutationResult.isPending;

  const documents = result?.data?.filter((d: Document) => d.moderationStatus) || [];

  const handleApprove = async () => {
    if (!selectedDoc) return;

    approveMutation(
      {
        url: '',
        method: 'post',
        values: {
          documentId: selectedDoc.id,
          reason: actionReason || null,
        },
        meta: {
          operation: 'approveDocument',
        },
      },
      {
        onSuccess: () => {
          refetch();
          setShowDialog(false);
          setSelectedDoc(null);
          setActionReason('');
          setPendingAction(null);
        },
      },
    );
  };

  const handleReject = async () => {
    if (!selectedDoc || !actionReason.trim()) return;

    rejectMutation(
      {
        url: '',
        method: 'post',
        values: {
          documentId: selectedDoc.id,
          reason: actionReason,
        },
        meta: {
          operation: 'rejectDocument',
        },
      },
      {
        onSuccess: () => {
          refetch();
          setShowDialog(false);
          setSelectedDoc(null);
          setActionReason('');
          setPendingAction(null);
        },
      },
    );
  };

  const openActionDialog = (doc: Document, action: 'approve' | 'reject') => {
    setSelectedDoc(doc);
    setPendingAction(action);
    setActionReason('');
    setShowDialog(true);
  };

  const getStatusBadge = (status: ModerationStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Moderation</h1>
          <p className="text-muted-foreground">Review and moderate flagged documents</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1.5 text-sm rounded-md ${statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md ${statusFilter === 'PENDING' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}
            onClick={() => setStatusFilter('PENDING')}
          >
            Pending
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md ${statusFilter === 'APPROVED' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}
            onClick={() => setStatusFilter('APPROVED')}
          >
            Approved
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md ${statusFilter === 'REJECTED' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}
            onClick={() => setStatusFilter('REJECTED')}
          >
            Rejected
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading documents...</div>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          No documents found for moderation
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc: Document) => (
            <div key={doc.id} className="rounded-xl border bg-card">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1 flex-1">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {doc.title}
                      {getStatusBadge(doc.moderationStatus)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Flagged: {doc.flaggedAt ? new Date(doc.flaggedAt).toLocaleString() : 'N/A'} |
                      Created: {new Date(doc.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {doc.moderationStatus === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        onClick={() => openActionDialog(doc, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                        onClick={() => openActionDialog(doc, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Document Content</label>
                    <div className="mt-2 p-4 bg-muted rounded-md max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">
                        {doc.contentRaw || 'No content available'}
                      </pre>
                    </div>
                  </div>
                  {doc.moderationReason && (
                    <div>
                      <label className="text-sm font-medium">Moderation Note</label>
                      <p className="mt-1 text-sm text-muted-foreground">{doc.moderationReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDialog && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDialog(false)} />
          <div className="relative bg-card rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-2">
              {pendingAction === 'approve' ? 'Approve Document' : 'Reject Document'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {pendingAction === 'approve'
                ? 'Approving this document will notify the owner. Optionally provide a reason.'
                : 'Rejecting this document will notify the owner. Please provide a reason for rejection.'}
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium">{selectedDoc.title}</label>
              </div>
              <div>
                <label htmlFor="reason" className="text-sm font-medium">
                  {pendingAction === 'approve' ? 'Reason (Optional)' : 'Reason (Required)'}
                </label>
                <textarea
                  id="reason"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={
                    pendingAction === 'approve'
                      ? 'Optional approval reason...'
                      : 'Required rejection reason...'
                  }
                  rows={3}
                  className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-sm bg-muted hover:bg-accent rounded-md"
                onClick={() => setShowDialog(false)}
              >
                Cancel
              </button>
              {pendingAction === 'approve' ? (
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {isApproving ? 'Approving...' : 'Approve'}
                </button>
              ) : (
                <button
                  onClick={handleReject}
                  disabled={isRejecting || !actionReason.trim()}
                  className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50"
                >
                  {isRejecting ? 'Rejecting...' : 'Reject'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
