import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationResolver } from './authorization.resolver';
import { AuthorizationService } from './authorization.service';
import { RoleRepository } from './repositories';
import { RoleEntity, UserRoleEntity } from './entities';
import { RoleHierarchyService } from '../../domain/authorization/services/role-hierarchy.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

/**
 * Authorization Module
 *
 * Module for Role-Based Access Control (RBAC) in the Authorization bounded context.
 * Provides role management, permission checking, and role hierarchy services.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([RoleEntity, UserRoleEntity]),
    AuthModule,
    UsersModule,
  ],
  providers: [
    AuthorizationResolver,
    AuthorizationService,
    RoleRepository,
    RoleHierarchyService,
  ],
  exports: [AuthorizationService, RoleRepository, RoleHierarchyService],
})
export class AuthorizationModule implements OnModuleInit {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async onModuleInit(): Promise<void> {
    // Initialize system roles on module initialization
    await this.authorizationService.initializeSystemRoles();
  }
}
