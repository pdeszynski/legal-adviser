# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., TypeScript 5+ (Node.js 20+), Python 3.11+ or NEEDS CLARIFICATION]
**Primary Dependencies**:

- **Frontend**: [e.g., Next.js, Refine.dev, Shadcn UI, Tailwind CSS, GraphQL client]
- **Backend**: [e.g., Nest.js, `@ptc-org/nestjs-query-*` (Code-First GraphQL with auto-CRUD), TypeORM]
- **AI**: [e.g., FastAPI, PydanticAI, LangGraph]
  **Storage**: [e.g., PostgreSQL, Redis]
  **Testing**: [e.g., Jest, Pytest]
  **Target Platform**: [e.g., Docker/Cloud Container]
  **Project Type**: Monorepo (Turborepo)
  **Performance Goals**: [domain-specific, e.g., AI draft generation < 30s]
  **Constraints**:
- Domain Driven Design
- Modular Monolith (Strict boundaries, async events only)
- GraphQL-only for frontend-backend communication (nestjs-query Code-First)
- REST only for service-to-service (Backend ↔ AI Engine)
- English-first codebase
- Strong Typing (No `any`)
  **Scale/Scope**: [domain-specific, e.g., MVP of core features]

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (Empty - Code First)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/
├── web/                  # Next.js + Refine.dev frontend
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── providers/
├── backend/              # Nest.js Modular Monolith
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── [module-name]/ # Unit tests (.spec.ts) co-located here
│   │   └── shared/       # Shared kernel/infrastructure
│   └── tests/            # Tests outside specific modules
│       ├── integration/  # Integration tests
│       └── e2e/          # Use-case driven E2E tests
└── ai-engine/            # Python FastAPI AI Service
    ├── src/
    │   ├── main.py
    │   ├── agents/
    │   └── graphs/       # LangGraph definitions
    └── tests/
        ├── unit/         # Unit tests
        ├── integration/  # Integration tests
        └── e2e/          # End-to-end tests

packages/                 # Shared libraries (optional)
├── ui/                   # Shared UI components (shadcn)
├── types/                # Shared Types/DTOs
└── config/               # Shared ESLint/TSConfig
```

**Structure Decision**: Monorepo with three main applications.

- **Backend Testing**: Unit tests co-located (`.spec.ts`), Integration/E2E separated in `tests/`.
- **AI Testing**: Standard Python structure with `unit`, `integration`, `e2e` separation.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
