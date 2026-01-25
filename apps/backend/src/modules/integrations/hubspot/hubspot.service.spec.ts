import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HubSpotService } from './hubspot.service';
import { LeadTimeline } from './dto/hubspot.types';

describe('HubSpotService', () => {
  let service: HubSpotService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HubSpotService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HubSpotService>(HubSpotService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isEnabled', () => {
    it('should return false when HUBSPOT_ENABLED is not set', () => {
      configService.get.mockReturnValue(undefined);
      expect(service.isEnabled()).toBe(false);
    });

    it('should return false when HUBSPOT_ENABLED is false', () => {
      configService.get.mockReturnValue('false');
      expect(service.isEnabled()).toBe(false);
    });

    it('should return true when HUBSPOT_ENABLED is true and API key is set', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'HUBSPOT_ENABLED') return 'true';
        if (key === 'HUBSPOT_API_KEY') return 'test-api-key';
        return undefined;
      });
      // Recreate service with new config
      service = new HubSpotService(configService);
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe('qualifyLead', () => {
    it('should qualify lead with immediate timeline and company', () => {
      const result = service.qualifyLead({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Acme Inc',
        timeline: LeadTimeline.IMMEDIATE,
        useCase: 'Need legal document automation for our team',
      });

      expect(result.qualified).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(50);
    });

    it('should not qualify lead with exploring timeline and no company', () => {
      const result = service.qualifyLead({
        email: 'test@example.com',
        timeline: LeadTimeline.EXPLORING,
      });

      expect(result.qualified).toBe(false);
      expect(result.score).toBeLessThan(50);
    });

    it('should give maximum score for enterprise with immediate timeline', () => {
      const result = service.qualifyLead({
        email: 'test@example.com',
        company: 'Enterprise Corp',
        timeline: LeadTimeline.IMMEDIATE,
        companySize: '500+ employees',
        useCase:
          'This is a very detailed use case that shows the user is serious about implementing the solution',
        website: 'https://enterprise.com',
      });

      expect(result.qualified).toBe(true);
      expect(result.score).toBeGreaterThan(100);
    });
  });

  describe('syncLead when disabled', () => {
    beforeEach(() => {
      configService.get.mockReturnValue(undefined);
      service = new HubSpotService(configService);
    });

    it('should return null contactId and disabled reason', async () => {
      const result = await service.syncLead({
        email: 'test@example.com',
      });

      expect(result.contactId).toBeNull();
      expect(result.qualification.qualified).toBe(false);
      expect(result.qualification.reason).toContain('disabled');
    });
  });

  describe('healthCheck', () => {
    it('should return disabled status when integration is disabled', async () => {
      configService.get.mockReturnValue(undefined);
      service = new HubSpotService(configService);

      const result = await service.healthCheck();
      expect(result.status).toBe('disabled');
      expect(result.enabled).toBe(false);
    });
  });
});
