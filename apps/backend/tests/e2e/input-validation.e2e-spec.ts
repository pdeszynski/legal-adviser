/**
 * Temporary verification test for input validation feature
 * This test verifies that class-validator decorators are properly applied to DTOs
 * and that the ValidationPipe is correctly rejecting invalid input.
 *
 * DELETE THIS FILE AFTER VERIFICATION
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Input Validation (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure the same ValidationPipe as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth - Login Validation', () => {
    it('should reject login with empty username', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: '',
          password: 'validPassword123',
        })
        .expect(400);

      expect(response.body.message).toContain('Username is required');
    });

    it('should reject login with username too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'ab',
          password: 'validPassword123',
        })
        .expect(400);

      expect(response.body.message).toContain(
        'Username must be at least 3 characters long',
      );
    });

    it('should reject login with username containing invalid characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'user@name!',
          password: 'validPassword123',
        })
        .expect(400);

      expect(response.body.message).toContain(
        'Username can only contain letters, numbers, underscores, dots, and hyphens',
      );
    });

    it('should reject login with empty password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'validuser',
          password: '',
        })
        .expect(400);

      expect(response.body.message).toContain('Password is required');
    });

    it('should reject login with password too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'validuser',
          password: 'short',
        })
        .expect(400);

      expect(response.body.message).toContain(
        'Password must be at least 8 characters long',
      );
    });

    it('should reject login with non-whitelisted properties', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'validuser',
          password: 'validPassword123',
          extraField: 'should be rejected',
        })
        .expect(400);

      expect(response.body.message).toContain(
        'property extraField should not exist',
      );
    });

    it('should accept valid login credentials (but return 401 for non-existent user)', async () => {
      // Valid format should pass validation but fail authentication
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'validuser',
          password: 'validPassword123',
        })
        .expect(401);

      // If we get 401, validation passed (would be 400 for validation errors)
      expect(response.status).toBe(401);
    });
  });

  describe('String Sanitization', () => {
    it('should trim whitespace from username', async () => {
      // The transform decorator should trim the username
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: '  validuser  ',
          password: 'validPassword123',
        })
        .expect(401); // Passes validation, fails auth

      // Validation passed means sanitization worked
      expect(response.status).toBe(401);
    });
  });

  describe('Validation Pipe Configuration', () => {
    it('should strip non-whitelisted properties when whitelist is true', async () => {
      // When forbidNonWhitelisted is true, this should return 400
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'validuser',
          password: 'validPassword123',
          maliciousField: '<script>alert("xss")</script>',
        });

      // Should reject because of forbidNonWhitelisted
      expect(response.status).toBe(400);
    });
  });
});
