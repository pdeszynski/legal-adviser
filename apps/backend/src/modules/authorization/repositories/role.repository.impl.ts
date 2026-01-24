import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { RoleEntity } from '../entities';
import { RoleAggregate, RoleId } from '../../../domain/authorization';
import { Permission } from '../../../domain/authorization/value-objects/permission.vo';
import { IRoleRepository } from '../../../domain/authorization/repositories/role.repository.interface';

/**
 * Role Repository Implementation
 *
 * Infrastructure layer implementation of the role repository.
 * Bridges between domain aggregates and database persistence.
 */
@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly ormRepository: TypeOrmRepository<RoleEntity>,
  ) {}

  async findById(id: string | RoleId): Promise<RoleAggregate | null> {
    const roleId = id instanceof RoleId ? id.toValue() : id;
    const entity = await this.ormRepository.findOne({ where: { id: roleId } });

    if (!entity) {
      return null;
    }

    return this.toAggregate(entity);
  }

  async findByName(name: string): Promise<RoleAggregate | null> {
    const entity = await this.ormRepository.findOne({ where: { name } });

    if (!entity) {
      return null;
    }

    return this.toAggregate(entity);
  }

  async findAll(): Promise<RoleAggregate[]> {
    const entities = await this.ormRepository.find({
      order: { type: 'ASC', name: 'ASC' },
    });

    return entities.map((e) => this.toAggregate(e));
  }

  async findCustomRoles(): Promise<RoleAggregate[]> {
    const entities = await this.ormRepository.find({
      where: { isSystemRole: false },
      order: { name: 'ASC' },
    });

    return entities.map((e) => this.toAggregate(e));
  }

  async findSystemRoles(): Promise<RoleAggregate[]> {
    const entities = await this.ormRepository.find({
      where: { isSystemRole: true },
      order: { type: 'ASC', name: 'ASC' },
    });

    return entities.map((e) => this.toAggregate(e));
  }

  async findByType(type: string): Promise<RoleAggregate[]> {
    const entities = await this.ormRepository.find({
      where: { type: type as any },
      order: { name: 'ASC' },
    });

    return entities.map((e) => this.toAggregate(e));
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.ormRepository.count({ where: { name } });
    return count > 0;
  }

  async save(role: RoleAggregate): Promise<void> {
    const entity = this.toEntity(role);

    // Check if entity exists
    const existing = await this.ormRepository.findOne({
      where: { id: entity.id },
    });

    if (existing) {
      await this.ormRepository.save({ ...existing, ...entity });
    } else {
      await this.ormRepository.save(entity);
    }
  }

  async delete(role: RoleAggregate): Promise<void> {
    await this.ormRepository.delete({ id: role.roleId.toValue() });
  }

  async getSystemRoles(): Promise<RoleAggregate[]> {
    return this.findSystemRoles();
  }

  async initializeSystemRoles(): Promise<void> {
    const existingRoles = await this.ormRepository.find({
      where: { isSystemRole: true },
    });

    const systemRoles = [
      RoleAggregate.createSuperAdmin(),
      RoleAggregate.createAdmin(),
      RoleAggregate.createLawyer(),
      RoleAggregate.createParalegal(),
      RoleAggregate.createClient(),
      RoleAggregate.createGuest(),
    ];

    for (const role of systemRoles) {
      const existing = existingRoles.find(
        (r) => r.name === role.name || r.id === role.roleId.toValue(),
      );

      if (!existing) {
        await this.ormRepository.save(this.toEntity(role));
      }
    }
  }

  /**
   * Convert domain aggregate to persistence entity
   */
  private toEntity(aggregate: RoleAggregate): RoleEntity {
    const entity = new RoleEntity();
    entity.id = aggregate.roleId.toValue();
    entity.name = aggregate.name;
    entity.description = aggregate.description;
    entity.type = aggregate.type.toValue() as any;
    entity.permissions = aggregate.permissionsToStrings();
    entity.inheritsFrom = aggregate.inheritsFrom?.toValue() as any;
    entity.isSystemRole = aggregate.isSystemRole;

    return entity;
  }

  /**
   * Convert persistence entity to domain aggregate
   */
  private toAggregate(entity: RoleEntity): RoleAggregate {
    return RoleAggregate.reconstitute(
      entity.id,
      entity.name,
      entity.description || '',
      entity.type,
      entity.permissions,
      entity.inheritsFrom || undefined,
      entity.isSystemRole,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
