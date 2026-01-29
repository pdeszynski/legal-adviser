/**
 * Temporal Activities Registration Verification Test
 *
 * This test verifies that all activity implementations are properly
 * registered and can be discovered by the Temporal worker.
 *
 * Run with: npm test -- activities/index.spec.ts
 */

import { ACTIVITY_REGISTRY, getAllActivityNames } from './index';

describe('Temporal Activities Registration', () => {
  describe('Activity Registry', () => {
    it('should have all expected activities registered', () => {
      const expectedActivities = [
        'documentGeneration',
        'pdfExport',
        'rulingIndexing',
        'emailSending',
        'webhookDelivery',
        'chatCleanup',
        'aiQueryProcessing',
      ];

      const registeredActivities = Object.keys(ACTIVITY_REGISTRY);
      expect(registeredActivities).toEqual(expectedActivities);
      expect(registeredActivities.length).toBe(7);
    });

    it('should have activities name for each registered activity', () => {
      Object.entries(ACTIVITY_REGISTRY).forEach(([name, activity]) => {
        expect(activity.name).toBeDefined();
        expect(typeof activity.name).toBe('string');
        // Registry key should match activity name
        expect(name).toBe(activity.name);
      });
    });

    it('should have file path for each registered activity', () => {
      Object.entries(ACTIVITY_REGISTRY).forEach(([name, activity]) => {
        expect(activity.file).toBeDefined();
        expect(typeof activity.file).toBe('string');
        expect(activity.file).toMatch(/\.activities\.ts$/);
        expect(activity.file).toMatch(/^\.\/activities\//);
      });
    });
  });

  describe('Utility Functions', () => {
    it('should return all activity names', () => {
      const names = getAllActivityNames();
      expect(names).toBeInstanceOf(Array);
      expect(names.length).toBe(7);
      expect(names).toContain('documentGeneration');
      expect(names).toContain('emailSending');
      expect(names).toContain('rulingIndexing');
      expect(names).toContain('webhookDelivery');
      expect(names).toContain('chatCleanup');
    });
  });

  describe('Activity Coverage', () => {
    it('should have activities for all major features', () => {
      const activityNames = getAllActivityNames();

      // Document processing
      expect(activityNames).toContain('documentGeneration');
      expect(activityNames).toContain('pdfExport');

      // Notifications
      expect(activityNames).toContain('emailSending');

      // Billing
      expect(activityNames).toContain('rulingIndexing');

      // Webhooks
      expect(activityNames).toContain('webhookDelivery');

      // Chat
      expect(activityNames).toContain('chatCleanup');

      // AI
      expect(activityNames).toContain('aiQueryProcessing');
    });
  });
});
