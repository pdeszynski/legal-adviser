# CQRS + Simplified DDD Architecture Refactoring Plan

## Analysis Summary

After investigating the duplicate entity issue with `User`, we found that the duplication was UNIQUE to User. Other `*OrmEntity` classes are NOT duplicates:

| Entity | Table | Main Entity in modules? | Status |
|--------|-------|------------------------|--------|
| `UserOrmEntity` | `users` | YES (`User`) | **FIXED** - Removed duplicate |
| `DemoRequestOrmEntity` | `demo_requests` | NO (only in infrastructure) | Not a duplicate |
| `TwoFactorAuthOrmEntity` | `two_factor_auth` | NO (no dedicated module) | Not a duplicate |
| `LegalDocumentOrmEntity` | `legal_documents_v2` | YES (`LegalDocument` → `legal_documents`) | Different tables (v1 vs v2) |

## Current State

**Already Fixed:**
- `User` entity - now the single source of truth
- `UserRepository` - simplified with inline mapping
- Removed `UserOrmEntity` and `UserMapper`

**Remaining Work for Consistency:**

While other entities don't have duplication issues, we should apply the same CQRS + simplified DDD pattern for consistency:

1. **Rename `*OrmEntity` classes** - Remove the `Orm` suffix since they ARE the main entities
2. **Move mapper logic into repositories** - Remove separate mapper files
3. **Keep domain aggregates** - They serve as the write model in CQRS

## Refactoring Plan

### Phase 1: Two-Factor Auth (Low Risk)

**Files to modify:**
- `infrastructure/persistence/entities/two-factor-auth.orm-entity.ts`
- `infrastructure/persistence/mappers/two-factor-auth.mapper.ts`
- `infrastructure/persistence/repositories/two-factor-auth.repository.ts`
- `infrastructure/persistence/entities/index.ts`
- `infrastructure/persistence/mappers/index.ts`
- `modules/analytics/analytics.module.ts` (if references old name)

**Steps:**
1. Rename `TwoFactorAuthOrmEntity` → `TwoFactorAuth` (remove `Orm` suffix)
2. Move `toDomain()`/`toEntity()` logic from mapper into repository
3. Delete mapper file
4. Update all imports

**Domain:** `domain/two-factor-auth/aggregates/two-factor-auth.aggregate.ts` exists (write model)

### Phase 2: Demo Request (Low Risk)

**Files to modify:**
- `infrastructure/persistence/entities/demo-request.orm-entity.ts`
- `infrastructure/persistence/mappers/demo-request.mapper.ts`
- `infrastructure/persistence/repositories/demo-request.repository.ts`
- `modules/demo-request/demo-request.module.ts`
- `modules/demo-request/demo-request-crud.resolver.ts`
- `modules/analytics/analytics.module.ts`
- `modules/analytics/services/analytics.service.ts`

**Steps:**
1. Rename `DemoRequestOrmEntity` → `DemoRequest` (remove `Orm` suffix)
2. Move `toDomain()`/`toEntity()` logic from mapper into repository
3. Delete mapper file
4. Update all imports

**Domain:** `domain/demo-request/aggregates/demo-request.aggregate.ts` exists (write model)

### Phase 3: Legal Documents (COMPLETED - Consolidation Approach)

**DECISION:** Option A - Consolidate to single system while keeping DDD layer

**Actions Taken:**
1. Updated `LegalDocumentRepository` to use main `LegalDocument` entity (from `modules/documents/`)
2. Added inline `toDomain()`/`toEntity()` mapping in repository
3. Deleted `LegalDocumentOrmEntity` (from `legal_documents_v2` table)
4. Deleted `LegalDocumentMapper`
5. Updated index files and persistence module
6. Updated `ARCHITECTURE.md` to reflect CQRS + simplified DDD pattern

**Key Mapping Note:**
- DDD layer's `ownerId` maps to main entity's `sessionId`
- DDD layer's `content` maps to main entity's `contentRaw`
- Enums use `as unknown as Type` for type compatibility

**Files Modified:**
- `infrastructure/persistence/repositories/legal-document.repository.ts` - Updated to use main entity
- `infrastructure/persistence/entities/index.ts` - Removed legal-document.orm-entity
- `infrastructure/persistence/mappers/index.ts` - Removed legal-document.mapper
- `infrastructure/persistence/mappers/legal-document.mapper.ts` - DELETED
- `infrastructure/persistence/entities/legal-document.orm-entity.ts` - DELETED
- `infrastructure/persistence/persistence.module.ts` - Removed LegalDocumentOrmEntity import
- `src/ARCHITECTURE.md` - Updated repository pattern documentation
- `infrastructure/persistence/index.ts` - Removed mappers export

**DDD Layer Preserved:**
- `domain/legal-documents/aggregates/` - Kept
- `domain/legal-documents/repositories/` - Kept
- `application/documents/use-cases/` - Kept
- `application/documents/services/` - Kept
- `presentation/` layer - Kept

**Result:** Single unified system using main `legal_documents` table with DDD layer preserved for business logic.

### Phase 4: Update Documentation

**Files to update:**
- `.claude/CLAUDE.md` - Add architecture decision record
- `.automaker/memory/gotchas.md` - Document the `Orm` suffix pattern

## Execution Order

1. ✅ **Phase 1: Two-Factor Auth** (Low risk, simple rename) - COMPLETED
2. ✅ **Phase 2: Demo Request** (Low risk, simple rename) - COMPLETED
3. ✅ **Phase 3: Legal Documents** (Consolidation - COMPLETED)
4. ✅ **Phase 4: Documentation** (Always last) - COMPLETED

## Template for Each Phase

For each entity, apply this pattern:

```typescript
// BEFORE: Separate mapper file
// infrastructure/persistence/mappers/two-factor-auth.mapper.ts
export class TwoFactorAuthMapper {
  static toDomain(entity: TwoFactorAuthOrmEntity): TwoFactorAuthAggregate { ... }
  static toPersistence(aggregate: TwoFactorAuthAggregate): TwoFactorAuthOrmEntity { ... }
}

// AFTER: Inline mapping in repository
// infrastructure/persistence/repositories/two-factor-auth.repository.ts
@Injectable()
export class TwoFactorAuthRepository {
  private toDomain(entity: TwoFactorAuth): TwoFactorAuthAggregate { ... }
  private toEntity(aggregate: TwoFactorAuthAggregate): TwoFactorAuth { ... }
}
```

```bash
# Commands to execute for each phase:
# 1. Rename entity file
mv infrastructure/persistence/entities/{name}.orm-entity.ts infrastructure/persistence/entities/{name}.entity.ts

# 2. Update class name (remove Orm suffix)
# @Entity('table_name')
# export class NameOrmEntity → export class Name

# 3. Update repository with inline mapping

# 4. Delete mapper file
# 5. Update all imports across codebase
# 6. Update index files
```

## Rollback Plan

If any phase fails:
1. Revert entity rename
2. Restore mapper file
3. Revert repository changes
4. Revert import updates

The changes are isolated per entity, so rollback is safe.
