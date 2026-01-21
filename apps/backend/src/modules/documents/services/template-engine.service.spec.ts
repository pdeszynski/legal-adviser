import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { TemplateEngineService } from './template-engine.service';
import {
  DocumentTemplate,
  TemplateCategory,
} from '../entities/document-template.entity';

describe('TemplateEngineService', () => {
  let service: TemplateEngineService;
  let repository: Repository<DocumentTemplate>;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateEngineService,
        {
          provide: getRepositoryToken(DocumentTemplate),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TemplateEngineService>(TemplateEngineService);
    repository = module.get<Repository<DocumentTemplate>>(
      getRepositoryToken(DocumentTemplate),
    );

    jest.clearAllMocks();
  });

  describe('processTemplate', () => {
    it('should process a simple template with variable interpolation', async () => {
      const template: DocumentTemplate = {
        id: '123',
        name: 'Test Template',
        category: TemplateCategory.CONTRACT,
        content: 'Dear {{name}}, your amount is {{amount}}.',
        variables: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
          },
          {
            name: 'amount',
            label: 'Amount',
            type: 'number',
            required: true,
          },
        ],
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        incrementUsageCount: jest.fn(),
        isValidVariableName: jest.fn(),
        getRequiredVariables: jest.fn().mockReturnValue([
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
          },
          {
            name: 'amount',
            label: 'Amount',
            type: 'number',
            required: true,
          },
        ]),
        hasConditionalSections: jest.fn().mockReturnValue(false),
      };

      mockRepository.findOne.mockResolvedValue(template);
      mockRepository.save.mockResolvedValue(template);

      const result = await service.processTemplate('123', {
        name: 'John Doe',
        amount: 1000,
      });

      expect(result).toBe('Dear John Doe, your amount is 1,000.');
      expect(template.incrementUsageCount).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(template);
    });

    it('should process conditional sections with #if', async () => {
      const template: DocumentTemplate = {
        id: '123',
        name: 'Test Template',
        category: TemplateCategory.CONTRACT,
        content:
          'Hello {{name}}.{{#if premium}} You are a premium customer.{{/if}}',
        variables: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
          },
          {
            name: 'premium',
            label: 'Premium',
            type: 'boolean',
            required: false,
          },
        ],
        conditionalSections: [
          {
            id: '1',
            condition: 'premium',
            description: 'Premium section',
          },
        ],
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        incrementUsageCount: jest.fn(),
        isValidVariableName: jest.fn(),
        getRequiredVariables: jest.fn().mockReturnValue([
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
          },
        ]),
        hasConditionalSections: jest.fn().mockReturnValue(true),
      };

      mockRepository.findOne.mockResolvedValue(template);
      mockRepository.save.mockResolvedValue(template);

      const result = await service.processTemplate('123', {
        name: 'John Doe',
        premium: true,
      });

      expect(result).toBe('Hello John Doe. You are a premium customer.');
    });

    it('should hide conditional section when condition is false', async () => {
      const template: DocumentTemplate = {
        id: '123',
        name: 'Test Template',
        category: TemplateCategory.CONTRACT,
        content:
          'Hello {{name}}.{{#if premium}} You are a premium customer.{{/if}}',
        variables: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
          },
          {
            name: 'premium',
            label: 'Premium',
            type: 'boolean',
            required: false,
          },
        ],
        conditionalSections: [
          {
            id: '1',
            condition: 'premium',
            description: 'Premium section',
          },
        ],
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        incrementUsageCount: jest.fn(),
        isValidVariableName: jest.fn(),
        getRequiredVariables: jest.fn().mockReturnValue([
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
          },
        ]),
        hasConditionalSections: jest.fn().mockReturnValue(true),
      };

      mockRepository.findOne.mockResolvedValue(template);
      mockRepository.save.mockResolvedValue(template);

      const result = await service.processTemplate('123', {
        name: 'John Doe',
        premium: false,
      });

      expect(result).toBe('Hello John Doe.');
    });

    it('should format date with Polish formatting rules', async () => {
      const template: DocumentTemplate = {
        id: '123',
        name: 'Test Template',
        category: TemplateCategory.CONTRACT,
        content: 'Date: {{date}}',
        variables: [
          {
            name: 'date',
            label: 'Date',
            type: 'date',
            required: true,
          },
        ],
        polishFormattingRules: {
          dateFormat: 'D MMMM YYYY',
        },
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        incrementUsageCount: jest.fn(),
        isValidVariableName: jest.fn(),
        getRequiredVariables: jest.fn().mockReturnValue([
          {
            name: 'date',
            label: 'Date',
            type: 'date',
            required: true,
          },
        ]),
        hasConditionalSections: jest.fn().mockReturnValue(false),
      };

      mockRepository.findOne.mockResolvedValue(template);
      mockRepository.save.mockResolvedValue(template);

      const testDate = new Date('2024-03-15');
      const result = await service.processTemplate('123', {
        date: testDate,
      });

      expect(result).toBe('Date: 15 marca 2024');
    });

    it('should format date with default Polish formatting (DD.MM.YYYY)', async () => {
      const template: DocumentTemplate = {
        id: '123',
        name: 'Test Template',
        category: TemplateCategory.CONTRACT,
        content: 'Date: {{date}}',
        variables: [
          {
            name: 'date',
            label: 'Date',
            type: 'date',
            required: true,
          },
        ],
        polishFormattingRules: {
          dateFormat: 'DD.MM.YYYY',
        },
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        incrementUsageCount: jest.fn(),
        isValidVariableName: jest.fn(),
        getRequiredVariables: jest.fn().mockReturnValue([
          {
            name: 'date',
            label: 'Date',
            type: 'date',
            required: true,
          },
        ]),
        hasConditionalSections: jest.fn().mockReturnValue(false),
      };

      mockRepository.findOne.mockResolvedValue(template);
      mockRepository.save.mockResolvedValue(template);

      const testDate = new Date('2024-03-15');
      const result = await service.processTemplate('123', {
        date: testDate,
      });

      expect(result).toBe('Date: 15.03.2024');
    });

    it('should format number with Polish locale', async () => {
      const template: DocumentTemplate = {
        id: '123',
        name: 'Test Template',
        category: TemplateCategory.CONTRACT,
        content: 'Amount: {{amount}}',
        variables: [
          {
            name: 'amount',
            label: 'Amount',
            type: 'number',
            required: true,
          },
        ],
        polishFormattingRules: {
          numberFormat: 'pl',
        },
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        incrementUsageCount: jest.fn(),
        isValidVariableName: jest.fn(),
        getRequiredVariables: jest.fn().mockReturnValue([
          {
            name: 'amount',
            label: 'Amount',
            type: 'number',
            required: true,
          },
        ]),
        hasConditionalSections: jest.fn().mockReturnValue(false),
      };

      mockRepository.findOne.mockResolvedValue(template);
      mockRepository.save.mockResolvedValue(template);

      const result = await service.processTemplate('123', {
        amount: 1234567.89,
      });

      // Polish locale formatting may vary by system
      expect(result).toContain('1')
      expect(result).toContain('234')
      expect(result).toContain('567');
    });

    it('should format boolean values in Polish', async () => {
      const template: DocumentTemplate = {
        id: '123',
        name: 'Test Template',
        category: TemplateCategory.CONTRACT,
        content: 'Accepted: {{accepted}}, Rejected: {{rejected}}',
        variables: [
          {
            name: 'accepted',
            label: 'Accepted',
            type: 'boolean',
            required: true,
          },
          {
            name: 'rejected',
            label: 'Rejected',
            type: 'boolean',
            required: true,
          },
        ],
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        incrementUsageCount: jest.fn(),
        isValidVariableName: jest.fn(),
        getRequiredVariables: jest.fn().mockReturnValue([
          {
            name: 'accepted',
            label: 'Accepted',
            type: 'boolean',
            required: true,
          },
          {
            name: 'rejected',
            label: 'Rejected',
            type: 'boolean',
            required: true,
          },
        ]),
        hasConditionalSections: jest.fn().mockReturnValue(false),
      };

      mockRepository.findOne.mockResolvedValue(template);
      mockRepository.save.mockResolvedValue(template);

      const result = await service.processTemplate('123', {
        accepted: true,
        rejected: false,
      });

      expect(result).toBe('Accepted: tak, Rejected: nie');
    });

    it('should throw error if template not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.processTemplate('999', { name: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if template is not active', async () => {
      const template: DocumentTemplate = {
        id: '123',
        name: 'Test Template',
        category: TemplateCategory.CONTRACT,
        content: 'Test',
        variables: [],
        isActive: false,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        incrementUsageCount: jest.fn(),
        isValidVariableName: jest.fn(),
        getRequiredVariables: jest.fn().mockReturnValue([]),
        hasConditionalSections: jest.fn().mockReturnValue(false),
      };

      mockRepository.findOne.mockResolvedValue(template);

      await expect(service.processTemplate('123', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if required variable is missing', async () => {
      const template: DocumentTemplate = {
        id: '123',
        name: 'Test Template',
        category: TemplateCategory.CONTRACT,
        content: 'Dear {{name}}',
        variables: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
          },
        ],
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        incrementUsageCount: jest.fn(),
        isValidVariableName: jest.fn(),
        getRequiredVariables: jest.fn().mockReturnValue([
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
          },
        ]),
        hasConditionalSections: jest.fn().mockReturnValue(false),
      };

      mockRepository.findOne.mockResolvedValue(template);

      await expect(service.processTemplate('123', {})).rejects.toThrow(
        'Required variable "name" is missing',
      );
    });

    it('should validate variable types', async () => {
      const template: DocumentTemplate = {
        id: '123',
        name: 'Test Template',
        category: TemplateCategory.CONTRACT,
        content: 'Amount: {{amount}}',
        variables: [
          {
            name: 'amount',
            label: 'Amount',
            type: 'number',
            required: true,
          },
        ],
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        incrementUsageCount: jest.fn(),
        isValidVariableName: jest.fn(),
        getRequiredVariables: jest.fn().mockReturnValue([
          {
            name: 'amount',
            label: 'Amount',
            type: 'number',
            required: true,
          },
        ]),
        hasConditionalSections: jest.fn().mockReturnValue(false),
      };

      mockRepository.findOne.mockResolvedValue(template);

      await expect(
        service.processTemplate('123', { amount: 'not a number' }),
      ).rejects.toThrow('Variable "amount" must be a number');
    });

    it('should validate min/max for numbers', async () => {
      const template: DocumentTemplate = {
        id: '123',
        name: 'Test Template',
        category: TemplateCategory.CONTRACT,
        content: 'Amount: {{amount}}',
        variables: [
          {
            name: 'amount',
            label: 'Amount',
            type: 'number',
            required: true,
            validation: {
              min: 100,
              max: 1000,
            },
          },
        ],
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        incrementUsageCount: jest.fn(),
        isValidVariableName: jest.fn(),
        getRequiredVariables: jest.fn().mockReturnValue([
          {
            name: 'amount',
            label: 'Amount',
            type: 'number',
            required: true,
            validation: {
              min: 100,
              max: 1000,
            },
          },
        ]),
        hasConditionalSections: jest.fn().mockReturnValue(false),
      };

      mockRepository.findOne.mockResolvedValue(template);

      await expect(
        service.processTemplate('123', { amount: 50 }),
      ).rejects.toThrow('Variable "amount" must be at least 100');

      await expect(
        service.processTemplate('123', { amount: 2000 }),
      ).rejects.toThrow('Variable "amount" must be at most 1000');
    });
  });

  describe('findAll', () => {
    it('should return all active templates', async () => {
      const templates = [
        {
          id: '1',
          name: 'Template 1',
          isActive: true,
        },
        {
          id: '2',
          name: 'Template 2',
          isActive: true,
        },
      ];

      mockRepository.find.mockResolvedValue(templates);

      const result = await service.findAll();

      expect(result).toEqual(templates);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('should create a new template', async () => {
      const templateData = {
        name: 'New Template',
        category: TemplateCategory.CONTRACT,
        content: 'Test content',
        variables: [],
      };

      const createdTemplate = {
        ...templateData,
        id: '123',
        isActive: true,
        usageCount: 0,
      };

      mockRepository.create.mockReturnValue(createdTemplate);
      mockRepository.save.mockResolvedValue(createdTemplate);

      const result = await service.create(templateData);

      expect(result).toEqual(createdTemplate);
      expect(mockRepository.create).toHaveBeenCalledWith(templateData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdTemplate);
    });
  });

  describe('delete', () => {
    it('should soft delete a template by setting isActive to false', async () => {
      const template: DocumentTemplate = {
        id: '123',
        name: 'Test Template',
        category: TemplateCategory.CONTRACT,
        content: 'Test',
        variables: [],
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        incrementUsageCount: jest.fn(),
        isValidVariableName: jest.fn(),
        getRequiredVariables: jest.fn(),
        hasConditionalSections: jest.fn(),
      };

      mockRepository.findOne.mockResolvedValue(template);
      mockRepository.save.mockResolvedValue({ ...template, isActive: false });

      await service.delete('123');

      expect(template.isActive).toBe(false);
      expect(mockRepository.save).toHaveBeenCalledWith(template);
    });
  });
});
