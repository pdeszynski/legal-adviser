---
description: 'Task list for Core Legal AI Features implementation'
---

# Tasks: Core Legal AI Features

**Input**: Design documents from `/specs/002-legal-ai-core/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md

**Tests**:

- **Reference**: See `constitution.md#quality-assurance` and specific app `README.md` files for authoritative test commands.
- **Backend Standard**: `npm run test` (verify in `package.json`)
- **AI Engine Standard**: `uv run pytest` (verify in `pyproject.toml`/`README.md`)
- Note: Extensive test coverage is OPTIONAL for this MVP, but critical paths should be verified.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.
**Package Manager**: pnpm, uv, turborepo, DO NOT use PIP, NPM, YARN

**Architecture notes**:

- Backend: Modular Monolith structure (nestjs-query, event-driven)
- AI Engine: LangGraph + PydanticAI, DO NOT use LangChain or API calls to openai/alternatives directly
- Frontend: Next.js + Refine (use existing components)
- Verify tests fail before implementing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions
- Each user story should be independently completable and testable

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
- [x] T006a [P] Configure Jest in `apps/backend` for separate test suites: `unit` (co-located), `integration`, and `e2e` (in `tests/` folder)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Setup Postgres database and TypeORM/Prisma/MikroORM (per choice) in `apps/backend`
- [x] T008 [P] Implement base Authentication framework in `apps/backend` and `apps/web`
- [x] T009 [P] Setup Basic AI Service API (FastAPI) and Client Generation in `apps/backend`
- [x] T010 [P] Setup EventEmitter2 module (`@nestjs/event-emitter`) in `apps/backend/src/shared/events`
- [x] T011 [P] Setup Redis and Bull queue module (`@nestjs/bull`) in `apps/backend/src/shared/queues`
- [x] T012 [P] Configure i18n structure in `apps/web` (react-i18next)
- [x] T013 Define User and Session entities in `apps/backend/src/modules/users`

### Implementation Notes for Event-Driven Architecture

**T010 - EventEmitter2 Setup**:

- Install: `npm install --save @nestjs/event-emitter eventemitter2`
- Import `EventEmitterModule.forRoot()` in `AppModule`
- Create base event classes in `apps/backend/src/shared/events/base/`
- Create event naming conventions (e.g., `domain.entity.action`)
- Document event patterns for inter-module communication
- **Purpose**: Enable synchronous event-driven communication between modules without direct imports

**T011 - Bull Queue Setup**:

- Install: `npm install --save @nestjs/bull bull` and `npm install --save-dev @types/bull`
- Setup Redis connection (local/Docker for dev, managed for prod)
- Import `BullModule.forRoot()` in `AppModule` with Redis config
- Create queue registration helper in `apps/backend/src/shared/queues/`
- Define base processor patterns and job interfaces
- Setup Bull Board (optional) for queue monitoring in development
- **Purpose**: Enable asynchronous task processing (AI document generation, PDF exports, email notifications)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - AI Document Generation (Priority: P1) 🎯 MVP

**Goal**: Users utilize the system to generate legal documents draft from natural language descriptions.

**Independent Test**: Input a "debt recovery" scenario -> Receive a formatted lawsuit PDF.

### Implementation for User Story 1

- [x] T014 [US1] Create `LegalDocument` entity in `apps/backend/src/modules/documents/entities/legal-document.entity.ts`
- [x] T015 [US1] Implement `DocumentService` CRUD in `apps/backend/src/modules/documents/services/documents.service.ts`
- [x] T016 [US1] Implement AI Graph for Drafting in `apps/ai-engine/src/graphs/drafting_graph.py`
- [ ] T017 [US1] Create API endpoint `POST /api/documents/generate` in `apps/backend/src/modules/documents/documents.controller.ts`
- [ ] T018 [US1] Implement Document Generation Form in `apps/web/src/pages/documents/create.tsx`
- [ ] T019 [US1] Implement Streaming Response Handler in `apps/web/src/components/chat/StreamingViewer.tsx`
- [ ] T020 [US1] Implement PDF Export functionality in `apps/backend/src/modules/documents/services/pdf-export.service.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Legal Q&A Assistant (Priority: P1)

**Goal**: Users ask legal questions and receive accurate, cited answers.

**Independent Test**: Ask "statute of limitations for debt" -> Receive answer with Civil Code citation.

### Implementation for User Story 2

- [ ] T021 [US2] Create `LegalQuery` entity in `apps/backend/src/modules/chat/entities/legal-query.entity.ts`
- [ ] T022 [P] [US2] Implement Q&A Agent with RAG in `apps/ai-engine/src/agents/qa_agent.py`
- [ ] T022a [P] [US2] Integrate External Legal Search Sources (e.g. SAOS, ISAP) for RAG Context (FR-008) in `apps/ai-engine/src/tools/legal_search.py`
- [ ] T023 [US2] Create Chat Controller endpoints in `apps/backend/src/modules/chat/chat.controller.ts`
- [ ] T024 [US2] Implement Chat Interface in `apps/web/src/components/chat/ChatWindow.tsx`
- [ ] T025 [P] [US2] Implement Session Mode Toggle (Pro/Simple) in `apps/web/src/components/layout/ModeSwitcher.tsx`
- [ ] T025a [US2] Implement UI Mode Differences: "Simple" hides complex citations/jargon, "Pro" validates full legal basis

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Case Law Search & Analysis (Priority: P2)

**Goal**: Users search for court rulings relevant to their case.

**Independent Test**: Search "mobbing" -> List of Supreme Court rulings appears.

### Implementation for User Story 3

- [ ] T026 [US3] Create `LegalRuling` entity/schema in `apps/backend/src/modules/search/entities/legal-ruling.entity.ts`
- [ ] T027 [US3] Implement Search Service (mock/external integration) in `apps/backend/src/modules/search/services/search.service.ts`
- [ ] T028 [US3] Create Search Page UI in `apps/web/src/pages/search/list.tsx`
- [ ] T029 [US3] Implement Ruling Detail View in `apps/web/src/pages/search/show.tsx`

---

## Phase 6: Identification of Legal Grounds (Priority: P2)

**Goal**: System identifies potential legal bases from situation description.

**Independent Test**: Input "neighbour noise" -> Suggest "immissions" (Civil Code).

### Implementation for User Story 4

- [ ] T030 [US4] Update AI Agent for Classification in `apps/ai-engine/src/agents/classifier_agent.py`
- [ ] T031 [US4] Add "Analyze Case" flow in `apps/web/src/pages/analysis/new.tsx`
- [ ] T032 [US4] Display Legal Basis suggestions in `apps/web/src/components/analysis/AnalysisResult.tsx`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T033 [P] Implement legal disclaimers (Start Modal + Footer) in `apps/web/src/components/common/Disclaimer.tsx`
- [ ] T034 [P] Ensure all AI prompts are strictly Polish in `apps/ai-engine/src/prompts/`
- [ ] T035 Security hardening (Input validation, Rate limiting)
- [ ] T036 Documentation updates in `docs/`
- [ ] T037 [P] Implement Audit Logging using Refine.dev AuditLogProvider (backed by `apps/backend/src/modules/audit`) (FR-009)

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
