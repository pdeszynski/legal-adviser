'use client';

import React from 'react';
import { useList } from '@refinedev/core';

export default function AdminAuditLogsPage() {
  const { query, result } = useList({
    resource: 'audit_logs',
    pagination: { pageSize: 20 },
    sorters: [{ field: 'timestamp', order: 'desc' }],
  });

  const { data, isLoading } = query;
  const logs = result?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">System activity and user actions</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading audit logs...</div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Timestamp
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Action
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Resource Type
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Resource ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                      </td>
                      <td className="p-4 align-middle font-medium">
                        {log.userEmail || log.userId || '-'}
                      </td>
                      <td className="p-4 align-middle">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            log.action === 'CREATE'
                              ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                              : log.action === 'UPDATE'
                                ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                                : log.action === 'DELETE'
                                  ? 'bg-red-50 text-red-700 ring-red-600/20'
                                  : log.action === 'LOGIN'
                                    ? 'bg-green-50 text-green-700 ring-green-600/20'
                                    : 'bg-gray-50 text-gray-700 ring-gray-500/10'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 align-middle">{log.resourceType || '-'}</td>
                      <td className="p-4 align-middle font-mono text-xs">
                        {log.resourceId || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
