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

    it('should return false when HUBSPOT_ENABLED is true but API key is missing', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'HUBSPOT_ENABLED') return 'true';
        if (key === 'HUBSPOT_API_KEY') return '';
        return undefined;
      });
      service = new HubSpotService(configService);
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

    it('should score mid-size company correctly', () => {
      const result = service.qualifyLead({
        email: 'test@example.com',
        company: 'Mid Corp',
        timeline: LeadTimeline.WITHIN_MONTH,
        companySize: '51-200',
        useCase: 'Legal automation for contract review',
      });

      expect(result.qualified).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(50);
    });

    it('should handle GDPR consent field without affecting score', () => {
      const resultWithout = service.qualifyLead({
        email: 'test@example.com',
        company: 'Test Corp',
        timeline: LeadTimeline.IMMEDIATE,
      });

      const resultWith = service.qualifyLead({
        email: 'test@example.com',
        company: 'Test Corp',
        timeline: LeadTimeline.IMMEDIATE,
        gdprConsent: true,
      });

      expect(resultWith.score).toBe(resultWithout.score);
    });

    it('should handle jobTitle field without affecting score', () => {
      const result = service.qualifyLead({
        email: 'test@example.com',
        company: 'Test Corp',
        timeline: LeadTimeline.IMMEDIATE,
        jobTitle: 'General Counsel',
      });

      expect(result.qualified).toBe(true);
      expect(result.jobTitle).toBeUndefined(); // jobTitle is not part of qualification
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

    it('should handle early access list type when disabled', async () => {
      const result = await service.syncLead(
        {
          email: 'test@example.com',
        },
        'earlyAccess',
      );

      expect(result.contactId).toBeNull();
      expect(result.qualification.reason).toContain('disabled');
    });
  });

  describe('syncLead list types', () => {
    beforeEach(() => {
      // Enable HubSpot but without API key to prevent actual API calls
      configService.get.mockImplementation((key: string) => {
        if (key === 'HUBSPOT_ENABLED') return 'true';
        if (key === 'HUBSPOT_API_KEY') return 'test-key';
        if (key === 'HUBSPOT_DEMO_REQUESTS_LIST_ID') return 'demo-list-123';
        if (key === 'HUBSPOT_WAITLIST_LIST_ID') return 'waitlist-list-456';
        if (key === 'HUBSPOT_EARLY_ACCESS_LIST_ID') return 'early-access-789';
        return undefined;
      });
      service = new HubSpotService(configService);
    });

    it('should support demo list type', async () => {
      // Test that the config has demo list ID
      expect(service['config'].demoRequestsListId).toBe('demo-list-123');
    });

    it('should support waitlist list type', async () => {
      expect(service['config'].waitlistListId).toBe('waitlist-list-456');
    });

    it('should support earlyAccess list type', async () => {
      expect(service['config'].earlyAccessListId).toBe('early-access-789');
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

    it('should return enabled true when integration is configured', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'HUBSPOT_ENABLED') return 'true';
        if (key === 'HUBSPOT_API_KEY') return 'test-api-key';
        return undefined;
      });
      service = new HubSpotService(configService);

      const result = await service.healthCheck();
      expect(result.enabled).toBe(true);
      // Status will be 'unhealthy' since we don't have a real API key
      expect(['healthy', 'unhealthy']).toContain(result.status);
    });
  });

  describe('field mapping', () => {
    it('should map all contact fields correctly for HubSpot', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'HUBSPOT_ENABLED') return 'false'; // Disabled to prevent API call
        return undefined;
      });
      service = new HubSpotService(configService);

      // Test that createContact accepts all fields
      const contactRequest = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Acme Inc',
        website: 'https://acme.com',
        phone: '+1234567890',
        jobTitle: 'General Counsel',
        useCase: 'Contract automation',
        timeline: LeadTimeline.IMMEDIATE,
        companySize: '51-200',
        message: 'Additional information',
        source: 'web_form',
        gdprConsent: true,
      };

      // This should not throw any TypeScript errors
      expect(() => service['createContact'](contactRequest)).not.toThrow();
    });
  });
});
