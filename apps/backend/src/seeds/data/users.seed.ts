/**
 * User seed data for development and testing
 *
 * DEFAULT ADMIN ACCOUNT:
 * - Email: admin@refine.dev
 * - Password: password
 * - Role: SUPER_ADMIN
 *
 * This is the primary admin user for the application. Use these credentials
 * to access admin routes and perform administrative tasks.
 */
import { UserRole } from '../../modules/auth/enums/user-role.enum';

export interface UserSeedData {
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  password: string;
  isActive: boolean;
  disclaimerAccepted: boolean;
  role: UserRole;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  twoFactorBackupCodes?: string | null;
}

/**
 * Test TOTP secrets for 2FA seed data
 *
 * These are known TOTP secrets used for testing only.
 * The secret 'JBSWY3DPEHPK3PXP' is a well-known test secret
 * that generates predictable TOTP tokens (like '123456' in some time windows).
 *
 * For local development with the seed users:
 * 1. Use an authenticator app with these secrets, or
 * 2. Generate tokens programmatically using otplib:
 *    ```javascript
 *    import otplib from 'otplib';
 *    otplib.authenticator.options = { digits: 6, period: 30 };
 *    const token = otplib.authenticator.generate('JBSWY3DPEHPK3PXP');
 *    ```
 */
export const TEST_TOTP_SECRETS = {
  /** User with 2FA enabled - test secret 'JBSWY3DPEHPK3PXP' */
  USER_2FA: 'JBSWY3DPEHPK3PXP',
  /** Admin with 2FA enabled - test secret 'KRSXG5DSQZKYQPZM' */
  ADMIN_2FA: 'KRSXG5DSQZKYQPZM',
} as const;

/**
 * Pre-generated backup codes for testing
 *
 * These are unhashed backup codes. During seeding, they will be hashed
 * using bcrypt before storage in the database.
 *
 * Format: XXXX-XXXX-XXXX-XXXX (16 hex chars, 3 dashes)
 */
export const TEST_BACKUP_CODES = [
  'A1B2-C3D4-E5F6-A7B8',
  'C3D4-E5F6-A7B8-C9D0',
  'E5F6-A7B8-C9D0-E1F2',
  'A7B8-C9D0-E1F2-A3B4',
  'C9D0-E1F2-A3B4-C5D6',
  'E1F2-A3B4-C5D6-E7F8',
  'A3B4-C5D6-E7F8-A9B0',
  'C5D6-E7F8-A9B0-C1D2',
  'E7F8-A9B0-C1D2-E3F4',
  'A9B0-C1D2-E3F4-A5B6',
];

export const usersSeedData: UserSeedData[] = [
  // ============================================================================
  // DEFAULT ADMIN USER - PRIMARY ACCOUNT FOR DEVELOPMENT AND TESTING
  // ============================================================================
  // Email: admin@refine.dev
  // Password: password
  // Role: SUPER_ADMIN (full access to all features including admin dashboard)
  //
  // This user is created first and should be the only admin user in seed data.
  // Use this account to test admin functionality and access protected routes.
  // ============================================================================
  {
    email: 'admin@refine.dev',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    password: 'password',
    isActive: true,
    disclaimerAccepted: true,
    role: UserRole.SUPER_ADMIN,
  },
  // Sample lawyer user
  {
    email: 'lawyer@example.com',
    username: 'lawyer1',
    firstName: 'Jan',
    lastName: 'Kowalski',
    password: 'password123',
    isActive: true,
    disclaimerAccepted: true,
    role: UserRole.LAWYER,
  },
  // Sample regular user (client)
  {
    email: 'user@example.com',
    username: 'user1',
    firstName: 'Anna',
    lastName: 'Nowak',
    password: 'password123',
    isActive: true,
    disclaimerAccepted: false,
    role: UserRole.CLIENT,
  },
  // Inactive user for testing
  {
    email: 'inactive@example.com',
    username: 'inactive1',
    firstName: 'Piotr',
    lastName: 'Wisniewski',
    password: 'password123',
    isActive: false,
    disclaimerAccepted: false,
    role: UserRole.GUEST,
  },
  // User without username
  {
    email: 'minimal@example.com',
    username: null,
    firstName: null,
    lastName: null,
    password: 'password123',
    isActive: true,
    disclaimerAccepted: true,
    role: UserRole.CLIENT,
  },
  // User with 2FA enabled - for testing 2FA login flow
  // TOTP secret: JBSWY3DPEHPK3PXP
  // Backup codes: See TEST_BACKUP_CODES export
  {
    email: 'user2fa@example.com',
    username: 'user2fa',
    firstName: 'Two',
    lastName: 'Factor',
    password: 'password123',
    isActive: true,
    disclaimerAccepted: true,
    role: UserRole.CLIENT,
    twoFactorEnabled: true,
    twoFactorSecret: TEST_TOTP_SECRETS.USER_2FA,
    twoFactorBackupCodes: JSON.stringify(
      TEST_BACKUP_CODES.map((code) => ({
        codeHash: code, // Will be hashed during seeding
        used: false,
      })),
    ),
  },
  // Admin user with 2FA enabled - for testing admin 2FA flow
  // TOTP secret: KRSXG5DSQZKYQPZM
  // Backup codes: See TEST_BACKUP_CODES export
  {
    email: 'admin2fa@example.com',
    username: 'admin2fa',
    firstName: 'Admin',
    lastName: 'TwoFactor',
    password: 'password123',
    isActive: true,
    disclaimerAccepted: true,
    role: UserRole.ADMIN,
    twoFactorEnabled: true,
    twoFactorSecret: TEST_TOTP_SECRETS.ADMIN_2FA,
    twoFactorBackupCodes: JSON.stringify(
      TEST_BACKUP_CODES.map((code) => ({
        codeHash: code, // Will be hashed during seeding
        used: false,
      })),
    ),
  },
  // User with 2FA setup but not verified (secret stored, but not enabled)
  // Used for testing the verification step
  {
    email: 'user2fa-pending@example.com',
    username: 'user2fa-pending',
    firstName: 'Pending',
    lastName: 'Verification',
    password: 'password123',
    isActive: true,
    disclaimerAccepted: true,
    role: UserRole.CLIENT,
    twoFactorEnabled: false, // Not yet verified
    twoFactorSecret: TEST_TOTP_SECRETS.USER_2FA,
    twoFactorBackupCodes: null, // Codes not issued yet
  },
  // Paralegal user for testing role hierarchy
  {
    email: 'paralegal@example.com',
    username: 'paralegal1',
    firstName: 'Maria',
    lastName: 'Wojcik',
    password: 'password123',
    isActive: true,
    disclaimerAccepted: true,
    role: UserRole.PARALEGAL,
  },
];
