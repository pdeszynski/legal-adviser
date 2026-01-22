import React from 'react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the admin panel. Manage users and system settings here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Users</h3>
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              User statistics coming soon
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Active Sessions</h3>
              <span className="text-2xl">🔐</span>
            </div>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Session tracking coming soon
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Documents</h3>
              <span className="text-2xl">📄</span>
            </div>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Document statistics coming soon
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Queries</h3>
              <span className="text-2xl">💬</span>
            </div>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Query statistics coming soon
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">
              Quick Actions
            </h3>
            <p className="text-sm text-muted-foreground">
              Common admin tasks
            </p>
          </div>
          <div className="p-6 pt-0 space-y-2">
            <a
              href="/admin/analytics"
              className="block w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              View Analytics Dashboard
            </a>
            <a
              href="/admin/users"
              className="block w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Manage Users
            </a>
            <a
              href="/admin/audit-logs"
              className="block w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              View Audit Logs
            </a>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">
              System Information
            </h3>
            <p className="text-sm text-muted-foreground">
              Platform details
            </p>
          </div>
          <div className="p-6 pt-0">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Environment:</dt>
                <dd className="font-medium">Development</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Version:</dt>
                <dd className="font-medium">1.0.0</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Role:</dt>
                <dd className="font-medium">Admin</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
