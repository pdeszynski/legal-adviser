import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    validateUserCredentials: jest.fn(),
    createUser: jest.fn(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findById: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_ACCESS_EXPIRY: '60m',
        JWT_REFRESH_EXPIRY: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'test-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user payload for valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        isActive: true,
      };

      mockUsersService.validateUserCredentials.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeDefined();
      expect(result?.userId).toBe('user-123');
      expect(result?.email).toBe('test@example.com');
      expect(result?.roles).toContain('user');
    });

    it('should return null for invalid credentials', async () => {
      mockUsersService.validateUserCredentials.mockResolvedValue(null);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token', () => {
      const userPayload = {
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
      };

      const result = service.login(userPayload);

      expect(result.access_token).toBe('test-token');
    });
  });
});
