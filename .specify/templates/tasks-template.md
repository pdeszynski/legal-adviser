---
description: 'Task list template for feature implementation'
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `apps/web/src/`
- **Backend**: `apps/backend/src/`
- **AI Engine**: `apps/ai-engine/src/`
- **Shared**: `packages/`

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure (Monorepo)

- [ ] T001 Create/Verify Turborepo monorepo structure
- [ ] T002 Initialize `apps/web` (Next.js + Refine + Shadcn + Tailwind) if new
- [ ] T003 Initialize `apps/backend` (Nest.js Modular Monolith) if new
- [ ] T004 Initialize `apps/ai-engine` (Python + FastAPI) if new
- [ ] T005 [P] Setup shared packages `packages/ui` and `packages/types`
- [ ] T006 [P] Configure global linting (ESLint, Prettier, Ruff)
- [ ] T006a [P] Configure Jest in `apps/backend` for separate test suites: `unit` (co-located), `integration`, and `e2e` (in `tests/` folder)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T007 Setup Postgres database and ORM (TypeORM/MikroORM) in `apps/backend`
- [ ] T008 [P] Implement base Authentication framework in `apps/backend` and `apps/web`
- [ ] T009 [P] Setup Basic AI Service API (FastAPI) and Client Generation
- [ ] T010 [P] Setup EventEmitter/Queue modules in `apps/backend`
- [ ] T011 Create base User and Session entities

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Implementation for User Story 1

- [ ] T012 [US1] Create [Entity] in `apps/backend/src/modules/[module]/entities/[entity].entity.ts`
- [ ] T013 [US1] Implement [Service] CRUD in `apps/backend/src/modules/[module]/services/[service].service.ts`
- [ ] T014 [US1] Implement AI Graph/Agent in `apps/ai-engine/src/[agents|graphs]/[name].py`
- [ ] T015 [US1] Create API endpoint `POST /api/[resource]` in `apps/backend/src/modules/[module]/[module].controller.ts`
- [ ] T016 [US1] Implement UI Page/Form in `apps/web/src/pages/[resource]/[action].tsx`
- [ ] T017 [US1] Implement UI Component in `apps/web/src/components/[name].tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Implementation for User Story 2

- [ ] T018 [US2] Create [Entity] in `apps/backend/src/modules/[module]/entities/[entity].entity.ts`
- [ ] T019 [US2] Implement [Service] logic in `apps/backend/src/modules/[module]/services/[service].service.ts`
- [ ] T020 [US2] Update AI Agent in `apps/ai-engine/src/agents/[name].py`
- [ ] T021 [US2] Add Frontend Integration in `apps/web/src/components/[name].tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Implement legal disclaimers/footers
- [ ] TXXX [P] Validate AI prompts (Polish language)
- [ ] TXXX Security hardening (Input validation, Rate limiting)
- [ ] TXXX Documentation updates in `docs/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1. Blocks all stories.
- **User Stories (Phase 3+)**: Depend on Phase 2. Can run in parallel if resources allow, otherwise P1 -> P2.

### Implementation Strategy

1.  Complete Phase 1 & 2 (Setup & Foundational).
2.  Implement User Story 1 (Core Value).
3.  Implement User Story 2 (High Verification Value).
4.  **Demo MVP**.
5.  Add subsequent stories incrementally.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Backend: Modular Monolith structure (nestjs-query, event-driven)
- Frontend: Next.js + Refine (use existing components)
- Stop at any checkpoint to validate story independently
