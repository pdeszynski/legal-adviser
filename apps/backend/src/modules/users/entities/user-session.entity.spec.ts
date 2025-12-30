import { UserSession, SessionMode } from './user-session.entity';

describe('UserSession Entity', () => {
  describe('properties', () => {
    it('should have all required properties defined', () => {
      const session = new UserSession();
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('userId');
      expect(session).toHaveProperty('user');
      expect(session).toHaveProperty('mode');
      expect(session).toHaveProperty('startedAt');
      expect(session).toHaveProperty('endedAt');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('updatedAt');
    });
  });

  describe('isActive', () => {
    it('should return true when session is started and not ended', () => {
      const session = new UserSession();
      session.startedAt = new Date();
      session.endedAt = null;

      expect(session.isActive()).toBe(true);
    });

    it('should return false when session is not started', () => {
      const session = new UserSession();
      session.startedAt = null;
      session.endedAt = null;

      expect(session.isActive()).toBe(false);
    });

    it('should return false when session is ended', () => {
      const session = new UserSession();
      session.startedAt = new Date();
      session.endedAt = new Date();

      expect(session.isActive()).toBe(false);
    });
  });

  describe('session lifecycle', () => {
    it('should start session by setting startedAt and clearing endedAt', () => {
      const session = new UserSession();
      session.endedAt = new Date();

      session.start();

      expect(session.startedAt).toBeInstanceOf(Date);
      expect(session.endedAt).toBeNull();
    });

    it('should end session by setting endedAt', () => {
      const session = new UserSession();
      session.startedAt = new Date();

      session.end();

      expect(session.endedAt).toBeInstanceOf(Date);
    });

    it('should allow restarting an ended session', () => {
      const session = new UserSession();
      session.start();
      session.end();

      expect(session.isActive()).toBe(false);

      session.start();

      expect(session.isActive()).toBe(true);
    });
  });

  describe('SessionMode enum', () => {
    it('should have LAWYER and SIMPLE values', () => {
      expect(SessionMode.LAWYER).toBe('LAWYER');
      expect(SessionMode.SIMPLE).toBe('SIMPLE');
    });

    it('should allow setting session mode', () => {
      const session = new UserSession();
      session.mode = SessionMode.LAWYER;

      expect(session.mode).toBe(SessionMode.LAWYER);

      session.mode = SessionMode.SIMPLE;

      expect(session.mode).toBe(SessionMode.SIMPLE);
    });
  });
});
