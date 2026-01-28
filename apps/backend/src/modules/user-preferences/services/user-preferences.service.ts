import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreferences } from '../entities/user-preferences.entity';
import { UpdateUserPreferencesInput } from '../dto/user-preferences.dto';

/**
 * UserPreferences Service
 *
 * Business logic for managing user preferences.
 * Provides methods for CRUD operations and preference updates.
 */
@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserPreferences)
    private readonly preferencesRepository: Repository<UserPreferences>,
  ) {}

  /**
   * Find preferences by user ID
   */
  async findByUserId(userId: string): Promise<UserPreferences> {
    const preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      throw new NotFoundException(
        `User preferences not found for user ${userId}`,
      );
    }

    return preferences;
  }

  /**
   * Get or create default preferences for a user
   */
  async getOrCreate(userId: string): Promise<UserPreferences> {
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      preferences = this.preferencesRepository.create(
        UserPreferences.createDefault(userId),
      );
      await this.preferencesRepository.save(preferences);
    }

    return preferences;
  }

  /**
   * Update user preferences
   */
  async update(
    userId: string,
    input: UpdateUserPreferencesInput,
  ): Promise<UserPreferences> {
    const preferences = await this.getOrCreate(userId);

    // Update primitive fields
    if (input.locale !== undefined) {
      preferences.locale = input.locale;
    }
    if (input.theme !== undefined) {
      preferences.theme = input.theme;
    }
    if (input.aiModel !== undefined) {
      preferences.aiModel = input.aiModel;
    }
    if (input.emailNotifications !== undefined) {
      preferences.emailNotifications = input.emailNotifications;
    }
    if (input.inAppNotifications !== undefined) {
      preferences.inAppNotifications = input.inAppNotifications;
    }
    if (input.timezone !== undefined) {
      preferences.timezone = input.timezone;
    }
    if (input.dateFormat !== undefined) {
      preferences.dateFormat = input.dateFormat;
    }

    // Update nested notification preferences
    if (input.notificationPreferences) {
      preferences.updateNotificationPreferences(
        input.notificationPreferences as Record<string, unknown>,
      );
    }

    return this.preferencesRepository.save(preferences);
  }

  /**
   * Reset preferences to defaults
   */
  async resetToDefaults(userId: string): Promise<UserPreferences> {
    const existing = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (existing) {
      await this.preferencesRepository.remove(existing);
    }

    const newPreferences = this.preferencesRepository.create(
      UserPreferences.createDefault(userId),
    );
    return this.preferencesRepository.save(newPreferences);
  }

  /**
   * Delete user preferences
   */
  async delete(userId: string): Promise<void> {
    const preferences = await this.findByUserId(userId);
    await this.preferencesRepository.remove(preferences);
  }

  /**
   * Save user preferences entity
   * Used by other services that need to directly save a preferences entity
   */
  async save(preferences: UserPreferences): Promise<UserPreferences> {
    return this.preferencesRepository.save(preferences);
  }

  /**
   * Get all preferences (admin only)
   */
  async findAll(): Promise<UserPreferences[]> {
    return this.preferencesRepository.find();
  }

  /**
   * Validate locale code
   */
  private isValidLocale(locale: string): boolean {
    // Basic ISO 639-1 validation (2-letter code)
    const localeRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
    return localeRegex.test(locale);
  }

  /**
   * Validate timezone
   */
  private isValidTimezone(timezone: string): boolean {
    try {
      // Try to create a DateTimeFormat with the timezone to validate it
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }
}
