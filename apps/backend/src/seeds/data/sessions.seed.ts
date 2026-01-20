import { SessionMode } from '../../modules/users/entities/user-session.entity';

/**
 * User session seed data for development and testing
 * Sessions will be associated with users based on their email
 */
export interface SessionSeedData {
  userEmail: string;
  mode: SessionMode;
  isActive: boolean;
}

export const sessionsSeedData: SessionSeedData[] = [
  // Admin's active lawyer session
  {
    userEmail: 'admin@refine.dev',
    mode: SessionMode.LAWYER,
    isActive: true,
  },
  // Lawyer's active lawyer session
  {
    userEmail: 'lawyer@example.com',
    mode: SessionMode.LAWYER,
    isActive: true,
  },
  // Lawyer's completed session
  {
    userEmail: 'lawyer@example.com',
    mode: SessionMode.SIMPLE,
    isActive: false,
  },
  // Regular user's active simple session
  {
    userEmail: 'user@example.com',
    mode: SessionMode.SIMPLE,
    isActive: true,
  },
  // Minimal user's active simple session
  {
    userEmail: 'minimal@example.com',
    mode: SessionMode.SIMPLE,
    isActive: true,
  },
];
