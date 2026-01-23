I'll implement the skeleton loading feature for dashboard widgets. Let me start by exploring the codebase to understand the existing structure.

🔧 Tool: Task
Input: {
  "description": "Explore dashboard structure",
  "prompt": "Explore the dashboard implementation in this codebase. I need to understand:\n\n1. Where is the dashboard page located?\n2. What widgets/components are used on the dashboard (document count cards, activity timeline, notification bell, statistics charts)?\n3. Are there any existing skeleton loading components or patterns in use?\n4. How is data currently loaded and displayed on the dashboard?\n\nSearch thoroughly in:\n- apps/web/src/app/(authenticated)/dashboard/\n- apps/web/src/components/ related to dashboard\n- Any existing skeleton or loading components\n\nProvide a detailed overview of the dashboard structure and any existing loading patterns.",
  "subagent_type": "Explore"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/(authenticated)/dashboard/page.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/components/dashboard/**/*.{tsx,ts}"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/dashboard/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/dashboard/StatCard.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/dashboard/ActivityTimeline.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/dashboard/ActivityItem.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/dashboard/NotificationBell.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/skeleton*.{tsx,ts}"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*skeleton*.{tsx,ts}"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/ui/skeleton.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/components/ui/skeleton.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "find /Users/piteer/workspace/radca-prawny/legal/apps/web/src -name \"skeleton.tsx\" -type f",
  "description": "Find skeleton.tsx files"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/piteer/workspace/radca-prawny/legal/apps/web/src/*/components/ui/skeleton.tsx",
  "description": "List skeleton.tsx files"
}

🔧 Tool: Bash
Input: {
  "command": "find /Users/piteer/workspace/radca-prawny/legal/apps/web/src -name \"skeleton.tsx\" | head -20",
  "description": "Find skeleton.tsx files in web/src"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/ui/skeleton.tsx",
  "description": "Check if skeleton.tsx exists in components/ui"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/chat/message-skeleton.tsx"
}

🔧 Tool: Grep
Input: {
  "output_mode": "files_with_matches",
  "path": "apps/backend/src",
  "pattern": "dashboard"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/analytics/analytics.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/menu/index.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/**/*.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/skeleton/TableSkeleton.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/piteer/workspace/radca-prawny/legal/apps/web/src/*/components/ui/ | head -20",
  "description": "List UI components"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/*/components/ui/skeleton.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/layout/header.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/useNotifications*.{ts,tsx}"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/hooks/useNotifications.ts"
}
Now let me read the key files to understand the current implementation better:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/(authenticated)/dashboard/page.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/components/dashboard/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/skeleton/TableSkeleton.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/dashboard/StatCard.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/dashboard/ActivityTimeline.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/dashboard/NotificationBell.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/dashboard/index.ts"
}
Now let me check the existing skeleton component and see how it's structured:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/ui/skeleton.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/dashboard/ActivityItem.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/**/skeleton.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/packages/ui/components/skeleton.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/packages/**/*"
}

🔧 Tool: Bash
Input: {
  "command": "find /Users/piteer/workspace/radca-prawny/legal/apps/web/src -name \"skeleton.tsx\" 2>/dev/null",
  "description": "Find skeleton.tsx file"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/piteer/workspace/radca-prawny/legal/apps/web/src/*/components/ui/skeleton.tsx 2>/dev/null || head -5 /Users/piteer/workspace/radca-prawny/legal/apps/web/src/*/components/ui/skeleton.tsx",
  "description": "Read skeleton.tsx via ls"
}

🔧 Tool: Bash
Input: {
  "command": "cat /Users/piteer/workspace/radca-prawny/legal/apps/web/src/\\*/components/ui/skeleton.tsx",
  "description": "Read skeleton.tsx content"
}
Now I understand the structure. Let me create a todo list and implement the skeleton components for the dashboard:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create DashboardSkeleton component for stat cards",
      "status": "in_progress",
      "activeForm": "Creating dashboard skeleton components"
    },
    {
      "content": "Create ActivityTimelineSkeleton component",
      "status": "pending",
      "activeForm": "Creating activity timeline skeleton"
    },
    {
      "content": "Create RecentDocumentsSkeleton component",
      "status": "pending",
      "activeForm": "Creating recent documents skeleton"
    },
    {
      "content": "Update dashboard page to use skeleton components",
      "status": "pending",
      "activeForm": "Updating dashboard page"
    },
    {
      "content": "Update ActivityTimeline to use skeleton",
      "status": "pending",
      "activeForm": "Updating ActivityTimeline component"
    },
    {
      "content": "Update StatCard to use skeleton",
      "status": "pending",
      "activeForm": "Updating StatCard component"
    },
    {
      "content": "Update NotificationBell to use skeleton",
      "status": "pending",
      "activeForm": "Updating NotificationBell component"
    },
    {
      "content": "Export skeleton components from index",
      "status": "pending",
      "activeForm": "Exporting skeleton components"
    },
    {
      "content": "Verify implementation with Playwright",
      "status": "pending",
      "activeForm": "Verifying with Playwright"
    }
  ]
}
Now let me create the dashboard skeleton components. First, I'll create a comprehensive skeleton file:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/dashboard/DashboardSkeleton.tsx",
  "content": "import React from \"react\";\nimport { Skeleton } from \"@/*/components/ui/skeleton\";\nimport { Card, CardContent, CardHeader } from \"@legal/ui\";\n\n/**\n * Skeleton loader for individual stat cards.\n * Matches the layout of the stat cards in the mini stats row.\n */\nexport const StatCardSkeleton: React.FC = () => {\n  return (\n    <div className=\"p-4 rounded-xl border border-border bg-card\">\n      <Skeleton className=\"h-4 w-20 mb-2\" />\n      <Skeleton className=\"h-8 w-16\" />\n    </div>\n  );\n};\n\n/**\n * Skeleton loader for the stats row containing 4 stat cards.\n */\nexport const StatsRowSkeleton: React.FC = () => {\n  return (\n    <div className=\"grid grid-cols-2 sm:grid-cols-4 gap-4\">\n      <StatCardSkeleton />\n      <StatCardSkeleton />\n      <StatCardSkeleton />\n      <StatCardSkeleton />\n    </div>\n  );\n};\n\n/**\n * Skeleton loader for individual activity items in the timeline.\n * Matches the layout of ActivityItem components.\n */\nexport const ActivityItemSkeleton: React.FC = () => {\n  return (\n    <div className=\"flex items-start gap-3 p-3\">\n      {/* Icon placeholder */}\n      <Skeleton className=\"h-8 w-8 rounded-full flex-shrink-0\" />\n      {/* Content placeholder */}\n      <div className=\"flex-1 min-w-0 space-y-2\">\n        <Skeleton className=\"h-4 w-full max-w-[200px]\" />\n        <Skeleton className=\"h-3 w-24\" />\n      </div>\n    </div>\n  );\n};\n\n/**\n * Skeleton loader for the activity timeline card.\n * Shows a configurable number of activity item skeletons.\n */\nexport const ActivityTimelineSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {\n  return (\n    <Card>\n      <CardHeader>\n        <Skeleton className=\"h-6 w-32\" />\n      </CardHeader>\n      <CardContent>\n        <div className=\"space-y-1\">\n          {Array.from({ length: count }).map((_, i) => (\n            <ActivityItemSkeleton key={i} />\n          ))}\n        </div>\n      </CardContent>\n    </Card>\n  );\n};\n\n/**\n * Skeleton loader for individual document list items.\n * Matches the layout of document items in the recent documents list.\n */\nexport const DocumentItemSkeleton: React.FC = () => {\n  return (\n    <div className=\"flex items-center justify-between p-4\">\n      <div className=\"flex items-center gap-4\">\n        {/* File icon placeholder */}\n        <Skeleton className=\"h-10 w-10 rounded-lg\" />\n        {/* Document info placeholder */}\n        <div className=\"space-y-2\">\n          <Skeleton className=\"h-5 w-48\" />\n          <Skeleton className=\"h-3 w-32\" />\n        </div>\n      </div>\n      {/* Status badge placeholder */}\n      <Skeleton className=\"h-6 w-16 rounded-full\" />\n    </div>\n  );\n};\n\n/**\n * Skeleton loader for the recent documents list.\n * Shows a configurable number of document item skeletons.\n */\nexport const RecentDocumentsSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {\n  return (\n    <div className=\"rounded-xl border border-border bg-card overflow-hidden\">\n      {/* Header */}\n      <div className=\"p-6 border-b border-border flex justify-between items-center\">\n        <Skeleton className=\"h-6 w-40\" />\n        <Skeleton className=\"h-4 w-16\" />\n      </div>\n      {/* Document list */}\n      <div className=\"divide-y divide-border\">\n        {Array.from({ length: count }).map((_, i) => (\n          <DocumentItemSkeleton key={i} />\n        ))}\n      </div>\n    </div>\n  );\n};\n\n/**\n * Skeleton loader for action cards in the main actions grid.\n * Matches the layout of the Create Document, Legal Q&A, and Browse Cases cards.\n */\nexport const ActionCardSkeleton: React.FC = () => {\n  return (\n    <div className=\"rounded-xl border border-border bg-card p-6\">\n      {/* Icon placeholder */}\n      <Skeleton className=\"h-12 w-12 rounded-lg mb-4\" />\n      {/* Title placeholder */}\n      <Skeleton className=\"h-6 w-32 mb-2\" />\n      {/* Description placeholder */}\n      <Skeleton className=\"h-4 w-full mb-1\" />\n      <Skeleton className=\"h-4 w-3/4 mb-4\" />\n      {/* Action link placeholder */}\n      <Skeleton className=\"h-5 w-24\" />\n    </div>\n  );\n};\n\n/**\n * Skeleton loader for the main actions grid.\n * Shows 3 action card skeletons.\n */\nexport const ActionsGridSkeleton: React.FC = () => {\n  return (\n    <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">\n      <ActionCardSkeleton />\n      <ActionCardSkeleton />\n      <ActionCardSkeleton />\n    </div>\n  );\n};\n\n/**\n * Skeleton loader for the hero section.\n * Matches the layout of the welcome banner.\n */\nexport const HeroSectionSkeleton: React.FC = () => {\n  return (\n    <div className=\"bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 rounded-2xl border border-primary/10\">\n      <Skeleton className=\"h-10 w-64 mb-2\" />\n      <Skeleton className=\"h-6 w-full max-w-2xl\" />\n    </div>\n  );\n};\n\n/**\n * Complete dashboard skeleton loader.\n * Shows all dashboard sections in loading state.\n */\nexport const DashboardSkeleton: React.FC = () => {\n  return (\n    <div className=\"container mx-auto py-8 px-4 space-y-8\">\n      <HeroSectionSkeleton />\n      <ActionsGridSkeleton />\n      <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-8\">\n        <div className=\"lg:col-span-2 space-y-8\">\n          <StatsRowSkeleton />\n          <RecentDocumentsSkeleton count={5} />\n        </div>\n        <div className=\"space-y-6\">\n          <ActivityTimelineSkeleton count={5} />\n        </div>\n      </div>\n    </div>\n  );\n};\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Creating dashboard skeleton components",
      "content": "Create DashboardSkeleton component for stat cards",
      "status": "completed"
    },
    {
      "activeForm": "Creating activity timeline skeleton",
      "content": "Create ActivityTimelineSkeleton component",
      "status": "completed"
    },
    {
      "activeForm": "Creating recent documents skeleton",
      "content": "Create RecentDocumentsSkeleton component",
      "status": "completed"
    },
    {
      "activeForm": "Updating dashboard page",
      "content": "Update dashboard page to use skeleton components",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating ActivityTimeline component",
      "content": "Update ActivityTimeline to use skeleton",
      "status": "pending"
    },
    {
      "activeForm": "Updating StatCard component",
      "content": "Update StatCard to use skeleton",
      "status": "pending"
    },
    {
      "activeForm": "Updating NotificationBell component",
      "content": "Update NotificationBell to use skeleton",
      "status": "pending"
    },
    {
      "activeForm": "Exporting skeleton components",
      "content": "Export skeleton components from index",
      "status": "pending"
    },
    {
      "activeForm": "Verifying with Playwright",
      "content": "Verify implementation with Playwright",
      "status": "pending"
    }
  ]
}
Now let me update the dashboard page to use the skeleton components:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/(authenticated)/dashboard/page.tsx",
  "old_string": "import { useTranslate, useList, useGetIdentity } from '@refinedev/core';\nimport Link from 'next/link';\nimport { useMemo } from 'react';\nimport { StatCard, ActivityTimeline } from '@/components/dashboard';\nimport { Plus, MessageSquare, FileText, Search, ArrowRight } from 'lucide-react';\nimport { cn } from '@legal/ui';",
  "new_string": "import { useTranslate, useList, useGetIdentity } from '@refinedev/core';\nimport Link from 'next/link';\nimport { useMemo } from 'react';\nimport { StatCard, ActivityTimeline } from '@/components/dashboard';\nimport {\n  StatsRowSkeleton,\n  RecentDocumentsSkeleton,\n  ActivityTimelineSkeleton,\n} from '@/components/dashboard/DashboardSkeleton';\nimport { Plus, MessageSquare, FileText, Search, ArrowRight } from 'lucide-react';\nimport { cn } from '@legal/ui';"
}
