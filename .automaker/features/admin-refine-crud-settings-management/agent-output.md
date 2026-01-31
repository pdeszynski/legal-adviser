
🔧 Tool: Skill
Input: {
  "skill": "everything-claude-code:plan"
}
I'll explore the codebase to understand the existing admin settings page structure and create a comprehensive implementation plan.

🔧 Tool: Task
Input: {
  "description": "Explore admin settings codebase",
  "prompt": "Explore the codebase to understand the existing admin settings page implementation. I need to find:\n\n1. The current admin settings page at /admin/settings (frontend)\n2. The backend SystemSettings entity and any related resolvers\n3. Current patterns used for settings management (CRUD operations)\n4. How other Refine admin pages are implemented (for reference patterns)\n5. Any existing use of useForm, useEdit, or useCustom in the admin section\n\nPlease provide:\n- File paths and key code snippets for the settings page\n- Backend entity and resolver structure\n- Examples of similar Refine CRUD implementations in the codebase\n- Current GraphQL queries/mutations used for settings\n\nFocus on understanding what needs to be refactored to use Refine's standard patterns.",
  "subagent_type": "Explore"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/admin/settings/**"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/(authenticated)/admin/settings/page.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/hooks/use-system-settings*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/hooks/use-system-settings.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/system-settings*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/system-settings/system-settings.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/system-settings/entities/system-setting.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/graphql/queries/system-settings.graphql"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/graphql/mutations/system-settings.graphql"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/admin/users/page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/admin/users/page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/data-provider/index.ts"
}

🔧 Tool: Grep
Input: {
  "output_mode": "content",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/data-provider/index.ts",
  "pattern": "systemSettings|system_settings"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*edit*/**/*.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/(authenticated)/admin/users/edit/[id]/page.tsx"
}

🔧 Tool: Grep
Input: {
  "output_mode": "content",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/schema.gql",
  "pattern": "type SystemSetting|input SystemSettingInput"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/schema.gql",
  "limit": 50,
  "offset": 7440
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/system-settings/dto/system-setting.dto.ts"
}

🔧 Tool: Grep
Input: {
  "output_mode": "content",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/generated/graphql.ts",
  "pattern": "SystemSetting|SettingCategory|SettingValueType"
}
Let me read the current implementation files to get a complete picture before creating the plan.

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/(authenticated)/admin/settings/page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/system-settings/system-settings.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/providers/data-provider/index.ts"
}
Now let me also read the useSystemSettings hook to understand the current implementation:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/hooks/use-system-settings.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/system-settings/entities/system-setting.entity.ts"
}
Let me also look at how similar Refine admin pages are implemented to understand the patterns I should follow:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/app/admin/users/page.tsx"
}
Now I have a comprehensive understanding. Let me create a detailed implementation plan.

---

# Implementation Plan: Refactor Admin Settings Page to Use Refine Standard Patterns

## Requirements Restatement

Refactor the admin system settings page (`/admin/settings`) to use Refine's standard hooks (`useList`, `useUpdate`, `useCustomMutation`) instead of the current custom `useSystemSettings` hook and manual form handling. The backend already has proper GraphQL mutations (`bulkUpsertSystemSettings`), so we need to:

1. Add `systemSettings` resource to the data provider
2. Replace the custom hook pattern with Refine's standard hooks
3. Use Refine's form patterns for settings management
4. Maintain the existing tabbed interface and functionality

## Current State Analysis

**Current Implementation Issues:**
- Uses custom `useSystemSettings` hook with manual `fetch()` calls
- Manual form value extraction via `document.getElementById()`
- Custom state management for loading, errors, success
- Not integrated with Refine's data provider

**Backend Assets (Already Available):**
- `SystemSetting` entity with nestjs-query decorators
- `systemSettings` query returning all settings
- `systemSettingsByCategory` query for filtered results
- `bulkUpsertSystemSettings` mutation for bulk updates
- Proper admin guards in place

**Existing Refine Patterns in Codebase:**
- Users page uses `useList` with filters, sorters, pagination
- Data provider implements `getList`, `getOne`, `create`, `update`, `deleteOne`, `custom`
- Custom mutations via `dataProvider.custom()` with `GraphQLMutationConfig`

## Implementation Phases

### Phase 1: Add SystemSettings to Data Provider

**File:** `apps/web/src/providers/data-provider/index.ts`

Add `systemSettings` resource to the `getList` method:
- Implement `getList` to fetch all settings via `systemSettings` query
- Support filtering by category (for tab-based filtering)
- Add `getOne` for single setting lookup
- Add `update` method for single setting updates
- Use the existing `custom` method for `bulkUpsertSystemSettings` mutation

### Phase 2: Create Settings Types

**File:** `apps/web/src/hooks/use-system-settings-refined.ts` (NEW)

Create a new hook that leverages Refine patterns:
- Use `useList` for fetching settings by category
- Use `useCustomMutation` for bulk updates
- Provide typed helpers for getting/setting values
- Maintain backward-compatible API for migration

### Phase 3: Refactor Settings Page

**File:** `apps/web/src/app/(authenticated)/admin/settings/page.tsx`

Replace the current implementation:
- Import and use the new Refine-based hook
- Replace `document.getElementById()` with controlled form state using `useState`
- Use Refine's mutation states (`isLoading`, `isSuccess`) instead of custom state
- Integrate with Refine's notification system (if available)
- Keep the tabbed interface structure

### Phase 4: Cleanup (Optional)

**File:** `apps/web/src/hooks/use-system-settings.ts`

- Deprecate the old hook after migration is complete
- Add deprecation notice pointing to new hook
- Can be removed once all consumers migrate

## Dependencies

**Required:**
- Refine core hooks (`useList`, `useCustomMutation`)
- Data provider with `systemSettings` resource
- Existing GraphQL queries/mutations

**Optional:**
- Refine's notification system for success/error messages

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Breaking existing settings functionality | HIGH | Keep old hook alongside new one for gradual migration |
| CSRF token handling for mutations | MEDIUM | Data provider already includes CSRF headers |
| Type mismatches with generated types | LOW | Run `pnpm codegen` after any GraphQL changes |
| Form state complexity with many settings | LOW | Use React state with controlled components |

## Estimated Complexity: **MEDIUM**

- **Phase 1 (Data Provider)**: 30-45 min
- **Phase 2 (New Hook)**: 30-45 min
- **Phase 3 (Page Refactor)**: 45-60 min
- **Phase 4 (Cleanup)**: 15 min
- **Testing**: 30 min

**Total: 2-3 hours**

---

## WAITING FOR CONFIRMATION

This plan will:
1. ✅ Add `systemSettings` to the data provider for standard Refine CRUD operations
2. ✅ Create a Refine-based hook using `useList` and `useCustomMutation`
3. ✅ Refactor the settings page to use controlled forms and Refine patterns
4. ✅ Keep the existing tabbed interface and functionality

**Proceed with this plan?** (yes/no/modify)