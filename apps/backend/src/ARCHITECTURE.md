# Strict Layered Architecture

This backend follows a strict layered architecture with clear dependency rules and boundaries. The architecture is based on Domain-Driven Design (DDD) and Clean Architecture principles.

## Layer Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  (Controllers, Resolvers, REST DTOs, GraphQL DTOs)          │
│                                                             │
│  Responsibility: Handle HTTP/GraphQL requests               │
│  Location: /src/presentation                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ depends on
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  (Use Cases, Application Services, Application DTOs)        │
│                                                             │
│  Responsibility: Orchestrate domain logic, business flows   │
│  Location: /src/application                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ depends on
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                           │
│  (Aggregates, Entities, Value Objects, Domain Events,       │
│   Repository Interfaces, Domain Services)                   │
│                                                             │
│  Responsibility: Core business logic and rules              │
│  Location: /src/domain                                      │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ implements
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                      │
│  (Repository Implementations, ORM Entities, Mappers,        │
│   External API Clients, Message Queue Implementations)      │
│                                                             │
│  Responsibility: External concerns (DB, APIs, etc.)         │
│  Location: /src/infrastructure                              │
└─────────────────────────────────────────────────────────────┘
```

## Dependency Rules

### Presentation Layer → Application Layer

- ✅ CAN depend on: Application layer (use cases, DTOs)
- ❌ CANNOT depend on: Domain layer directly, Infrastructure layer

### Application Layer → Domain Layer

- ✅ CAN depend on: Domain layer (aggregates, value objects, repository interfaces)
- ❌ CANNOT depend on: Infrastructure layer, Presentation layer

### Domain Layer (Core)

- ✅ CAN depend on: Nothing (pure business logic)
- ❌ CANNOT depend on: Any other layer

### Infrastructure Layer → Domain Layer

- ✅ CAN depend on: Domain layer (implements repository interfaces)
- ✅ CAN depend on: Application layer (for DTOs if needed)
- ❌ CANNOT depend on: Presentation layer

## Directory Structure

```
/src
├── domain/                      # Domain Layer
│   ├── shared/                  # Shared domain building blocks
│   │   └── base/
│   │       ├── entity.base.ts
│   │       ├── aggregate-root.base.ts
│   │       ├── value-object.base.ts
│   │       ├── domain-event.base.ts
│   │       └── repository.interface.ts
│   ├── legal-documents/         # Bounded Context
│   │   ├── aggregates/
│   │   ├── value-objects/
│   │   ├── events/
│   │   └── repositories/
│   ├── user-management/         # Bounded Context
│   ├── billing/                 # Bounded Context
│   └── ai-operations/           # Bounded Context
│
├── application/                 # Application Layer
│   ├── common/
│   │   ├── use-case.interface.ts
│   │   └── application-error.ts
│   └── documents/
│       ├── dto/
│       │   ├── create-document.dto.ts
│       │   ├── document-output.dto.ts
│       │   └── update-document.dto.ts
│       └── use-cases/
│           ├── create-document.use-case.ts
│           ├── get-document.use-case.ts
│           ├── list-documents.use-case.ts
│           ├── update-document-title.use-case.ts
│           ├── publish-document.use-case.ts
│           └── delete-document.use-case.ts
│
├── infrastructure/              # Infrastructure Layer
│   └── persistence/
│       ├── entities/
│       │   └── (CQRS read models - main entities from modules/)
│       ├── repositories/
│       │   └── legal-document.repository.ts (with inline toDomain/toEntity mapping)
│       └── persistence.module.ts
│
├── presentation/                # Presentation Layer
│   ├── graphql/
│   │   ├── dto/
│   │   │   └── document.graphql-dto.ts
│   │   └── resolvers/
│   │       └── documents.resolver.ts
│   ├── rest/
│   │   ├── dto/
│   │   │   └── document.rest-dto.ts
│   │   └── controllers/
│   │       └── documents.controller.ts
│   └── presentation.module.ts
│
└── modules/                     # Legacy modules (being migrated)
    ├── auth/
    ├── users/
    ├── documents/
    ├── audit-log/
    └── queries/
```

## Use Case Pattern

Each use case follows this structure:

```typescript
@Injectable()
export class CreateDocumentUseCase implements IUseCase<
  CreateDocumentDto,
  CreateDocumentResultDto
> {
  constructor(
    @Inject('ILegalDocumentRepository')
    private readonly documentRepository: ILegalDocumentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CreateDocumentDto): Promise<CreateDocumentResultDto> {
    // 1. Validate input (if needed)
    // 2. Create/Load domain aggregate
    // 3. Execute business logic via aggregate methods
    // 4. Persist changes via repository
    // 5. Publish domain events
    // 6. Return result DTO
  }
}
```

## Repository Pattern (CQRS + Simplified DDD)

Repositories are defined as interfaces in the Domain layer and implemented in the Infrastructure layer:

```typescript
// Domain Layer - Interface
export interface ILegalDocumentRepository extends IRepository<
  LegalDocumentAggregate,
  string
> {
  findByOwnerId(ownerId: string): Promise<LegalDocumentAggregate[]>;
  // ...other query methods
}

// Infrastructure Layer - Implementation with inline mapping
@Injectable()
export class LegalDocumentRepository implements ILegalDocumentRepository {
  constructor(
    @InjectRepository(LegalDocument) // Main entity from modules/
    private readonly repository: Repository<LegalDocument>,
  ) {}

  async findById(id: string): Promise<LegalDocumentAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  // Inline CQRS write side transformation
  private toDomain(entity: LegalDocument): LegalDocumentAggregate {
    return LegalDocumentAggregate.reconstitute(
      entity.id,
      entity.title,
      entity.contentRaw || '',
      entity.type as DocumentTypeEnum,
      entity.status as DocumentStatusEnum,
      entity.sessionId, // sessionId → ownerId for DDD layer
      entity.createdAt,
      entity.updatedAt,
      entity.metadata,
    );
  }

  private toEntity(aggregate: LegalDocumentAggregate): LegalDocument {
    const entity = new LegalDocument();
    entity.id = aggregate.id;
    entity.title = aggregate.title.toValue();
    // ...other properties
    return entity;
  }
}
```

**Key Points:**

- Repositories use main entities from `modules/` (CQRS Read Model)
- Mapping to/from domain aggregates happens inline in the repository
- No separate mapper files needed
- TypeORM annotations acceptable on domain entities (simplified DDD)

## API Endpoints (V2)

### REST API

- `POST /api/v2/documents` - Create document
- `GET /api/v2/documents/:id` - Get document by ID
- `GET /api/v2/documents?ownerId=xxx` - List documents by owner
- `PUT /api/v2/documents/:id/title` - Update document title
- `POST /api/v2/documents/:id/publish` - Publish document
- `DELETE /api/v2/documents/:id` - Delete document

### GraphQL API

- Query: `documentV2(id: ID!)` - Get document by ID
- Query: `documentsByOwnerV2(ownerId: ID!, status: DocumentStatus)` - List documents
- Mutation: `createDocumentV2(input: CreateLegalDocumentInputV2!)` - Create document
- Mutation: `updateDocumentTitleV2(input: UpdateDocumentTitleInputV2!)` - Update title
- Mutation: `publishDocumentV2(input: PublishDocumentInputV2!)` - Publish document
- Mutation: `deleteDocumentV2(input: DeleteDocumentInputV2!)` - Delete document

## Migration Strategy

The existing modules in `/src/modules/` are being gradually migrated to the new layered architecture. The V2 endpoints are available alongside the existing V1 endpoints for backward compatibility.

Migration steps for each module:

1. Create Domain layer entities (aggregates, value objects, events, repository interfaces)
2. Create Application layer use cases
3. Create Infrastructure layer implementations (repositories, mappers)
4. Create Presentation layer endpoints (resolvers, controllers)
5. Add to PresentationModule
6. Test thoroughly
7. Deprecate old V1 endpoints
8. Remove old module code
