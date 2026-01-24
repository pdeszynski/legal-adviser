import { Resolver, Query, Info } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { GraphQLResolveInfo } from 'graphql';
import { GqlAuthGuard } from '../../modules/auth/guards/gql-auth.guard';
import { AdminGuard } from '../../modules/auth/guards/admin.guard';
import { SystemHealthService } from './system-health.service';
import { SystemHealthResponse } from './system-health.entity';

@Resolver()
@UseGuards(GqlAuthGuard, AdminGuard)
export class SystemHealthResolver {
  constructor(private readonly systemHealthService: SystemHealthService) {}

  @Query(() => SystemHealthResponse, {
    description: 'Get comprehensive system health status for admin dashboard',
  })
  async systemHealth(
    @Info() _info: GraphQLResolveInfo,
  ): Promise<SystemHealthResponse> {
    return this.systemHealthService.getSystemHealth();
  }
}
