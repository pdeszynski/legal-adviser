/**
 * Startup Validation Module Tests
 *
 * These tests verify that the dependency health check and validation
 * utilities work correctly for enforcing service startup order.
 */

import axios from 'axios';
import {
  validateDependencies,
  waitForDependency,
  buildDependencyChecks,
} from './startup.validation';

// Mock axios module
jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('StartupValidation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateDependencies', () => {
    it('should return healthy result for responsive service', async () => {
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'ok' },
      } as any);

      const dependencies = [
        {
          name: 'Test Service',
          url: 'http://localhost:9999/health',
          required: true,
        },
      ];

      const results = await validateDependencies(dependencies);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Test Service');
      expect(results[0].healthy).toBe(true);
      expect(results[0].responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy result for failed service', async () => {
      // Create an AxiosError-like object
      const error = new Error('Connection refused');
      (error as unknown as { code: string }).code = 'ECONNREFUSED';
      (error as unknown as { isAxiosError: boolean }).isAxiosError = true;
      mockedAxios.get.mockRejectedValue(error);
      // Make axios.isAxiosError return true for our error
      mockedAxios.isAxiosError.mockReturnValue(true);

      const dependencies = [
        {
          name: 'Test Service',
          url: 'http://localhost:9999/health',
          required: true,
        },
      ];

      const results = await validateDependencies(dependencies);

      expect(results).toHaveLength(1);
      expect(results[0].healthy).toBe(false);
      expect(results[0].error).toBe('Connection refused');
    });

    it('should handle multiple dependencies', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ status: 200, data: { status: 'ok' } } as any)
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ status: 200, data: { status: 'ok' } } as any);

      const dependencies = [
        {
          name: 'Service A',
          url: 'http://localhost:8000/health',
          required: true,
        },
        {
          name: 'Service B',
          url: 'http://localhost:8001/health',
          required: false,
        },
        {
          name: 'Service C',
          url: 'http://localhost:8002/health',
          required: true,
        },
      ];

      const results = await validateDependencies(dependencies);

      expect(results).toHaveLength(3);
      expect(results[0].healthy).toBe(true);
      expect(results[1].healthy).toBe(false);
      expect(results[2].healthy).toBe(true);
    });
  });

  describe('waitForDependency', () => {
    it('should return true when dependency becomes healthy', async () => {
      let attemptCount = 0;
      mockedAxios.get.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Not ready'));
        }
        return Promise.resolve({ status: 200, data: { status: 'ok' } } as any);
      });

      const result = await waitForDependency('http://localhost:9999/health', {
        maxRetries: 5,
        retryDelay: 10,
        timeout: 1000,
      });

      expect(result).toBe(true);
      expect(attemptCount).toBe(3);
    });

    it('should return false when dependency never becomes healthy', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Not ready'));

      const result = await waitForDependency('http://localhost:9999/health', {
        maxRetries: 3,
        retryDelay: 10,
        timeout: 1000,
      });

      expect(result).toBe(false);
    });
  });

  describe('buildDependencyChecks', () => {
    it('should include AI Engine in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.AI_ENGINE_URL = 'http://ai-engine:8000';

      const dependencies = buildDependencyChecks();

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0].name).toBe('AI Engine');
      expect(dependencies[0].required).toBe(true);
      expect(dependencies[0].url).toContain('8000/health');
    });

    it('should make AI Engine optional in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.AI_ENGINE_URL = 'http://localhost:8000';

      const dependencies = buildDependencyChecks();

      expect(dependencies).toHaveLength(1);
      expect(dependencies[0].name).toBe('AI Engine');
      expect(dependencies[0].required).toBe(false);
    });

    it('should skip AI Engine when SKIP_AI_ENGINE_CHECK is true', () => {
      process.env.NODE_ENV = 'production';
      process.env.SKIP_AI_ENGINE_CHECK = 'true';

      const dependencies = buildDependencyChecks();

      expect(dependencies).toHaveLength(0);
    });

    it('should use default AI Engine URL when not specified', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.AI_ENGINE_URL;

      const dependencies = buildDependencyChecks();

      expect(dependencies[0].url).toContain('http://localhost:8000/health');
    });
  });
});
