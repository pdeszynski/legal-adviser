/**
 * Temporary verification test for LoginDto validation
 * DELETE THIS FILE AFTER VERIFICATION
 */
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './login.dto';

describe('LoginDto Validation', () => {
  describe('username validation', () => {
    it('should reject empty username', async () => {
      const dto = plainToInstance(LoginDto, {
        username: '',
        password: 'validPassword123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'username')).toBe(true);
    });

    it('should reject username shorter than 3 characters', async () => {
      const dto = plainToInstance(LoginDto, {
        username: 'ab',
        password: 'validPassword123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should reject username with invalid characters', async () => {
      const dto = plainToInstance(LoginDto, {
        username: 'user@name!',
        password: 'validPassword123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should accept valid username with letters, numbers, dots and hyphens', async () => {
      const dto = plainToInstance(LoginDto, {
        username: 'valid.user-123',
        password: 'validPassword123',
      });

      const errors = await validate(dto);
      const usernameErrors = errors.filter((e) => e.property === 'username');
      expect(usernameErrors.length).toBe(0);
    });

    it('should trim whitespace from username', async () => {
      const dto = plainToInstance(LoginDto, {
        username: '  validuser  ',
        password: 'validPassword123',
      });

      expect(dto.username).toBe('validuser');
    });
  });

  describe('password validation', () => {
    it('should reject empty password', async () => {
      const dto = plainToInstance(LoginDto, {
        username: 'validuser',
        password: '',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should reject password shorter than 8 characters', async () => {
      const dto = plainToInstance(LoginDto, {
        username: 'validuser',
        password: 'short',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should reject password longer than 128 characters', async () => {
      const dto = plainToInstance(LoginDto, {
        username: 'validuser',
        password: 'a'.repeat(129),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should accept valid password', async () => {
      const dto = plainToInstance(LoginDto, {
        username: 'validuser',
        password: 'validPassword123!@#',
      });

      const errors = await validate(dto);
      const passwordErrors = errors.filter((e) => e.property === 'password');
      expect(passwordErrors.length).toBe(0);
    });
  });

  describe('complete DTO validation', () => {
    it('should accept valid login credentials', async () => {
      const dto = plainToInstance(LoginDto, {
        username: 'john.doe-123',
        password: 'securePassword123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
