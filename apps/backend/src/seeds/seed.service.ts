import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

// Entities
import { User } from '../modules/users/entities/user.entity';
import { UserSession } from '../modules/users/entities/user-session.entity';
import { LegalDocument } from '../modules/documents/entities/legal-document.entity';
import { LegalAnalysis } from '../modules/documents/entities/legal-analysis.entity';
import { LegalRuling } from '../modules/documents/entities/legal-ruling.entity';
import { LegalQuery } from '../modules/queries/entities/legal-query.entity';
import { AuditLog } from '../modules/audit-log/entities/audit-log.entity';
import { RoleEntity } from '../modules/authorization/entities/role.entity';
import { UserRoleEntity } from '../modules/authorization/entities';
import { UserPreferences } from '../modules/user-preferences/entities/user-preferences.entity';

// Services
import { EncryptionService } from '../shared/encryption/encryption.service';

// Seed data
import {
  usersSeedData,
  sessionsSeedData,
  documentsSeedData,
  analysesSeedData,
  rulingsSeedData,
  queriesSeedData,
  auditLogsSeedData,
  rolesSeedData,
  userRolesSeedData,
} from './data';

const BCRYPT_SALT_ROUNDS = 10;

/**
 * SeedService
 *
 * Handles database seeding with fixture data for development and testing.
 * Supports both fresh seeding and re-seeding (clearing existing data first).
 */
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  // Store created entities for reference during seeding
  private userMap: Map<string, User> = new Map();
  private sessionList: UserSession[] = [];
  private roleMap: Map<string, RoleEntity> = new Map();

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    @InjectRepository(LegalDocument)
    private readonly documentRepository: Repository<LegalDocument>,
    @InjectRepository(LegalAnalysis)
    private readonly analysisRepository: Repository<LegalAnalysis>,
    @InjectRepository(LegalRuling)
    private readonly rulingRepository: Repository<LegalRuling>,
    @InjectRepository(LegalQuery)
    private readonly queryRepository: Repository<LegalQuery>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    @InjectRepository(UserPreferences)
    private readonly userPreferencesRepository: Repository<UserPreferences>,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Run the complete seeding process
   * @param clean - If true, clear existing data before seeding
   */
  async seed(clean: boolean = false): Promise<void> {
    this.logger.log('Starting database seeding...');

    if (clean) {
      await this.cleanDatabase();
    }

    // Check if data already exists
    const existingUsers = await this.userRepository.count();
    if (existingUsers > 0 && !clean) {
      this.logger.warn(
        'Database already contains data. Use --clean flag to reset. Skipping seeding.',
      );
      return;
    }

    try {
      // Seed in order of dependencies
      await this.seedRoles();
      await this.seedUsers();
      await this.seedUserRoles();
      await this.seedUserPreferences();
      await this.seedSessions();
      await this.seedDocuments();
      await this.seedAnalyses();
      await this.seedRulings();
      await this.seedQueries();
      await this.seedAuditLogs();

      this.logger.log('Database seeding completed successfully!');
      this.printSummary();
    } catch (error) {
      this.logger.error('Error during seeding:', error);
      throw error;
    }
  }

  /**
   * Clean all seeded data from the database
   * Uses raw queries to bypass foreign key constraints
   */
  async cleanDatabase(): Promise<void> {
    this.logger.log('Cleaning database...');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Disable foreign key checks for PostgreSQL
      await queryRunner.query('SET CONSTRAINTS ALL DEFERRED');

      // Delete in reverse order of dependencies
      await queryRunner.query('DELETE FROM audit_logs');
      await queryRunner.query('DELETE FROM legal_queries');
      await queryRunner.query('DELETE FROM legal_rulings');
      await queryRunner.query('DELETE FROM legal_analyses');
      await queryRunner.query('DELETE FROM legal_documents');
      await queryRunner.query('DELETE FROM user_sessions');
      await queryRunner.query('DELETE FROM user_preferences');
      await queryRunner.query('DELETE FROM user_roles');
      await queryRunner.query('DELETE FROM roles');
      await queryRunner.query('DELETE FROM users');

      this.logger.log('Database cleaned successfully');
    } finally {
      await queryRunner.release();
    }

    // Clear local maps
    this.userMap.clear();
    this.sessionList = [];
    this.roleMap.clear();
  }

  /**
   * Seed roles
   * Must be seeded before users so user-role relationships can be established
   */
  private async seedRoles(): Promise<void> {
    this.logger.log('Seeding roles...');

    for (const roleData of rolesSeedData) {
      // Check if role already exists
      const existingRole = await this.roleRepository.findOne({
        where: { id: roleData.id },
      });

      if (existingRole) {
        this.logger.debug(`Role ${roleData.name} already exists, skipping`);
        this.roleMap.set(roleData.type, existingRole);
        continue;
      }

      const role = this.roleRepository.create({
        id: roleData.id,
        name: roleData.name,
        description: roleData.description,
        type: roleData.type,
        permissions: roleData.permissions,
        inheritsFrom: roleData.inheritsFrom,
        isSystemRole: roleData.isSystemRole,
      });

      const savedRole = await this.roleRepository.save(role);
      this.roleMap.set(roleData.type, savedRole);
      this.logger.debug(`Created role: ${roleData.name}`);
    }

    this.logger.log(`Seeded ${this.roleMap.size} roles`);
  }

  /**
   * Seed users
   */
  private async seedUsers(): Promise<void> {
    this.logger.log('Seeding users...');

    for (const userData of usersSeedData) {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        this.logger.debug(`User ${userData.email} already exists, skipping`);
        this.userMap.set(userData.email, existingUser);
        continue;
      }

      const passwordHash = await bcrypt.hash(
        userData.password,
        BCRYPT_SALT_ROUNDS,
      );

      // Handle 2FA fields if present
      let encryptedSecret: string | null = null;
      let hashedBackupCodes: string | null = null;

      if (userData.twoFactorSecret) {
        // Encrypt the TOTP secret for storage
        encryptedSecret = this.encryptionService.encrypt(
          userData.twoFactorSecret,
        );
      }

      if (userData.twoFactorBackupCodes) {
        // Parse and hash backup codes
        const backupCodesData = JSON.parse(
          userData.twoFactorBackupCodes,
        ) as Array<{ codeHash: string; used: boolean }>;
        const hashedCodes = await Promise.all(
          backupCodesData.map(
            async (codeData: { codeHash: string; used: boolean }) => ({
              codeHash: await bcrypt.hash(
                codeData.codeHash.toUpperCase().replace(/-/g, ''),
                BCRYPT_SALT_ROUNDS,
              ),
              used: codeData.used,
            }),
          ),
        );
        hashedBackupCodes = JSON.stringify(hashedCodes);
      }

      const user = this.userRepository.create({
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash,
        isActive: userData.isActive,
        disclaimerAccepted: userData.disclaimerAccepted,
        twoFactorEnabled: userData.twoFactorEnabled ?? false,
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: hashedBackupCodes,
      });

      const savedUser = await this.userRepository.save(user);
      this.userMap.set(userData.email, savedUser);
      this.logger.debug(
        `Created user: ${userData.email}${userData.twoFactorEnabled ? ' (with 2FA)' : ''}`,
      );
    }

    this.logger.log(`Seeded ${this.userMap.size} users`);
  }

  /**
   * Seed user-role relationships
   * Must be seeded after both users and roles
   */
  private async seedUserRoles(): Promise<void> {
    this.logger.log('Seeding user roles...');

    let count = 0;
    for (const userRoleData of userRolesSeedData) {
      const user = this.userMap.get(userRoleData.userEmail);
      const role = this.roleMap.get(userRoleData.roleType);

      if (!user) {
        this.logger.warn(
          `User ${userRoleData.userEmail} not found for role assignment, skipping`,
        );
        continue;
      }

      if (!role) {
        this.logger.warn(
          `Role ${userRoleData.roleType} not found for user ${userRoleData.userEmail}, skipping`,
        );
        continue;
      }

      // Check if user-role already exists
      const existingUserRole = await this.userRoleRepository.findOne({
        where: { userId: user.id, roleId: role.id },
      });

      if (existingUserRole) {
        this.logger.debug(
          `User-role for ${userRoleData.userEmail} with role ${userRoleData.roleType} already exists, skipping`,
        );
        continue;
      }

      const userRole = this.userRoleRepository.create({
        id: randomUUID(),
        userId: user.id,
        roleId: role.id,
        priority: userRoleData.priority ?? 100,
        notes: userRoleData.notes,
        expiresAt: userRoleData.expiresAt,
        isActive: true,
      });

      await this.userRoleRepository.save(userRole);
      count++;
      this.logger.debug(
        `Assigned role ${userRoleData.roleType} to user ${userRoleData.userEmail}`,
      );
    }

    this.logger.log(`Seeded ${count} user-role assignments`);
  }

  /**
   * Seed user preferences
   * Creates default preferences for each seeded user
   */
  private async seedUserPreferences(): Promise<void> {
    this.logger.log('Seeding user preferences...');

    let count = 0;
    for (const [email, user] of this.userMap.entries()) {
      // Check if preferences already exist
      const existingPrefs = await this.userPreferencesRepository.findOne({
        where: { userId: user.id },
      });

      if (existingPrefs) {
        this.logger.debug(`Preferences for ${email} already exist, skipping`);
        continue;
      }

      const prefs = this.userPreferencesRepository.create(
        UserPreferences.createDefault(user.id),
      );

      await this.userPreferencesRepository.save(prefs);
      count++;
      this.logger.debug(`Created preferences for user: ${email}`);
    }

    this.logger.log(`Seeded ${count} user preferences`);
  }

  /**
   * Seed user sessions
   */
  private async seedSessions(): Promise<void> {
    this.logger.log('Seeding sessions...');

    for (const sessionData of sessionsSeedData) {
      const user = this.userMap.get(sessionData.userEmail);
      if (!user) {
        this.logger.warn(
          `User ${sessionData.userEmail} not found for session, skipping`,
        );
        continue;
      }

      const session = this.sessionRepository.create({
        userId: user.id,
        mode: sessionData.mode,
        startedAt: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        ), // Random time in last 7 days
        endedAt: sessionData.isActive ? null : new Date(),
      });

      const savedSession = await this.sessionRepository.save(session);
      this.sessionList.push(savedSession);
      this.logger.debug(`Created session for user: ${sessionData.userEmail}`);
    }

    this.logger.log(`Seeded ${this.sessionList.length} sessions`);
  }

  /**
   * Seed legal documents
   */
  private async seedDocuments(): Promise<void> {
    this.logger.log('Seeding documents...');

    let count = 0;
    for (const docData of documentsSeedData) {
      const session = this.sessionList[docData.sessionIndex];
      if (!session) {
        this.logger.warn(
          `Session index ${docData.sessionIndex} not found, skipping document`,
        );
        continue;
      }

      const document = this.documentRepository.create({
        sessionId: session.id,
        title: docData.title,
        type: docData.type,
        status: docData.status,
        contentRaw: docData.contentRaw,
        metadata: docData.metadata,
      });

      await this.documentRepository.save(document);
      count++;
      this.logger.debug(`Created document: ${docData.title}`);
    }

    this.logger.log(`Seeded ${count} documents`);
  }

  /**
   * Seed legal analyses
   */
  private async seedAnalyses(): Promise<void> {
    this.logger.log('Seeding analyses...');

    let count = 0;
    for (const analysisData of analysesSeedData) {
      const session = this.sessionList[analysisData.sessionIndex];
      if (!session) {
        this.logger.warn(
          `Session index ${analysisData.sessionIndex} not found, skipping analysis`,
        );
        continue;
      }

      const analysis = this.analysisRepository.create({
        sessionId: session.id,
        title: analysisData.title,
        inputDescription: analysisData.inputDescription,
        status: analysisData.status,
        overallConfidenceScore: analysisData.overallConfidenceScore,
        identifiedGrounds: analysisData.identifiedGrounds,
        summary: analysisData.summary,
        recommendations: analysisData.recommendations,
        errorMessage: analysisData.errorMessage,
        metadata: analysisData.metadata,
      });

      await this.analysisRepository.save(analysis);
      count++;
      this.logger.debug(`Created analysis: ${analysisData.title}`);
    }

    this.logger.log(`Seeded ${count} analyses`);
  }

  /**
   * Seed legal rulings
   */
  private async seedRulings(): Promise<void> {
    this.logger.log('Seeding rulings...');

    let count = 0;
    for (const rulingData of rulingsSeedData) {
      // Check if ruling already exists by signature
      const existingRuling = await this.rulingRepository.findOne({
        where: { signature: rulingData.signature },
      });

      if (existingRuling) {
        this.logger.debug(
          `Ruling ${rulingData.signature} already exists, skipping`,
        );
        continue;
      }

      const ruling = this.rulingRepository.create({
        signature: rulingData.signature,
        rulingDate: new Date(rulingData.rulingDate),
        courtName: rulingData.courtName,
        courtType: rulingData.courtType,
        summary: rulingData.summary,
        fullText: rulingData.fullText,
        metadata: rulingData.metadata,
      });

      await this.rulingRepository.save(ruling);
      count++;
      this.logger.debug(`Created ruling: ${rulingData.signature}`);
    }

    this.logger.log(`Seeded ${count} rulings`);
  }

  /**
   * Seed legal queries
   */
  private async seedQueries(): Promise<void> {
    this.logger.log('Seeding queries...');

    let count = 0;
    for (const queryData of queriesSeedData) {
      const session = this.sessionList[queryData.sessionIndex];
      if (!session) {
        this.logger.warn(
          `Session index ${queryData.sessionIndex} not found, skipping query`,
        );
        continue;
      }

      const query = this.queryRepository.create({
        sessionId: session.id,
        question: queryData.question,
        answerMarkdown: queryData.answerMarkdown,
        citations: queryData.citations,
      });

      await this.queryRepository.save(query);
      count++;
      this.logger.debug(
        `Created query: ${queryData.question.substring(0, 50)}...`,
      );
    }

    this.logger.log(`Seeded ${count} queries`);
  }

  /**
   * Seed audit logs
   */
  private async seedAuditLogs(): Promise<void> {
    this.logger.log('Seeding audit logs...');

    let count = 0;
    for (const logData of auditLogsSeedData) {
      const user = logData.userEmail
        ? this.userMap.get(logData.userEmail)
        : null;

      const auditLog = this.auditLogRepository.create({
        userId: user?.id || null,
        action: logData.action,
        resourceType: logData.resourceType,
        resourceId: logData.resourceId,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
        statusCode: logData.statusCode,
        errorMessage: logData.errorMessage,
        changeDetails: logData.changeDetails,
      });

      await this.auditLogRepository.save(auditLog);
      count++;
    }

    this.logger.log(`Seeded ${count} audit logs`);
  }

  /**
   * Print a summary of seeded data
   */
  private printSummary(): void {
    this.logger.log('=== Seeding Summary ===');
    this.logger.log(`Roles: ${this.roleMap.size}`);
    this.logger.log(`Users: ${this.userMap.size}`);
    this.logger.log(`User Roles: ${userRolesSeedData.length}`);
    this.logger.log(`User Preferences: ${this.userMap.size}`);
    this.logger.log(`Sessions: ${this.sessionList.length}`);
    this.logger.log(`Documents: ${documentsSeedData.length}`);
    this.logger.log(`Analyses: ${analysesSeedData.length}`);
    this.logger.log(`Rulings: ${rulingsSeedData.length}`);
    this.logger.log(`Queries: ${queriesSeedData.length}`);
    this.logger.log(`Audit Logs: ${auditLogsSeedData.length}`);
    this.logger.log('=======================');
    this.logger.log('');
    this.logger.log('Default credentials:');
    this.logger.log('  Admin (super_admin):');
    this.logger.log('    Email: admin@refine.dev');
    this.logger.log('    Password: password');
    this.logger.log('  Lawyer:');
    this.logger.log('    Email: lawyer@example.com');
    this.logger.log('    Password: password123');
    this.logger.log('  User (client):');
    this.logger.log('    Email: user@example.com');
    this.logger.log('    Password: password123');
    this.logger.log('');
    this.logger.log('Two-Factor Authentication (2FA) test users:');
    this.logger.log('  User with 2FA enabled:');
    this.logger.log('    Email: user2fa@example.com');
    this.logger.log('    Password: password123');
    this.logger.log('    TOTP Secret: JBSWY3DPEHPK3PXP');
    this.logger.log(
      '    Backup codes: A1B2-C3D4-E5F6-A7B8, C3D4-E5F6-A7B8-C9D0, ...',
    );
    this.logger.log('  Admin with 2FA enabled:');
    this.logger.log('    Email: admin2fa@example.com');
    this.logger.log('    Password: password123');
    this.logger.log('    TOTP Secret: KRSXG5DSQZKYQPZM');
    this.logger.log(
      '    Backup codes: A1B2-C3D4-E5F6-A7B8, C3D4-E5F6-A7B8-C9D0, ...',
    );
    this.logger.log('  User with 2FA pending (secret set, not verified):');
    this.logger.log('    Email: user2fa-pending@example.com');
    this.logger.log('    Password: password123');
    this.logger.log('');
  }

  /**
   * Check if the database has been seeded
   */
  async isSeeded(): Promise<boolean> {
    const adminUser = await this.userRepository.findOne({
      where: { email: 'admin@refine.dev' },
    });
    return !!adminUser;
  }

  /**
   * Get seeding statistics
   */
  async getStats(): Promise<{
    roles: number;
    users: number;
    userRoles: number;
    userPreferences: number;
    sessions: number;
    documents: number;
    analyses: number;
    rulings: number;
    queries: number;
    auditLogs: number;
  }> {
    const [
      roles,
      users,
      userRoles,
      userPreferences,
      sessions,
      documents,
      analyses,
      rulings,
      queries,
      auditLogs,
    ] = await Promise.all([
      this.roleRepository.count(),
      this.userRepository.count(),
      this.userRoleRepository.count(),
      this.userPreferencesRepository.count(),
      this.sessionRepository.count(),
      this.documentRepository.count(),
      this.analysisRepository.count(),
      this.rulingRepository.count(),
      this.queryRepository.count(),
      this.auditLogRepository.count(),
    ]);

    return {
      roles,
      users,
      userRoles,
      userPreferences,
      sessions,
      documents,
      analyses,
      rulings,
      queries,
      auditLogs,
    };
  }
}
