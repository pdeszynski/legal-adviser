# Quickstart

## Prerequisites

- Node.js 20+
- Python 3.11+, UV for virtualenv
- Docker & Docker Compose
- pnpm

## Setup

1.  **Install dependencies**:

    ```bash
    pnpm install
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env` in root and applications.

3.  **Start Infrastructure** (Postgres, maybe Redis):

    ```bash
    docker-compose up -d
    ```

4.  **Run Development Servers**:
    ```bash
    # Run all apps (Web, Backend, AI Engine)
    pnpm dev
    ```

## Development Workflow

### Frontend (Web)

Located in `apps/web`.

- access: `http://localhost:3000`

### Backend (Nest.js)

Located in `apps/backend`.

- API: `http://localhost:4000/graphql`

### AI Engine (Python)

Located in `apps/ai-engine`.

- Docs: `http://localhost:8000/docs`

## Default Login Credentials

After running database seeds, use these credentials to log in:

| Email                | Password      | Role         |
| -------------------- | ------------- | ------------ |
| `admin@refine.dev`   | `password`    | Admin        |
| `lawyer@example.com` | `password123` | Lawyer       |
| `user@example.com`   | `password123` | Regular User |

To seed the database:

```bash
cd apps/backend
pnpm seed
```

**Note:** These are development credentials only.
