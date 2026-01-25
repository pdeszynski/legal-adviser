import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  SystemSetting,
  SettingCategory,
} from './entities/system-setting.entity';
import { SystemSettingsService } from './system-settings.service';
import {
  SystemSettingInput,
  BulkUpdateSettingsInput,
  SystemSettingResponse,
} from './dto/system-setting.dto';
import { GqlAuthGuard } from '../auth/guards';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Public } from '../auth/decorators/public.decorator';

/**
 * System Settings Resolver
 *
 * GraphQL resolver for system settings.
 * All mutations are protected by AdminGuard.
 */
@Resolver(() => SystemSetting)
export class SystemSettingsResolver {
  constructor(private readonly service: SystemSettingsService) {}

  /**
   * Get all system settings (admin only)
   */
  @Query(() => [SystemSetting], { name: 'systemSettings' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async findAll(): Promise<SystemSetting[]> {
    return this.service.findAll();
  }

  /**
   * Get settings by category (admin only)
   */
  @Query(() => [SystemSetting], { name: 'systemSettingsByCategory' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async findByCategory(
    @Args('category', { type: () => SettingCategory })
    category: SettingCategory,
  ): Promise<SystemSetting[]> {
    return this.service.findByCategory(category);
  }

  /**
   * Get public settings (no auth required - used by frontend for feature flags)
   */
  @Public()
  @Query(() => [SystemSetting], { name: 'publicSystemSettings' })
  async publicSettings(): Promise<SystemSetting[]> {
    // Return only safe, non-sensitive settings
    const allSettings = await this.service.findAll();
    return allSettings.filter(
      (s) =>
        s.category === SettingCategory.FEATURE_FLAGS ||
        s.key.startsWith('features.') ||
        s.key === 'maintenance.enabled' ||
        s.key === 'maintenance.message',
    );
  }

  /**
   * Get a single setting by key (admin only)
   */
  @Query(() => SystemSetting, { name: 'systemSetting', nullable: true })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async findByKey(
    @Args('key', { type: () => String }) key: string,
  ): Promise<SystemSetting | null> {
    return this.service.findByKey(key);
  }

  /**
   * Create or update a setting (admin only)
   */
  @Mutation(() => SystemSetting, { name: 'upsertSystemSetting' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async upsert(
    @Args('input') input: SystemSettingInput,
  ): Promise<SystemSetting> {
    return this.service.upsert(input);
  }

  /**
   * Bulk create or update settings (admin only)
   */
  @Mutation(() => [SystemSetting], { name: 'bulkUpsertSystemSettings' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async bulkUpsert(
    @Args('input') input: BulkUpdateSettingsInput,
  ): Promise<SystemSetting[]> {
    return this.service.bulkUpsert(input);
  }

  /**
   * Delete a setting (admin only)
   */
  @Mutation(() => Boolean, { name: 'deleteSystemSetting' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async delete(
    @Args('key', { type: () => String }) key: string,
  ): Promise<boolean> {
    return this.service.delete(key);
  }

  /**
   * Seed default settings (admin only)
   */
  @Mutation(() => Boolean, { name: 'seedSystemSettings' })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async seedDefaults(): Promise<boolean> {
    await this.service.seedDefaults();
    return true;
  }
}
