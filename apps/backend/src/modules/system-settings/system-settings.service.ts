import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SystemSetting,
  SettingValueType,
  SettingCategory,
} from './entities/system-setting.entity';
import {
  SystemSettingInput,
  BulkUpdateSettingsInput,
} from './dto/system-setting.dto';

/**
 * System Settings Service
 *
 * Manages system-wide configuration settings.
 */
@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepository: Repository<SystemSetting>,
  ) {}

  /**
   * Find all settings
   */
  async findAll(): Promise<SystemSetting[]> {
    return this.settingRepository.find();
  }

  /**
   * Find settings by category
   */
  async findByCategory(category: SettingCategory): Promise<SystemSetting[]> {
    return this.settingRepository.find({
      where: { category },
    });
  }

  /**
   * Find one setting by key
   */
  async findByKey(key: string): Promise<SystemSetting | null> {
    return this.settingRepository.findOne({
      where: { key },
    });
  }

  /**
   * Get typed value for a setting key
   */
  async getValue<T = string>(key: string, defaultValue?: T): Promise<T | null> {
    const setting = await this.findByKey(key);
    if (!setting) {
      return defaultValue ?? null;
    }
    return setting.getTypedValue<T>();
  }

  /**
   * Create or update a setting
   */
  async upsert(input: SystemSettingInput): Promise<SystemSetting> {
    const existing = await this.findByKey(input.key);

    if (existing) {
      // Update existing
      if (input.value !== undefined) existing.value = input.value;
      if (input.valueType !== undefined) existing.valueType = input.valueType;
      if (input.category !== undefined) existing.category = input.category;
      if (input.description !== undefined)
        existing.description = input.description;
      if (input.metadata !== undefined) existing.metadata = input.metadata;
      return this.settingRepository.save(existing);
    } else {
      // Create new
      const setting = this.settingRepository.create({
        key: input.key,
        value: input.value ?? null,
        valueType: input.valueType ?? SettingValueType.STRING,
        category: input.category ?? SettingCategory.GENERAL,
        description: input.description ?? null,
        metadata: input.metadata ?? null,
      });
      return this.settingRepository.save(setting);
    }
  }

  /**
   * Bulk create or update settings
   */
  async bulkUpsert(input: BulkUpdateSettingsInput): Promise<SystemSetting[]> {
    const results: SystemSetting[] = [];

    for (const settingInput of input.settings) {
      const setting = await this.upsert(settingInput);
      results.push(setting);
    }

    return results;
  }

  /**
   * Delete a setting
   */
  async delete(key: string): Promise<boolean> {
    const result = await this.settingRepository.delete({ key });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Seed default settings
   */
  async seedDefaults(): Promise<void> {
    const defaults: Omit<SystemSettingInput, 'metadata'>[] = [
      // AI Settings
      {
        key: 'ai.default_model',
        value: 'gpt-4',
        valueType: SettingValueType.STRING,
        category: SettingCategory.AI,
        description: 'Default AI model for legal queries',
      },
      {
        key: 'ai.temperature',
        value: '0.7',
        valueType: SettingValueType.NUMBER,
        category: SettingCategory.AI,
        description: 'Default temperature for AI responses',
      },
      {
        key: 'ai.max_tokens',
        value: '2000',
        valueType: SettingValueType.NUMBER,
        category: SettingCategory.AI,
        description: 'Default max tokens for AI responses',
      },

      // Feature Flags
      {
        key: 'features.chat_enabled',
        value: 'true',
        valueType: SettingValueType.BOOLEAN,
        category: SettingCategory.FEATURE_FLAGS,
        description: 'Enable chat functionality',
      },
      {
        key: 'features.document_upload_enabled',
        value: 'true',
        valueType: SettingValueType.BOOLEAN,
        category: SettingCategory.FEATURE_FLAGS,
        description: 'Enable document upload',
      },
      {
        key: 'features.advanced_search_enabled',
        value: 'true',
        valueType: SettingValueType.BOOLEAN,
        category: SettingCategory.FEATURE_FLAGS,
        description: 'Enable advanced search',
      },
      {
        key: 'features.templates_enabled',
        value: 'true',
        valueType: SettingValueType.BOOLEAN,
        category: SettingCategory.FEATURE_FLAGS,
        description: 'Enable document templates',
      },
      {
        key: 'features.collaboration_enabled',
        value: 'false',
        valueType: SettingValueType.BOOLEAN,
        category: SettingCategory.FEATURE_FLAGS,
        description: 'Enable document collaboration',
      },
      {
        key: 'features.notifications_enabled',
        value: 'true',
        valueType: SettingValueType.BOOLEAN,
        category: SettingCategory.FEATURE_FLAGS,
        description: 'Enable notifications',
      },

      // Maintenance Mode
      {
        key: 'maintenance.enabled',
        value: 'false',
        valueType: SettingValueType.BOOLEAN,
        category: SettingCategory.MAINTENANCE,
        description: 'Enable maintenance mode',
      },
      {
        key: 'maintenance.message',
        value: 'System is under maintenance. Please try again later.',
        valueType: SettingValueType.STRING,
        category: SettingCategory.MAINTENANCE,
        description: 'Maintenance mode message',
      },
      {
        key: 'maintenance.scheduled_start',
        value: null,
        valueType: SettingValueType.STRING,
        category: SettingCategory.MAINTENANCE,
        description: 'Scheduled maintenance start time (ISO 8601)',
      },
      {
        key: 'maintenance.bypass_code',
        value: null,
        valueType: SettingValueType.STRING,
        category: SettingCategory.MAINTENANCE,
        description: 'Bypass code for maintenance mode',
      },

      // General Settings
      {
        key: 'general.max_upload_size_mb',
        value: '10',
        valueType: SettingValueType.NUMBER,
        category: SettingCategory.GENERAL,
        description: 'Maximum file upload size in megabytes',
      },
      {
        key: 'general.support_email',
        value: 'support@legalai.com',
        valueType: SettingValueType.STRING,
        category: SettingCategory.GENERAL,
        description: 'Support email address',
      },
    ];

    for (const defaultSetting of defaults) {
      const exists = await this.findByKey(defaultSetting.key);
      if (!exists) {
        await this.upsert(defaultSetting);
      }
    }
  }
}
