# Research & Decision Log

**Feature**: Core Legal AI Features (`002-legal-ai-core`)
**Status**: Resolved

## 1. Monorepo Tooling

**Context**: We need a monorepo tool to manage Next.js, Nest.js, and Python application in one repository.

**Options Strategy**:

1.  **Turborepo**: Fast, simple, great Next.js integration.
2.  **Nx**: Powerful, deep graph analysis, enforces boundaries (good for strict modular monoliths), specific support for Nest.js.
3.  **Lerna**: Legacy, generally superseded or used with Nx.

**Decision**: **Turborepo** (with `pnpm` workspaces).

**Rationale**:

- Turborepo is sufficient for orchestrating builds and tasks across polyglot apps (JS/TS + Python).
- It is less opinionated than Nx, allowing us to structure the Python app naturally without fighting Nx plugins.
- We can enforce modular monolith boundaries within the Nest.js app using strict import linting (ESLint `import/no-restricted-paths` or `sheriff`), which is lighter than Nx tags.

**Implications**:

- We will use `pnpm-workspace.yaml`.
- We need to configure `turbo.json` to handle Python scripts/tests as tasks.

## 2. Asynchronous Event Bus (Backend)

**Context**: Modules in the backend must communicate via async events.

**Options Strategy**:

1.  **In-Memory (`EventEmitter2`)**: Simple, zero infra, works perfectly for a monolith running in a single process.
2.  **Redis (Pub/Sub)**: External dependency, persistence possible, decouple deployment.
3.  **RabbitMQ/Kafka**: Heavy encoding, strictly coupled to infra.

**Decision**: **In-Memory (`@nestjs/event-emitter`)** initially.

**Rationale**:

- A "Modular Monolith" typically runs as a single deployment unit initially.
- In-memory events are truly asynchronous in Node.js event loop terms.
- Low operational overhead (no extra container needed for dev/test).
- Can be easily swapped for Redis later if modules are extracted to microservices.

**Implications**:

- We must wrap the event emitter in a `SharedModule` to ensure we don't accidentally couple modules.
- Events should be typed classes.

## 3. Internationalization (i18n)

**Context**: Frontend must support switching languages (Polish/English).

**Options Strategy**:

1.  **`next-i18next`**: Standard wrapper for Next.js.
2.  **`react-i18next`**: Direct usage, highly flexible.
3.  **Refine built-in**: Refine works with any provider.

**Decision**: **`react-i18next`** (directly or via `next-i18next` if using Next.js Pages router, but typically direct usage is better for App Router if used).
_Clarification_: Since we are using Next.js, we will use **`next-intl`** or **`react-i18next`** compatible with Server Components. Let's stick to **`react-i18next`** as it's the primary recommendation in Refine documentation for maximum compatibility.

**Rationale**:

- Refine has first-class example support for `react-i18next`.
- Mature ecosystem.

## 4. AI Service Integration

**Context**: Next.js/Nest.js needs to talk to Python AI service.

**Decision**: **HTTP REST (FastAPI) + Shared Types**.

**Rationale**:

- Simple contract.
- We can generate TypeScript clients from FastAPI OpenAPI specs using standard tools (`openapi-typescript-codegen`).
