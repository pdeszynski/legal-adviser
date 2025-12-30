import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiClientService } from './ai-client.service';

describe('AiClientService', () => {
  let service: AiClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule.register({
          timeout: 30000,
          maxRedirects: 5,
        }),
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [AiClientService],
    }).compile();

    service = module.get<AiClientService>(AiClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should have a healthCheck method', () => {
      expect(service.healthCheck).toBeDefined();
    });
  });

  describe('generateDocument', () => {
    it('should have a generateDocument method', () => {
      expect(service.generateDocument).toBeDefined();
    });
  });

  describe('askQuestion', () => {
    it('should have an askQuestion method', () => {
      expect(service.askQuestion).toBeDefined();
    });
  });

  describe('searchRulings', () => {
    it('should have a searchRulings method', () => {
      expect(service.searchRulings).toBeDefined();
    });
  });
});
