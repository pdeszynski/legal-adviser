#!/usr/bin/env ts-node

/**
 * Verification script for Health Check Endpoints
 *
 * This script verifies that the health check endpoints work correctly.
 * It can be run manually or as part of CI/CD.
 */

import http from 'http';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    aiEngine: ServiceHealth;
  };
  uptime: number;
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}

function get(url: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode || 500, data: parsed });
        } catch {
          resolve({ status: res.statusCode || 500, data });
        }
      });
    }).on('error', reject);
  });
}

async function verifyHealthEndpoint() {
  console.log('Testing GET /health endpoint...');

  try {
    const { status, data } = await get(`${API_BASE_URL}/health`);

    if (status !== 200) {
      console.error(`  ❌ Expected status 200, got ${status}`);
      return false;
    }
    console.log('  ✓ Status code is 200');

    if (!data.status || !['healthy', 'degraded', 'unhealthy'].includes(data.status)) {
      console.error(`  ❌ Invalid status field: ${data.status}`);
      return false;
    }
    console.log(`  ✓ Overall status: ${data.status}`);

    if (!data.timestamp) {
      console.error('  ❌ Missing timestamp field');
      return false;
    }
    console.log(`  ✓ Timestamp: ${data.timestamp}`);

    if (!data.services) {
      console.error('  ❌ Missing services field');
      return false;
    }

    const { database, redis, aiEngine } = data.services;

    if (!database || !database.status) {
      console.error('  ❌ Missing or invalid database health');
      return false;
    }
    console.log(`  ✓ Database: ${database.status}${database.latency ? ` (${database.latency}ms)` : ''}`);

    if (!redis || !redis.status) {
      console.error('  ❌ Missing or invalid redis health');
      return false;
    }
    console.log(`  ✓ Redis: ${redis.status}${redis.latency ? ` (${redis.latency}ms)` : ''}`);

    if (!aiEngine || !aiEngine.status) {
      console.error('  ❌ Missing or invalid aiEngine health');
      return false;
    }
    console.log(`  ✓ AI Engine: ${aiEngine.status}${aiEngine.latency ? ` (${aiEngine.latency}ms)` : ''}`);

    if (typeof data.uptime !== 'number') {
      console.error('  ❌ Invalid uptime field');
      return false;
    }
    console.log(`  ✓ Uptime: ${data.uptime}s`);

    return true;
  } catch (error) {
    console.error(`  ❌ Request failed: ${error}`);
    return false;
  }
}

async function verifyLivenessEndpoint() {
  console.log('\nTesting GET /health/live endpoint...');

  try {
    const { status, data } = await get(`${API_BASE_URL}/health/live`);

    if (status !== 200) {
      console.error(`  ❌ Expected status 200, got ${status}`);
      return false;
    }
    console.log('  ✓ Status code is 200');

    if (data.status !== 'alive') {
      console.error(`  ❌ Expected status "alive", got "${data.status}"`);
      return false;
    }
    console.log('  ✓ Status is "alive"');

    return true;
  } catch (error) {
    console.error(`  ❌ Request failed: ${error}`);
    return false;
  }
}

async function verifyReadinessEndpoint() {
  console.log('\nTesting GET /health/ready endpoint...');

  try {
    const { status, data } = await get(`${API_BASE_URL}/health/ready`);

    if (status === 200) {
      console.log('  ✓ Status code is 200 (service is ready)');

      if (data.status !== 'ready') {
        console.error(`  ❌ Expected status "ready", got "${data.status}"`);
        return false;
      }
      console.log('  ✓ Status is "ready"');

      return true;
    } else if ([500, 503].includes(status)) {
      console.log(`  ⚠ Status code is ${status} (service not ready - this is acceptable if dependencies are unavailable)`);
      return true;
    } else {
      console.error(`  ❌ Unexpected status code: ${status}`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Request failed: ${error}`);
    return false;
  }
}

async function verifyResponseTime() {
  console.log('\nTesting health check response time...');

  const startTime = Date.now();
  try {
    await get(`${API_BASE_URL}/health`);
    const duration = Date.now() - startTime;

    if (duration > 5000) {
      console.error(`  ❌ Health check took ${duration}ms (expected < 5000ms)`);
      return false;
    }
    console.log(`  ✓ Health check completed in ${duration}ms (< 5000ms)`);

    return true;
  } catch (error) {
    console.error(`  ❌ Request failed: ${error}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Health Check Endpoints Verification');
  console.log('='.repeat(60));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(''.repeat(60));

  const results = await Promise.all([
    verifyHealthEndpoint(),
    verifyLivenessEndpoint(),
    verifyReadinessEndpoint(),
    verifyResponseTime(),
  ]);

  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r).length;
  const total = results.length;

  console.log(`Tests passed: ${passed}/${total}`);

  if (passed === total) {
    console.log('\n✓ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Script error:', error);
  process.exit(1);
});
