---
tags: [ui]
summary: ui implementation decisions and patterns
relevantTo: [ui]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 1
  referenced: 0
  successfulFeatures: 0
---
# ui

#### [Pattern] Clear filters button appears only when filters are active (conditional rendering based on filter state), providing visual feedback that filters are applied. (2026-01-14)
- **Problem solved:** Users need to know when filters are restricting results, and need a way to reset. Initial UX showed clear button always visible, which confused users about active filtering state.
- **Why this works:** Conditional rendering of clear button serves dual purpose: (1) indicates to user that filtering is active via button presence, (2) prevents accidental clicks when no filters exist. Reduces cognitive load - button absence = no filters applied.
- **Trade-offs:** Requires wiring filter state to button visibility (slightly more complex conditionals), but provides superior UX feedback. Could miss users who don't realize button exists if they never apply filters.

### Status-based conditional rendering for Edit/Regenerate buttons rather than separate component variants (2026-01-14)
- **Context:** Document detail view needs different action buttons depending on document status (DRAFT vs FAILED)
- **Why:** Simpler than creating separate component variants. Status is the single source of truth. Keeps all UI in one place for easier maintenance.
- **Rejected:** Component composition with separate EditActions/FailedActions components - would scatter logic and require prop drilling
- **Trade-offs:** Single component is easier to understand and modify but could get complex if many status-specific features are added. Current approach stays readable.
- **Breaking if changed:** Adding many more status-specific features would make this component too large - would then need to refactor into variants or composition.

### Color-coded badges for Actions and ResourceTypes (CREATE=green, UPDATE=blue, DELETE=red) rather than icon-only or text-only display (2026-01-20)
- **Context:** Audit table with many rows needs quick visual scanning to identify action patterns and resource types
- **Why:** Color coding + text is accessible (colorblind users can read text) while enabling pattern recognition. Icons alone would require legend lookup. Text alone is slower to scan
- **Rejected:** Icon-only indicators save space but fail accessibility. Text-only is accessible but slow to scan. Tooltip-revealed details hide critical info
- **Trade-offs:** Takes more horizontal space but improves scanning speed. Requires consistent color scheme across app to avoid confusion
- **Breaking if changed:** If color scheme changes or badges removed, developers lose at-a-glance action type understanding. Users with color vision deficiency would lose pattern recognition