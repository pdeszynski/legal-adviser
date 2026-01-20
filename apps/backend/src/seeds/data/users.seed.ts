/**
 * User seed data for development and testing
 * Includes admin user and sample users
 */
export interface UserSeedData {
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  password: string;
  isActive: boolean;
  disclaimerAccepted: boolean;
}

export const usersSeedData: UserSeedData[] = [
  // Admin user - required by specification
  {
    email: 'admin@refine.dev',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    password: 'password',
    isActive: true,
    disclaimerAccepted: true,
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
  },
  // Sample regular user
  {
    email: 'user@example.com',
    username: 'user1',
    firstName: 'Anna',
    lastName: 'Nowak',
    password: 'password123',
    isActive: true,
    disclaimerAccepted: false,
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
  },
];
