import React from "react";
import { Card, CardContent } from "@legal/ui";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  loading?: boolean;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  loading = false,
  iconColor = "text-blue-600",
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div className={`w-8 h-8 ${iconColor}`}>{icon}</div>
        </div>
        {loading ? (
          <div className="text-2xl font-bold text-gray-400">...</div>
        ) : (
          <div className="text-3xl font-bold text-gray-900">{value}</div>
        )}
      </CardContent>
    </Card>
  );
};
