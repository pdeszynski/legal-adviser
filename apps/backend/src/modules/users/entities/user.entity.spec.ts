import { User } from './user.entity';

describe('User Entity', () => {
  describe('properties', () => {
    it('should have all required properties defined', () => {
      const user = new User();
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).toHaveProperty('isActive');
      expect(user).toHaveProperty('disclaimerAccepted');
      expect(user).toHaveProperty('sessions');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });
  });

  describe('canCreateContent', () => {
    it('should return true when disclaimer is accepted and user is active', () => {
      const user = new User();
      user.disclaimerAccepted = true;
      user.isActive = true;

      expect(user.canCreateContent()).toBe(true);
    });

    it('should return false when disclaimer is not accepted', () => {
      const user = new User();
      user.disclaimerAccepted = false;
      user.isActive = true;

      expect(user.canCreateContent()).toBe(false);
    });

    it('should return false when user is not active', () => {
      const user = new User();
      user.disclaimerAccepted = true;
      user.isActive = false;

      expect(user.canCreateContent()).toBe(false);
    });

    it('should return false when both disclaimer not accepted and user not active', () => {
      const user = new User();
      user.disclaimerAccepted = false;
      user.isActive = false;

      expect(user.canCreateContent()).toBe(false);
    });
  });

  describe('data validation', () => {
    it('should allow nullable username, firstName, and lastName', () => {
      const user = new User();
      user.email = 'test@example.com';
      user.username = null;
      user.firstName = null;
      user.lastName = null;

      expect(user.email).toBe('test@example.com');
      expect(user.username).toBeNull();
      expect(user.firstName).toBeNull();
      expect(user.lastName).toBeNull();
    });
  });
});
