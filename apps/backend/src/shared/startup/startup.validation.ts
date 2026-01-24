/**
 * Startup Validation Module
 *
 * Provides utilities to validate that external dependencies are available
 * before allowing the application to fully start. This prevents cascading
 * failures when dependent services are unavailable.
 */

import { Logger } from '@nestjs/common';
import axios from 'axios';

export interface DependencyHealthCheck {
  name: string;
  url: string;
  required: boolean;
  timeout?: number;
}

export interface DependencyHealthResult {
  name: string;
  healthy: boolean;
  error?: string;
  responseTime?: number;
}

/**
 * Validate that all required external dependencies are healthy.
 *
 * In development mode, AI Engine health check is required unless explicitly skipped.
 * In production, all required dependencies must be healthy.
 *
 * @param dependencies - List of dependencies to check
 * @returns Promise<DependencyHealthResult[]> - Health check results
 */
export async function validateDependencies(
  dependencies: DependencyHealthCheck[],
): Promise<DependencyHealthResult[]> {
  const logger = new Logger('StartupValidation');
  const results: DependencyHealthResult[] = [];

  for (const dep of dependencies) {
    const startTime = Date.now();
    try {
      const response = await axios.get(dep.url, {
        timeout: dep.timeout || 5000,
        validateStatus: (status) => status < 500, // Accept 2xx-4xx as "reachable"
      });

      const responseTime = Date.now() - startTime;
      const healthy = response.status >= 200 && response.status < 300;

      results.push({
        name: dep.name,
        healthy,
        responseTime,
      });

      if (healthy) {
        logger.log(`✓ ${dep.name} is healthy (${responseTime}ms)`);
      } else if (dep.required) {
        logger.warn(
          `⚠ ${dep.name} is reachable but returned status ${response.status}`,
        );
      } else {
        logger.log(
          `○ ${dep.name} is optional and currently unavailable (status ${response.status})`,
        );
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const isTimeout =
        axios.isAxiosError(error) && error.code === 'ECONNABORTED';
      const isConnectionRefused =
        axios.isAxiosError(error) && error.code === 'ECONNREFUSED';

      let errorMessage = 'Unknown error';
      if (isTimeout) {
        errorMessage = 'Connection timeout';
      } else if (isConnectionRefused) {
        errorMessage = 'Connection refused';
      } else if (axios.isAxiosError(error)) {
        errorMessage = error.message;
      }

      results.push({
        name: dep.name,
        healthy: false,
        error: errorMessage,
        responseTime,
      });

      if (dep.required) {
        logger.error(
          `✗ ${dep.name} is required but unavailable: ${errorMessage}`,
        );
      } else {
        logger.warn(
          `○ ${dep.name} is optional and currently unavailable: ${errorMessage}`,
        );
      }
    }
  }

  return results;
}

/**
 * Wait for a dependency to become healthy with retries.
 *
 * @param url - Health check URL
 * @param options - Retry options
 * @returns Promise<boolean> - True if dependency became healthy
 */
export async function waitForDependency(
  url: string,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
    logPrefix?: string;
  } = {},
): Promise<boolean> {
  const {
    maxRetries = 30,
    retryDelay = 2000,
    timeout = 5000,
    logPrefix = 'StartupValidation',
  } = options;

  const logger = new Logger(logPrefix);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout,
        validateStatus: (status) => status < 500,
      });

      if (response.status >= 200 && response.status < 300) {
        logger.log(`Dependency is healthy after ${attempt} attempt(s)`);
        return true;
      }

      logger.debug(
        `Attempt ${attempt}/${maxRetries}: Status ${response.status}`,
      );
    } catch (error) {
      if (attempt === maxRetries) {
        logger.debug(
          `Attempt ${attempt}/${maxRetries}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  return false;
}

/**
 * Build the list of dependencies to validate based on environment.
 */
export function buildDependencyChecks(): DependencyHealthCheck[] {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const skipAiEngineCheck = process.env.SKIP_AI_ENGINE_CHECK === 'true';

  const dependencies: DependencyHealthCheck[] = [];

  // If AI Engine check is explicitly skipped, return empty list
  if (skipAiEngineCheck) {
    return dependencies;
  }

  // AI Engine - Required in production, optional in development
  const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
  if (isProduction || !isDevelopment) {
    dependencies.push({
      name: 'AI Engine',
      url: `${aiEngineUrl}/health`,
      required: true,
      timeout: 5000,
    });
  } else if (isDevelopment) {
    dependencies.push({
      name: 'AI Engine',
      url: `${aiEngineUrl}/health`,
      required: false, // Allow dev to start without AI Engine
      timeout: 5000,
    });
  }

  return dependencies;
}
