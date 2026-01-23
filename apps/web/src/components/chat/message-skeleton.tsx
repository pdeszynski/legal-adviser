'use client';

import React from 'react';

/**
 * MessageSkeleton Component
 *
 * Displays a pulsing skeleton placeholder for an AI response message.
 * Matches the styling and positioning of the AI message bubbles in MessageList.
 */
export function MessageSkeleton() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100 animate-pulse">
        {/* Message Header Skeleton */}
        <div className="flex items-center gap-2 mb-2">
          {/* AI Icon */}
          <div className="w-4 h-4 bg-gray-300 rounded-full" />
          {/* "AI Assistant" text */}
          <div className="h-3 bg-gray-300 rounded w-20" />
          {/* Time placeholder */}
          <div className="h-3 bg-gray-300 rounded w-12 ml-auto" />
        </div>

        {/* Message Content Skeleton */}
        <div className="space-y-2">
          {/* Line 1 */}
          <div className="h-3 bg-gray-300 rounded w-full" />
          {/* Line 2 */}
          <div className="h-3 bg-gray-300 rounded w-11/12" />
          {/* Line 3 */}
          <div className="h-3 bg-gray-300 rounded w-10/12" />
          {/* Line 4 */}
          <div className="h-3 bg-gray-300 rounded w-9/12" />
        </div>

        {/* Citations Section Skeleton */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex gap-2">
            {/* Citation badges */}
            <div className="h-5 bg-gray-300 rounded w-6" />
            <div className="h-5 bg-gray-300 rounded w-6" />
            <div className="h-5 bg-gray-300 rounded w-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
