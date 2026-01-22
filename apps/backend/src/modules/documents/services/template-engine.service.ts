import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DocumentTemplate,
  TemplateVariable,
  PolishFormattingRules,
} from '../entities/document-template.entity';

interface TemplateContext {
  [key: string]: string | number | boolean | Date;
}

@Injectable()
export class TemplateEngineService {
  constructor(
    @InjectRepository(DocumentTemplate)
    private readonly templateRepository: Repository<DocumentTemplate>,
  ) {}

  async processTemplate(
    templateId: string,
    context: TemplateContext,
  ): Promise<string> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new BadRequestException(`Template with ID ${templateId} not found`);
    }

    if (!template.isActive) {
      throw new BadRequestException(`Template ${template.name} is not active`);
    }

    this.validateContext(template, context);

    let processedContent = template.content;

    processedContent = this.processConditionals(
      processedContent,
      context,
      template,
    );

    processedContent = this.interpolateVariables(
      processedContent,
      context,
      template.polishFormattingRules,
    );

    template.incrementUsageCount();
    await this.templateRepository.save(template);

    return processedContent;
  }

  private validateContext(
    template: DocumentTemplate,
    context: TemplateContext,
  ): void {
    const requiredVars = template.getRequiredVariables();

    for (const variable of requiredVars) {
      if (!(variable.name in context)) {
        throw new BadRequestException(
          `Required variable "${variable.name}" is missing`,
        );
      }

      const value = context[variable.name];
      this.validateVariable(variable, value);
    }

    for (const variable of template.variables) {
      if (variable.name in context) {
        const value = context[variable.name];
        this.validateVariable(variable, value);
      }
    }
  }

  private validateVariable(
    variable: TemplateVariable,
    value: string | number | boolean | Date,
  ): void {
    if (variable.type === 'number' && typeof value !== 'number') {
      throw new BadRequestException(
        `Variable "${variable.name}" must be a number`,
      );
    }

    if (variable.type === 'boolean' && typeof value !== 'boolean') {
      throw new BadRequestException(
        `Variable "${variable.name}" must be a boolean`,
      );
    }

    if (variable.type === 'text' && typeof value !== 'string') {
      throw new BadRequestException(
        `Variable "${variable.name}" must be a string`,
      );
    }

    if (variable.validation) {
      const { min, max, minLength, maxLength, pattern } = variable.validation;

      if (typeof value === 'number') {
        if (min !== undefined && value < min) {
          throw new BadRequestException(
            `Variable "${variable.name}" must be at least ${min}`,
          );
        }
        if (max !== undefined && value > max) {
          throw new BadRequestException(
            `Variable "${variable.name}" must be at most ${max}`,
          );
        }
      }

      if (typeof value === 'string') {
        if (minLength !== undefined && value.length < minLength) {
          throw new BadRequestException(
            `Variable "${variable.name}" must be at least ${minLength} characters`,
          );
        }
        if (maxLength !== undefined && value.length > maxLength) {
          throw new BadRequestException(
            `Variable "${variable.name}" must be at most ${maxLength} characters`,
          );
        }
        if (pattern !== undefined && !new RegExp(pattern).test(value)) {
          throw new BadRequestException(
            `Variable "${variable.name}" does not match required pattern`,
          );
        }
      }
    }
  }

  private processConditionals(
    content: string,
    context: TemplateContext,
    template: DocumentTemplate,
  ): string {
    if (!template.hasConditionalSections()) {
      return content;
    }

    let processed = content;

    const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    processed = processed.replace(ifRegex, (match, condition, innerContent) => {
      const value = context[condition];
      if (this.isTruthy(value)) {
        return innerContent;
      }
      return '';
    });

    const unlessRegex = /{{#unless\s+(\w+)}}([\s\S]*?){{\/unless}}/g;
    processed = processed.replace(
      unlessRegex,
      (match, condition, innerContent) => {
        const value = context[condition];
        if (!this.isTruthy(value)) {
          return innerContent;
        }
        return '';
      },
    );

    return processed;
  }

  private isTruthy(value: string | number | boolean | Date): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return true;
  }

  private interpolateVariables(
    content: string,
    context: TemplateContext,
    formattingRules?: PolishFormattingRules,
  ): string {
    let processed = content;

    const variableRegex = /{{(\w+)}}/g;
    processed = processed.replace(variableRegex, (match, varName) => {
      if (!(varName in context)) {
        return match;
      }

      const value = context[varName];
      return this.formatValue(value, formattingRules);
    });

    return processed;
  }

  private formatValue(
    value: string | number | boolean | Date,
    formattingRules?: PolishFormattingRules,
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return this.formatDate(value, formattingRules?.dateFormat);
    }

    if (typeof value === 'number') {
      return this.formatNumber(value, formattingRules?.numberFormat);
    }

    if (typeof value === 'boolean') {
      return value ? 'tak' : 'nie';
    }

    return String(value);
  }

  private formatDate(date: Date, format?: string): string {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    if (format === 'D MMMM YYYY') {
      const monthNames = [
        'stycznia',
        'lutego',
        'marca',
        'kwietnia',
        'maja',
        'czerwca',
        'lipca',
        'sierpnia',
        'września',
        'października',
        'listopada',
        'grudnia',
      ];
      return `${day} ${monthNames[date.getMonth()]} ${year}`;
    }

    const paddedDay = day.toString().padStart(2, '0');
    const paddedMonth = month.toString().padStart(2, '0');
    return `${paddedDay}.${paddedMonth}.${year}`;
  }

  private formatNumber(num: number, format?: string): string {
    if (format === 'pl') {
      return num.toLocaleString('pl-PL');
    }
    return num.toLocaleString('en-US');
  }

  async findById(id: string): Promise<DocumentTemplate | null> {
    return this.templateRepository.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<DocumentTemplate> {
    const template = await this.findById(id);
    if (!template) {
      throw new BadRequestException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async findAll(): Promise<DocumentTemplate[]> {
    return this.templateRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    templateData: Partial<DocumentTemplate>,
  ): Promise<DocumentTemplate> {
    const template = this.templateRepository.create(templateData);
    return this.templateRepository.save(template);
  }

  async update(
    id: string,
    updateData: Partial<DocumentTemplate>,
  ): Promise<DocumentTemplate> {
    const template = await this.findByIdOrFail(id);
    Object.assign(template, updateData);
    return this.templateRepository.save(template);
  }

  async delete(id: string): Promise<void> {
    const template = await this.findByIdOrFail(id);
    template.isActive = false;
    await this.templateRepository.save(template);
  }
}
