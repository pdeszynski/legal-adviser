---
description: 'Task list for Core Legal AI Features implementation'
---

# Tasks: Core Legal AI Features

**Input**: Design documents from `/specs/002-legal-ai-core/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md

**Tests**: Tests are OPTIONAL for this feature (not explicitly requested yet), but manual verification steps are included.

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

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure (Monorepo)

- [x] T001 Create Turborepo monorepo structure with `apps/web`, `apps/backend`, `apps/ai-engine`
- [x] T002 Initialize `apps/web` (Next.js + Refine + Shadcn + Tailwind)
- [x] T003 Initialize `apps/backend` (Nest.js Modular Monolith structure)
- [x] T004 Initialize `apps/ai-engine` (Python + FastAPI)
- [x] T005 [P] Setup shared packages `packages/ui` and `packages/types`
- [x] T006 [P] Configure global linting (ESLint, Prettier) and Python linting (Ruff)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Setup Postgres database and TypeORM/Prisma/MikroORM (per choice) in `apps/backend`
- [ ] T008 [P] Implement base Authentication framework in `apps/backend` and `apps/web`
- [ ] T009 [P] Setup Basic AI Service API (FastAPI) and Client Generation in `apps/backend`
- [ ] T010 [P] Implement Event Bus module in `apps/backend/src/shared/event-bus`
- [ ] T011 [P] Configure i18n structure in `apps/web` (react-i18next)
- [ ] T012 Define User and Session entities in `apps/backend/src/modules/users`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - AI Document Generation (Priority: P1) 🎯 MVP

**Goal**: Users utilize the system to generate legal documents draft from natural language descriptions.

**Independent Test**: Input a "debt recovery" scenario -> Receive a formatted lawsuit PDF.

### Implementation for User Story 1

- [ ] T013 [US1] Create `LegalDocument` entity in `apps/backend/src/modules/documents/entities/legal-document.entity.ts`
- [ ] T014 [US1] Implement `DocumentService` CRUD in `apps/backend/src/modules/documents/services/documents.service.ts`
- [ ] T015 [US1] Implement AI Graph for Drafting in `apps/ai-engine/src/graphs/drafting_graph.py`
- [ ] T016 [US1] Create API endpoint `POST /api/documents/generate` in `apps/backend/src/modules/documents/documents.controller.ts`
- [ ] T017 [US1] Implement Document Generation Form in `apps/web/src/pages/documents/create.tsx`
- [ ] T018 [US1] Implement Streaming Response Handler in `apps/web/src/components/chat/StreamingViewer.tsx`
- [ ] T019 [US1] Implement PDF Export functionality in `apps/backend/src/modules/documents/services/pdf-export.service.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Legal Q&A Assistant (Priority: P1)

**Goal**: Users ask legal questions and receive accurate, cited answers.

**Independent Test**: Ask "statute of limitations for debt" -> Receive answer with Civil Code citation.

### Implementation for User Story 2

- [ ] T020 [US2] Create `LegalQuery` entity in `apps/backend/src/modules/chat/entities/legal-query.entity.ts`
- [ ] T021 [P] [US2] Implement Q&A Agent with RAG in `apps/ai-engine/src/agents/qa_agent.py`
- [ ] T022 [US2] Create Chat Controller endpoints in `apps/backend/src/modules/chat/chat.controller.ts`
- [ ] T023 [US2] Implement Chat Interface in `apps/web/src/components/chat/ChatWindow.tsx`
- [ ] T024 [P] [US2] Implement Session Mode Toggle (Pro/Simple) in `apps/web/src/components/layout/ModeSwitcher.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Case Law Search & Analysis (Priority: P2)

**Goal**: Users search for court rulings relevant to their case.

**Independent Test**: Search "mobbing" -> List of Supreme Court rulings appears.

### Implementation for User Story 3

- [ ] T025 [US3] Create `LegalRuling` entity/schema in `apps/backend/src/modules/search/entities/legal-ruling.entity.ts`
- [ ] T026 [US3] Implement Search Service (mock/external integration) in `apps/backend/src/modules/search/services/search.service.ts`
- [ ] T027 [US3] Create Search Page UI in `apps/web/src/pages/search/list.tsx`
- [ ] T028 [US3] Implement Ruling Detail View in `apps/web/src/pages/search/show.tsx`

---

## Phase 6: Identification of Legal Grounds (Priority: P2)

**Goal**: System identifies potential legal bases from situation description.

**Independent Test**: Input "neighbour noise" -> Suggest "immissions" (Civil Code).

### Implementation for User Story 4

- [ ] T029 [US4] Update AI Agent for Classification in `apps/ai-engine/src/agents/classifier_agent.py`
- [ ] T030 [US4] Add "Analyze Case" flow in `apps/web/src/pages/analysis/new.tsx`
- [ ] T031 [US4] Display Legal Basis suggestions in `apps/web/src/components/analysis/AnalysisResult.tsx`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T032 [P] Implement legal disclaimers (Start Modal + Footer) in `apps/web/src/components/common/Disclaimer.tsx`
- [ ] T033 [P] Ensure all AI prompts are strictly Polish in `apps/ai-engine/src/prompts/`
- [ ] T034 Security hardening (Input validation, Rate limiting)
- [ ] T035 Documentation updates in `docs/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1. Blocks all stories.
- **User Stories (Phase 3-6)**: Depend on Phase 2. Can run in parallel if resources allow, otherwise P1 -> P2.

### Parallel Opportunities

- AI Engine (Python) work can proceed parallel to Backend/Frontend once T004 is done.
- Frontend UI components (Phase 3, 4, 5) can be built parallel to Backend Services if API contracts are agreed (Code-First approach helps).
- T005, T006, T008, T009, T010, T011 in Setup/Foundational are parallelizable.

## Implementation Strategy

### MVP First (User Story 1 & 2)

1.  Complete Phase 1 & 2.
2.  Implement Document Generation (US1) - Core Value.
3.  Implement Legal Q&A (US2) - High Verification Value.
4.  **Demo MVP**.

### Incremental Delivery

1.  Add Case Law Search (US3).
2.  Add Legal Grounds Identification (US4).
3.  Polish and Release.
