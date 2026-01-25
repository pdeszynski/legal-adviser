import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TotpService } from './totp.service';

describe('TotpService', () => {
  let service: TotpService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TotpService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TotpService>(TotpService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock default config values
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, unknown> = {
        TOTP_APP_NAME: 'Legal AI Platform',
        TOTP_ALGORITHM: 'sha1',
        TOTP_DIGITS: 6,
        TOTP_PERIOD: 30,
        TOTP_WINDOW: 1,
      };
      return config[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSecret', () => {
    it('should generate a base32 secret', () => {
      const result = service.generateSecret('test@example.com');

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('otpauthUrl');

      // Secret should be base32 encoded (uppercase letters and digits 2-7)
      expect(result.secret).toMatch(/^[A-Z2-7]+$/);

      // Secret should be reasonable length (otplib default is 16 chars)
      expect(result.secret.length).toBeGreaterThanOrEqual(16);
    });

    it('should generate otpauth URL with correct format', () => {
      const result = service.generateSecret('test@example.com');

      // Should be a valid otpauth URL
      // Note: @ is URL-encoded as %40, and otplib adds additional params
      expect(result.otpauthUrl).toMatch(
        /^otpauth:\/\/totp\/Legal%20AI%20Platform:test%40example\.com\?secret=[A-Z2-7]+/,
      );
    });

    it('should include custom app name from config', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, unknown> = {
          TOTP_APP_NAME: 'CustomApp',
          TOTP_ALGORITHM: 'sha1',
          TOTP_DIGITS: 6,
          TOTP_PERIOD: 30,
          TOTP_WINDOW: 1,
        };
        return config[key];
      });

      // Create new service instance with updated config
      const newService = new TotpService(configService);
      const result = newService.generateSecret('test@example.com');

      expect(result.otpauthUrl).toContain('CustomApp');
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code as data URL', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const result = await service.generateQRCode(secret, 'test@example.com');

      expect(result).toHaveProperty('dataUrl');
      expect(result).toHaveProperty('otpauthUrl');

      // Should be a valid base64 image data URL
      expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should generate otpauth URL matching secret', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const result = await service.generateQRCode(secret, 'test@example.com');

      expect(result.otpauthUrl).toContain(secret);
      // @ is URL-encoded as %40
      expect(result.otpauthUrl).toContain('test%40example.com');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = service.generateCurrentToken(secret);

      const result = service.verifyToken(secret, token);

      expect(result.valid).toBe(true);
    });

    it('should reject an invalid token', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const invalidToken = '000000';

      const result = service.verifyToken(secret, invalidToken);

      expect(result.valid).toBe(false);
    });

    it('should reject tokens with wrong length', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const shortToken = '12345';

      const result = service.verifyToken(secret, shortToken);

      expect(result.valid).toBe(false);
    });

    it('should reject non-numeric tokens', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const alphaToken = 'ABCDEF';

      const result = service.verifyToken(secret, alphaToken);

      expect(result.valid).toBe(false);
    });

    it('should reject empty tokens', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const emptyToken = '';

      const result = service.verifyToken(secret, emptyToken);

      expect(result.valid).toBe(false);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate 10 backup codes', () => {
      const result = service.generateBackupCodes();

      expect(result.codes).toHaveLength(10);
      expect(result.backupCodes).toHaveLength(10);
    });

    it('should generate codes in correct format', () => {
      const result = service.generateBackupCodes();

      result.codes.forEach((code) => {
        // Format: XXXX-XXXX-XXXX-XXXX (4 groups of 4 hex chars)
        expect(code).toMatch(
          /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/,
        );
      });
    });

    it('should generate unique codes', () => {
      const result = service.generateBackupCodes();

      const uniqueCodes = new Set(result.codes);
      expect(uniqueCodes.size).toBe(10);
    });

    it('should include both formatted and raw codes', () => {
      const result = service.generateBackupCodes();

      expect(result.codes[0]).toBe(result.backupCodes[0].code);
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify a valid backup code format', () => {
      const validCode = '1234-5678-9ABC-DEF0';

      const result = service.verifyBackupCode(validCode);

      expect(result).toBe(true);
    });

    it('should verify lowercase backup codes', () => {
      const lowercaseCode = '1234-5678-9abc-def0';

      const result = service.verifyBackupCode(lowercaseCode);

      // Should be true - uppercase conversion is expected
      expect(result).toBe(true);
    });

    it('should reject codes with wrong format', () => {
      const invalidFormats = [
        '123456789ABCDEF0', // No dashes
        '1234-5678-9ABC-DEF', // Too short
        '1234-5678-9ABC-DEF0-1234', // Too long
        'XXXX-XXXX-XXXX-XXXX', // Invalid hex
        '', // Empty
      ];

      invalidFormats.forEach((code) => {
        expect(service.verifyBackupCode(code)).toBe(false);
      });
    });
  });

  describe('generateCurrentToken', () => {
    it('should generate a 6-digit token', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = service.generateCurrentToken(secret);

      expect(token).toMatch(/^\d{6}$/);
    });

    it('should generate tokens that verify successfully', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = service.generateCurrentToken(secret);

      const result = service.verifyToken(secret, token);

      expect(result.valid).toBe(true);
    });
  });

  describe('getTimeRemaining', () => {
    it('should return a positive number less than period', () => {
      const timeRemaining = service.getTimeRemaining();

      expect(timeRemaining).toBeGreaterThanOrEqual(0);
      expect(timeRemaining).toBeLessThanOrEqual(30);
    });
  });
});
