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

#### [Gotcha] NotificationBell positioned in header requires careful spacing relative to existing UI elements (language selector, profile menu) (2026-01-20)
- **Situation:** Adding new component to constrained header layout without redesign
- **Root cause:** Header space is limited; icon position affects accessibility and visual balance. Placement between language selector and profile menu uses natural reading order
- **How to avoid:** Consistent with header pattern but adds another icon; users need clear affordance that it's interactive

### Status-based access control: only DRAFT documents can be edited, enforced at UI level with error page for non-DRAFT (2026-01-20)
- **Context:** Documents have lifecycle status (DRAFT → GENERATING → COMPLETED). Need to prevent editing of finalized documents
- **Why:** Prevents users from modifying documents in states where they shouldn't be editable. Clear error message explains the business rule rather than silently hiding the feature
- **Rejected:** Could silently hide edit button only (confusing when accessed by URL). Could allow form loading then show error on save (wasted UX). Could have backend enforce this (correct but should also enforce at UI)
- **Trade-offs:** Extra validation logic at UI but provides better UX feedback. Requires agreement that business rule is immutable once status changes
- **Breaking if changed:** If status requirement changes (e.g., allowing edits on COMPLETED documents), this check needs updates in both UI and backend mutations

### Implemented permission level selector with descriptions in UI component rather than simple dropdown (2026-01-20)
- **Context:** Users need to understand what each permission level enables
- **Why:** Descriptions prevent wrong permission assignments (security through clarity); users might select EDIT thinking it includes ADMIN rights without explanation
- **Rejected:** Simple dropdown with just permission names (VIEW, COMMENT, EDIT, ADMIN) - unclear which level grants sharing rights
- **Trade-offs:** UI is more complex and verbose (+clarity, +prevents mistakes) but takes more screen space (-), slower initial render (-)
- **Breaking if changed:** Removing descriptions makes permission semantics ambiguous; users will likely misconfigure permissions without visual cues about hierarchy

### Approachable Professionalism (2026-01-23)
- **Context:** Legal applications often feel cold, intimidating, and overly complex "admin panels."
- **Decision:** Adopt a "Premium but Approachable" aesthetic. 
  - **Light/Dark Mode:** Support both, but default to a clean, soft Light mode (Slate 50 background) to reduce visual heaviness.
  - **Whitespace:** Use generous padding and whitespace to prevent information overload.
  - **Language:** ongoing effort to replace "Legalese" with plain language where possible in UI labels (e.g. "Start a Claim" vs "Draft Pleading").

### User-Centric Complexity Management (2026-01-23)
- **Context:** "Normal people" struggle with legal workflows that lawyers understand intuitively.
- **Decision:** 
  - **Wizards:** ALWAYS use multi-step wizards for complex creations (docs, lawsuits) instead of long forms.
  - **Elasticity:** Allow users to pause/resume or ask for help mid-flow. 
  - **Help Integration:** "Explain this" tooltips or side-panels must be available for complex fields.