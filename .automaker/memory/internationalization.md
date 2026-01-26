---
tags: [internationalization]
summary: internationalization implementation decisions and patterns
relevantTo: [internationalization]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 9
  referenced: 4
  successfulFeatures: 4
---
# internationalization

#### [Pattern] Translation keys pre-populated in common.json for dashboard components despite incomplete feature implementation (2026-01-20)

- **Problem solved:** Dashboard feature appeared incomplete but translation infrastructure was already in place
- **Why this works:** Translation keys are typically added early in development cycle as part of i18n setup; decouples content from component implementation
- **Trade-offs:** Easier to add UI components later with existing i18n keys; requires translation file management discipline to avoid orphaned keys
