import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Session Mode Enum
 *
 * Defines the mode of operation for a user session:
 * - LAWYER: Professional mode with advanced features
 * - SIMPLE: Simplified mode for regular users
 */
export enum SessionMode {
  LAWYER = 'LAWYER',
  SIMPLE = 'SIMPLE',
}

/**
 * UserSession Entity
 *
 * Tracks user sessions with context (Lawyer vs Simple mode)
 * and legal disclaimer acceptance status.
 *
 * Aggregate Root: UserSession
 * Invariants: A valid UserSession requires disclaimer_accepted = true
 * before allowing creation of LegalDocument or LegalQuery.
 */
@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: SessionMode,
    default: SessionMode.SIMPLE,
  })
  mode: SessionMode;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  /**
   * Check if the session is currently active
   */
  isActive(): boolean {
    return this.startedAt !== null && this.endedAt === null;
  }

  /**
   * Start the session
   */
  start(): void {
    this.startedAt = new Date();
    this.endedAt = null;
  }

  /**
   * End the session
   */
  end(): void {
    this.endedAt = new Date();
  }
}

