"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@legal/ui";
import { ActivityItem } from "./ActivityItem";
import { useTranslate } from "@refinedev/core";
import Link from "next/link";

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  author?: {
    name?: string;
    email?: string;
  };
  createdAt: string;
  meta?: Record<string, unknown>;
}

interface ActivityTimelineProps {
  activities: AuditLog[];
  loading?: boolean;
  maxItems?: number;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  loading = false,
  maxItems = 5,
}) => {
  const translate = useTranslate();
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {translate("dashboard.activity.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            {translate("loading")}
          </div>
        ) : displayedActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {translate("dashboard.activity.noActivity")}
          </div>
        ) : (
          <div className="space-y-1">
            {displayedActivities.map((activity) => (
              <ActivityItem
                key={activity.id}
                id={activity.id}
                action={activity.action}
                resourceType={activity.resource}
                resourceId={activity.resourceId}
                userName={activity.author?.name || activity.author?.email}
                timestamp={activity.createdAt}
                metadata={activity.meta}
              />
            ))}
          </div>
        )}
        {displayedActivities.length > 0 && activities.length > maxItems && (
          <div className="mt-4 text-center">
            <Link
              href="/audit-logs"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {translate("dashboard.activity.viewAll")} →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
