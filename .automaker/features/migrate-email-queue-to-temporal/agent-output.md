I'll continue the implementation of the Temporal email workflow feature. Let me first explore the existing codebase to understand what's already been done and what remains.

🔧 Tool: Task
Input: {
  "description": "Explore Temporal module structure",
  "prompt": "Explore the apps/backend/src/modules/temporal/ directory to understand what's already been implemented for the Temporal email workflow feature. List all files and their contents. Also check if there's any existing email queue implementation (Bull-based) that needs to be migrated.",
  "subagent_type": "Explore"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/temporal/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/README.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/activities/README.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/workflows/README.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/workflows/notification/email-sending.workflow.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/workflows/notification/email-sending.starter.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/activities/notification/email-sending.activities.ts"
}

🔧 Tool: Grep
Input: {
  "output_mode": "files_with_matches",
  "pattern": "Bull|bull|@bull|@taskbull|Queue|Job",
  "type": "ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/queues/email-send.producer.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/queues/email-send.processor.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/migrations/bull-to-temporal.migration.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/bull-to-temporal-email-migration.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/services/notification.service.ts",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/temporal.service.ts",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/temporal.constants.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/notifications.module.ts",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/notifications.module.ts",
  "offset": 100
}

🔧 Tool: Grep
Input: {
  "-i": true,
  "output_mode": "content",
  "pattern": "EMAIL_QUEUE_BACKEND|queue.*backend",
  "type": "ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/services/notification-manager.service.ts",
  "limit": 150
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/dto/send-email.input.ts"
}
Now let me examine the notification module to understand how email sending is currently being used and what needs to be updated:

🔧 Tool: Grep
Input: {
  "pattern": "EmailSendProducer|emailSendProducer",
  "path": "apps/backend/src",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/queues/email-send.producer.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/services/notification-manager.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/workflows/notification/email-sending.starter.ts"
}
Now let me check the existing Temporal module setup and the notification module to see how the migration should be completed:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/temporal.module.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/notifications.module.ts"
}
Now let me create a task list and implement the necessary changes to complete the migration:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create EmailQueueService adapter to support both Bull and Temporal backends",
      "status": "in_progress",
      "activeForm": "Creating EmailQueueService adapter"
    },
    {
      "content": "Update NotificationManagerService to use EmailQueueService",
      "status": "pending",
      "activeForm": "Updating NotificationManagerService"
    },
    {
      "content": "Update EmailNotificationListener to use EmailQueueService",
      "status": "pending",
      "activeForm": "Updating EmailNotificationListener"
    },
    {
      "content": "Add EMAIL_QUEUE_BACKEND environment variable support",
      "status": "pending",
      "activeForm": "Adding environment variable support"
    },
    {
      "content": "Update notifications module providers",
      "status": "pending",
      "activeForm": "Updating notifications module"
    },
    {
      "content": "Verify the implementation works",
      "status": "pending",
      "activeForm": "Verifying implementation"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/listeners/email-notification.listener.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/dto/send-email.input.ts"
}
Now I'll create an EmailQueueService adapter that abstracts both Bull and Temporal backends. This will allow switching between them using an environment variable:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/services/email-queue.service.ts",
  "content": "/**\n * Email Queue Service\n *\n * Adapter service that provides a unified interface for email queue operations.\n * Supports both Bull (legacy) and Temporal (new) backends via environment variable.\n *\n * Backend Selection:\n * - Set EMAIL_QUEUE_BACKEND= Bull queues (default)\n * - Set EMAIL_QUEUE_BACKEND=temporal for Temporal workflows\n *\n * This abstraction allows gradual migration from Bull to Temporal without\n * changing existing calling code.\n */\n\nimport { Injectable, Logger, Inject } from '@nestjs/common';\nimport { ConfigService } from '@nestjs/config';\nimport { EmailSendProducer } from '../queues/email-send.producer';\nimport { EmailSendingStarter } from '../../temporal/workflows/notification/email-sending.starter';\nimport { EmailJobData } from '../dto/send-email.input';\n\n/**\n * Email queue backend type\n */\nexport enum EmailQueueBackend {\n  BULL = 'bull',\n  TEMPORAL = 'temporal',\n}\n\n/**\n * Queue statistics interface\n */\nexport interface EmailQueueStats {\n  waiting: number;\n  active: number;\n  completed: number;\n  failed: number;\n}\n\n/**\n * Email Queue Service\n *\n * Provides a unified interface for email queue operations regardless\n * of the underlying backend (Bull or Temporal).\n */\n@Injectable()\nexport class EmailQueueService {\n  private readonly logger = new Logger(EmailQueueService.name);\n  private readonly backend: EmailQueueBackend;\n\n  constructor(\n    private readonly configService: ConfigService,\n    @Inject(EmailSendProducer)\n    private readonly emailSendProducer: EmailSendProducer,\n    @Inject(EmailSendingStarter)\n    private readonly emailSendingStarter: EmailSendingStarter,\n  ) {\n    const backendConfig = this.configService.get<string>(\n      'EMAIL_QUEUE_BACKEND',\n      EmailQueueBackend.BULL,\n    );\n    this.backend =\n      backendConfig.toLowerCase() === EmailQueueBackend.TEMPORAL\n        ? EmailQueueBackend.TEMPORAL\n        : EmailQueueBackend.BULL;\n\n    this.logger.log(`Email queue backend: ${this.backend}`);\n  }\n\n  /**\n   * Get the current backend being used\n   */\n  getBackend(): EmailQueueBackend {\n    return this.backend;\n  }\n\n  /**\n   * Check if using Temporal backend\n   */\n  isTemporal(): boolean {\n    return this.backend === EmailQueueBackend.TEMPORAL;\n  }\n\n  /**\n   * Check if using Bull backend\n   */\n  isBull(): boolean {\n    return this.backend === EmailQueueBackend.BULL;\n  }\n\n  /**\n   * Queue a single email for sending\n   *\n   * Delegates to the configured backend (Bull or Temporal).\n   *\n   * @param jobData - Email job data\n   * @returns Promise that resolves when the email is queued\n   */\n  async queueEmail(jobData: EmailJobData): Promise<void> {\n    if (this.backend === EmailQueueBackend.TEMPORAL) {\n      await this.queueEmailTemporal(jobData);\n    } else {\n      await this.queueEmailBull(jobData);\n    }\n  }\n\n  /**\n   * Queue multiple emails for sending\n   *\n   * Delegates to the configured backend (Bull or Temporal).\n   *\n   * @param jobsData - Array of email job data\n   * @returns Promise that resolves when the emails are queued\n   */\n  async queueBulkEmails(jobsData: EmailJobData[]): Promise<void> {\n    if (this.backend === EmailQueueBackend.TEMPORAL) {\n      await this.queueBulkEmailsTemporal(jobsData);\n    } else {\n      await this.queueBulkEmailsBull(jobsData);\n    }\n  }\n\n  /**\n   * Get queue statistics\n   *\n   * Returns statistics for the configured backend.\n   *\n   * @returns Queue statistics\n   */\n  async getQueueStats(): Promise<EmailQueueStats> {\n    if (this.backend === EmailQueueBackend.TEMPORAL) {\n      return this.getTemporalStats();\n    } else {\n      return this.getBullStats();\n    }\n  }\n\n  /**\n   * Queue email via Bull (legacy backend)\n   */\n  private async queueEmailBull(jobData: EmailJobData): Promise<void> {\n    try {\n      await this.emailSendProducer.queueEmail(jobData);\n      this.logger.debug(`Email queued via Bull for ${jobData.to}`);\n    } catch (error) {\n      this.logger.error('Failed to queue email via Bull:', error);\n      throw error;\n    }\n  }\n\n  /**\n   * Queue email via Temporal (new backend)\n   */\n  private async queueEmailTemporal(jobData: EmailJobData): Promise<void> {\n    try {\n      await this.emailSendingStarter.queueEmail({\n        to: jobData.to,\n        subject: jobData.subject,\n        template: jobData.template,\n        templateData: jobData.templateData,\n        userId: jobData.userId,\n        metadata: jobData.metadata,\n      });\n      this.logger.debug(`Email queued via Temporal for ${jobData.to}`);\n    } catch (error) {\n      this.logger.error('Failed to queue email via Temporal:', error);\n      throw error;\n    }\n  }\n\n  /**\n   * Queue bulk emails via Bull (legacy backend)\n   */\n  private async queueBulkEmailsBull(jobsData: EmailJobData[]): Promise<void> {\n    try {\n      await this.emailSendProducer.queueBulkEmails(jobsData);\n      this.logger.debug(`${jobsData.length} emails queued via Bull`);\n    } catch (error) {\n      this.logger.error('Failed to queue bulk emails via Bull:', error);\n      throw error;\n    }\n  }\n\n  /**\n   * Queue bulk emails via Temporal (new backend)\n   */\n  private async queueBulkEmailsTemporal(jobsData: EmailJobData[]): Promise<void> {\n    try {\n      await this.emailSendingStarter.queueBulkEmails({\n        emails: jobsData.map((job) => ({\n          to: job.to,\n          subject: job.subject,\n          template: job.template,\n          templateData: job.templateData,\n          userId: job.userId,\n          metadata: job.metadata,\n        })),\n      });\n      this.logger.debug(`${jobsData.length} emails queued via Temporal`);\n    } catch (error) {\n      this.logger.error('Failed to queue bulk emails via Temporal:', error);\n      throw error;\n    }\n  }\n\n  /**\n   * Get Bull queue statistics\n   */\n  private async getBullStats(): Promise<EmailQueueStats> {\n    try {\n      return await this.emailSendProducer.getQueueStats();\n    } catch (error) {\n      this.logger.error('Failed to get Bull queue stats:', error);\n      return { waiting: 0, active: 0, completed: 0, failed: 0 };\n    }\n  }\n\n  /**\n   * Get Temporal queue statistics\n   */\n  private async getTemporalStats(): Promise<EmailQueueStats> {\n    try {\n      const stats = await this.emailSendingStarter.getQueueStats();\n      // Temporal stats don't have \"waiting\" - map to 0 for compatibility\n      return {\n        waiting: 0,\n        active: stats.active,\n        completed: stats.completed,\n        failed: stats.failed,\n      };\n    } catch (error) {\n      this.logger.error('Failed to get Temporal queue stats:', error);\n      return { waiting: 0, active: 0, completed: 0, failed: 0 };\n    }\n  }\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Creating EmailQueueService adapter",
      "content": "Create EmailQueueService adapter to support both Bull and Temporal backends",
      "status": "completed"
    },
    {
      "activeForm": "Updating NotificationManagerService",
      "content": "Update NotificationManagerService to use EmailQueueService",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating EmailNotificationListener",
      "content": "Update EmailNotificationListener to use EmailQueueService",
      "status": "pending"
    },
    {
      "activeForm": "Adding environment variable support",
      "content": "Add EMAIL_QUEUE_BACKEND environment variable support",
      "status": "pending"
    },
    {
      "activeForm": "Updating notifications module",
      "content": "Update notifications module providers",
      "status": "pending"
    },
    {
      "activeForm": "Verifying implementation",
      "content": "Verify the implementation works",
      "status": "pending"
    }
  ]
}
Now let me update the NotificationManagerService to use the EmailQueueService:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/services/notification-manager.service.ts",
  "old_string": "import { EmailSendProducer } from '../queues/email-send.producer';\nimport { EmailTemplatesService } from './email-templates.service';",
  "new_string": "import { EmailQueueService } from './email-queue.service';\nimport { EmailTemplatesService } from './email-templates.service';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/services/notification-manager.service.ts",
  "old_string": "  constructor(\n    @InjectRepository(InAppNotification)\n    private readonly inAppNotificationRepository: Repository<InAppNotification>,\n    private readonly emailSendProducer: EmailSendProducer,\n    private readonly emailTemplatesService: EmailTemplatesService,\n    private readonly eventEmitter: EventEmitter2,\n    private readonly pubSubService: GraphQLPubSubService,\n  ) {}",
  "new_string": "  constructor(\n    @InjectRepository(InAppNotification)\n    private readonly inAppNotificationRepository: Repository<InAppNotification>,\n    private readonly emailQueueService: EmailQueueService,\n    private readonly emailTemplatesService: EmailTemplatesService,\n    private readonly eventEmitter: EventEmitter2,\n    private readonly pubSubService: GraphQLPubSubService,\n  ) {}"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/services/notification-manager.service.ts",
  "old_string": "    await this.emailSendProducer.queueEmail({",
  "new_string": "    await this.emailQueueService.queueEmail({"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Creating EmailQueueService adapter",
      "content": "Create EmailQueueService adapter to support both Bull and Temporal backends",
      "status": "completed"
    },
    {
      "activeForm": "Updating NotificationManagerService",
      "content": "Update NotificationManagerService to use EmailQueueService",
      "status": "completed"
    },
    {
      "activeForm": "Updating EmailNotificationListener",
      "content": "Update EmailNotificationListener to use EmailQueueService",
      "status": "in_progress"
    },
    {
      "activeForm": "Adding environment variable support",
      "content": "Add EMAIL_QUEUE_BACKEND environment variable support",
      "status": "pending"
    },
    {
      "activeForm": "Updating notifications module",
      "content": "Update notifications module providers",
      "status": "pending"
    },
    {
      "activeForm": "Verifying implementation",
      "content": "Verify the implementation works",
      "status": "pending"
    }
  ]
}
Now let me update the EmailNotificationListener:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/listeners/email-notification.listener.ts",
  "old_string": "import { Injectable, Logger } from '@nestjs/common';\nimport { OnEvent } from '@nestjs/event-emitter';\nimport { ConfigService } from '@nestjs/config';\nimport { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';\nimport { EmailSendProducer } from '../queues/email-send.producer';\nimport { EmailTemplateType } from '../dto/send-email.input';",
  "new_string": "import { Injectable, Logger } from '@nestjs/common';\nimport { OnEvent } from '@nestjs/event-emitter';\nimport { ConfigService } from '@nestjs/config';\nimport { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';\nimport { EmailQueueService } from '../services/email-queue.service';\nimport { EmailTemplateType } from '../dto/send-email.input';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/listeners/email-notification.listener.ts",
  "old_string": "  constructor(\n    private readonly emailProducer: EmailSendProducer,\n    private readonly configService: ConfigService,\n  ) {",
  "new_string": "  constructor(\n    private readonly emailQueueService: EmailQueueService,\n    private readonly configService: ConfigService,\n  ) {"
}

🔧 Tool: Edit
Input: {
  "replace_all": true,
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/listeners/email-notification.listener.ts",
  "old_string": "      await this.emailProducer.queueEmail({",
  "new_string": "      await this.emailQueueService.queueEmail({"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Creating EmailQueueService adapter",
      "content": "Create EmailQueueService adapter to support both Bull and Temporal backends",
      "status": "completed"
    },
    {
      "activeForm": "Updating NotificationManagerService",
      "content": "Update NotificationManagerService to use EmailQueueService",
      "status": "completed"
    },
    {
      "activeForm": "Updating EmailNotificationListener",
      "content": "Update EmailNotificationListener to use EmailQueueService",
      "status": "completed"
    },
    {
      "activeForm": "Adding environment variable support",
      "content": "Add EMAIL_QUEUE_BACKEND environment variable support",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating notifications module",
      "content": "Update notifications module providers",
      "status": "pending"
    },
    {
      "activeForm": "Verifying implementation",
      "content": "Verify the implementation works",
      "status": "pending"
    }
  ]
}
Now let me update the notifications module providers to include EmailQueueService:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/notifications.module.ts",
  "old_string": "import { NotificationManagerService } from './services/notification-manager.service';\nimport { EmailSendProcessor } from './queues/email-send.processor';",
  "new_string": "import { NotificationManagerService } from './services/notification-manager.service';\nimport { EmailQueueService } from './services/email-queue.service';\nimport { EmailSendProcessor } from './queues/email-send.processor';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/notifications.module.ts",
  "old_string": "  providers: [\n    // Services\n    NotificationService,\n    EmailSenderService,\n    EmailTemplatesService,\n    NotificationManagerService,\n\n    // Queue (Bull - legacy)\n    EmailSendProcessor,\n    EmailSendProducer,\n\n    // Temporal (new - optional replacement for Bull)\n    EmailSendingStarter,",
  "new_string": "  providers: [\n    // Services\n    NotificationService,\n    EmailSenderService,\n    EmailTemplatesService,\n    NotificationManagerService,\n    EmailQueueService,\n\n    // Queue (Bull - legacy)\n    EmailSendProcessor,\n    EmailSendProducer,\n\n    // Temporal (new - optional replacement for Bull)\n    EmailSendingStarter,"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/notifications.module.ts",
  "old_string": "  exports: [\n    NotificationService,\n    EmailSendProducer,\n    EmailSendingStarter, // Export Temporal starter for optional use\n    EmailSenderService,\n    NotificationManagerService,\n  ],",
  "new_string": "  exports: [\n    NotificationService,\n    EmailSendProducer,\n    EmailQueueService, // Export unified queue service\n    EmailSendingStarter, // Export Temporal starter for optional use\n    EmailSenderService,\n    NotificationManagerService,\n  ],"
}
Now let me add the environment variable to the .env.example file:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/.env.example"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/.env.example",
  "old_string": "# Email Configuration (SendGrid)\nEMAIL_ENABLED=false\nSENDGRID_API_KEY=your-sendgrid-api-key-here\nEMAIL_FROM_ADDRESS=noreply@legal-ai.com\nEMAIL_FROM_NAME=Legal AI Platform",
  "new_string": "# Email Configuration (SendGrid)\nEMAIL_ENABLED=false\nSENDGRID_API_KEY=your-sendgrid-api-key-here\nEMAIL_FROM_ADDRESS=noreply@legal-ai.com\nEMAIL_FROM_NAME=Legal AI Platform\n\n# Email Queue Backend\n# Options: 'bull' (legacy, default) or 'temporal' (new)\n# Set to 'temporal' to use Temporal workflows instead of Bull queues\nEMAIL_QUEUE_BACKEND=bull"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Creating EmailQueueService adapter",
      "content": "Create EmailQueueService adapter to support both Bull and Temporal backends",
      "status": "completed"
    },
    {
      "activeForm": "Updating NotificationManagerService",
      "content": "Update NotificationManagerService to use EmailQueueService",
      "status": "completed"
    },
    {
      "activeForm": "Updating EmailNotificationListener",
      "content": "Update EmailNotificationListener to use EmailQueueService",
      "status": "completed"
    },
    {
      "activeForm": "Adding environment variable support",
      "content": "Add EMAIL_QUEUE_BACKEND environment variable support",
      "status": "completed"
    },
    {
      "activeForm": "Updating notifications module",
      "content": "Update notifications module providers",
      "status": "completed"
    },
    {
      "activeForm": "Verifying implementation",
      "content": "Verify the implementation works",
      "status": "in_progress"
    }
  ]
}
Now let me verify the implementation by running type checking and linting:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend && pnpm dlx tsc --noEmit 2>&1 | head -100",
  "description": "Type check backend",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | head -100",
  "description": "Type check backend",
  "timeout": 120000
}
There are a few TypeScript errors. Let me fix the migration file first:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/bull-to-temporal-email-migration.ts",
  "offset": 175,
  "limit": 30
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/bull-to-temporal-email-migration.ts",
  "limit": 30,
  "offset": 235
}

🔧 Tool: Grep
Input: {
  "pattern": "private jobToSample",
  "path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/bull-to-temporal-email-migration.ts",
  "output_mode": "content",
  "-n": true,
  "-A": 15
}

🔧 Tool: Grep
Input: {
  "-A": 15,
  "-n": true,
  "output_mode": "content",
  "path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/bull-to-temporal-email-migration.ts",
  "pattern": "jobToSample"
}
I see the issue. The `jobToSample` method returns a Promise, but it's being used directly in the array push. Let me fix this:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/temporal/bull-to-temporal-email-migration.ts",
  "old_string": "    // Sample from waiting jobs\n    if (!statusFilter || statusFilter.includes('waiting')) {\n      for (const job of await this.emailQueue.getWaiting(0, sampleLimit)) {\n        if (sampleCount >= sampleLimit) break;\n        sampleJobs.push(this.jobToSample(job));\n        sampleCount++;\n      }\n    }\n\n    // Sample from failed jobs if needed\n    if (sampleCount < sampleLimit && (!statusFilter || statusFilter.includes('failed'))) {\n      for (const job of await this.emailQueue.getFailed(0, sampleLimit - sampleCount)) {\n        sampleJobs.push(this.jobToSample(job));\n        sampleCount++;\n      }\n    }",
  "new_string": "    // Sample from waiting jobs\n    if (!statusFilter || statusFilter.includes('waiting')) {\n      for (const job of await this.emailQueue.getWaiting(0, sampleLimit)) {\n        if (sampleCount >= sampleLimit) break;\n        sampleJobs.push(await this.jobToSample(job));\n        sampleCount++;\n      }\n    }\n\n    // Sample from failed jobs if needed\n    if (sampleCount < sampleLimit && (!statusFilter || statusFilter.includes('failed'))) {\n      for (const job of await this.emailQueue.getFailed(0, sampleLimit - sampleCount)) {\n        sampleJobs.push(await this.jobToSample(job));\n        sampleCount++;\n      }\n    }"
}
Now let me fix the startup validation test file:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/shared/startup/startup.validation.spec.ts",
  "limit": 30,
  "offset": 50
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/shared/startup/startup.validation.spec.ts",
  "old_string": "    it('should return unhealthy result for failed service', async () => {\n      // Create an AxiosError-like object\n      const error = new Error('Connection refused');\n      (error as { code: string }).code = 'ECONNREFUSED';\n      (error as { isAxiosError: boolean }).isAxiosError = true;\n      mockedAxios.get.mockRejectedValue(error);\n      // Make axios.isAxiosError return true for our error\n      mockedAxios.isAxiosError.mockReturnValue(true);",
  "new_string": "    it('should return unhealthy result for failed service', async () => {\n      // Create an AxiosError-like object\n      const error = new Error('Connection refused');\n      (error as unknown as { code: string }).code = 'ECONNREFUSED';\n      (error as unknown as { isAxiosError: boolean }).isAxiosError = true;\n      mockedAxios.get.mockRejectedValue(error);\n      // Make axios.isAxiosError return true for our error\n      mockedAxios.isAxiosError.mockReturnValue(true);"
}
Now let me run the type check again:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | head -50",
  "description": "Type check backend",
  "timeout": 120000
}
TypeScript compilation passes. Now let me run the linter:

🔧 Tool: Bash
Input: {
  "command": "npx eslint src/modules/notifications/services/email-queue.service.ts src/modules/notifications/services/notification-manager.service.ts src/modules/notifications/listeners/email-notification.listener.ts src/modules/notifications/notifications.module.ts 2>&1",
  "description": "Lint modified files",
  "timeout": 60000
}
The errors are mostly existing issues in files I didn't modify (email-notification.listener.ts had many existing issues). Let me fix the new issues in email-queue.service.ts:

🔧 Tool: Bash
Input: {
  "command": "npx eslint src/modules/notifications/services/email-queue.service.ts --fix 2>&1",
  "description": "Fix linting errors",
  "timeout": 60000
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/services/email-queue.service.ts",
  "limit": 20,
  "offset": 55
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/services/email-queue.service.ts",
  "old_string": "    const backendConfig = this.configService.get<string>(\n      'EMAIL_QUEUE_BACKEND',\n      EmailQueueBackend.BULL,\n    );\n    this.backend =\n      backendConfig.toLowerCase() === EmailQueueBackend.TEMPORAL\n        ? EmailQueueBackend.TEMPORAL\n        : EmailQueueBackend.BULL;",
  "new_string": "    const backendConfig = this.configService.get<string>(\n      'EMAIL_QUEUE_BACKEND',\n      EmailQueueBackend.BULL,\n    );\n    this.backend =\n      backendConfig.toLowerCase() === EmailQueueBackend.TEMPORAL.valueOf()\n        ? EmailQueueBackend.TEMPORAL\n        : EmailQueueBackend.BULL;"
}

🔧 Tool: Bash
Input: {
  "command": "npx eslint src/modules/notifications/services/email-queue.service.ts 2>&1",
  "description": "Verify email-queue.service.ts",
  "timeout": 60000
}
Now let me verify the overall project builds correctly:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | head -20",
  "description": "Type check backend",
  "timeout": 120000
}
TypeScript compilation passes. Now let me verify the implementation works by creating a simple verification test:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/tests/verify-email-queue-service.spec.ts",
  "content": "/**\n * Email Queue Service Verification Test\n *\n * Temporary test to verify the EmailQueueService works correctly\n * with both Bull and Temporal backends.\n */\n\nimport { Test, TestingModule } from '@nestjs/testing';\nimport { ConfigService } from '@nestjs/config';\nimport { EmailQueueService, EmailQueueBackend } from '../src/modules/notifications/services/email-queue.service';\nimport { EmailSendProducer } from '../src/modules/notifications/queues/email-send.producer';\nimport { EmailSendingStarter } from '../src/modules/temporal/workflows/notification/email-sending.starter';\nimport { EmailJobData } from '../src/modules/notifications/dto/send-email.input';\n\ndescribe('EmailQueueService Verification', () => {\n  let service: EmailQueueService;\n  let mockEmailSendProducer: jest.Mocked<EmailSendProducer>;\n  let mockEmailSendingStarter: jest.Mocked<EmailSendingStarter>;\n  let mockConfigService: jest.Mocked<ConfigService>;\n\n  const mockJobData: EmailJobData = {\n    to: 'test@example.com',\n    subject: 'Test Email',\n    template: 'welcome' as any,\n    templateData: { name: 'Test User' },\n    userId: 'user-123',\n  };\n\n  beforeEach(async () => {\n    // Create mocks\n    mockEmailSendProducer = {\n      queueEmail: jest.fn().mockResolvedValue(undefined),\n      queueBulkEmails: jest.fn().mockResolvedValue(undefined),\n      getQueueStats: jest.fn().mockResolvedValue({\n        waiting: 5,\n        active: 2,\n        completed: 100,\n        failed: 3,\n      }),\n    } as any;\n\n    mockEmailSendingStarter = {\n      queueEmail: jest.fn().mockResolvedValue({\n        workflowId: 'wf-123',\n        runId: 'run-123',\n        taskQueue: 'email-task-queue',\n        workflowType: 'emailSending',\n      }),\n      queueBulkEmails: jest.fn().mockResolvedValue({\n        workflowId: 'bulk-wf-123',\n        runId: 'bulk-run-123',\n        taskQueue: 'email-task-queue',\n        workflowType: 'bulkEmailSending',\n        emailCount: 10,\n      }),\n      getQueueStats: jest.fn().mockResolvedValue({\n        active: 1,\n        completed: 50,\n        failed: 1,\n      }),\n      getWorkflowStatus: jest.fn(),\n      getWorkflowResult: jest.fn(),\n      cancelWorkflow: jest.fn(),\n    } as any;\n\n    mockConfigService = {\n      get: jest.fn(),\n    } as any;\n\n    const module: TestingModule = await Test.createTestingModule({\n      providers: [\n        EmailQueueService,\n        {\n          provide: ConfigService,\n          useValue: mockConfigService,\n        },\n        {\n          provide: EmailSendProducer,\n          useValue: mockEmailSendProducer,\n        },\n        {\n          provide: EmailSendingStarter,\n          useValue: mockEmailSendingStarter,\n        },\n      ],\n    }).compile();\n\n    service = module.get<EmailQueueService>(EmailQueueService);\n  });\n\n  afterEach(() => {\n    jest.clearAllMocks();\n  });\n\n  describe('Bull Backend', () => {\n    beforeEach(() => {\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.BULL);\n      // Re-create service to pick up new config\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n    });\n\n    it('should use Bull backend when EMAIL_QUEUE_BACKEND=bull', () => {\n      expect(service.getBackend()).toBe(EmailQueueBackend.BULL);\n      expect(service.isBull()).toBe(true);\n      expect(service.isTemporal()).toBe(false);\n    });\n\n    it('should queue single email via Bull', async () => {\n      await service.queueEmail(mockJobData);\n\n      expect(mockEmailSendProducer.queueEmail).toHaveBeenCalledWith(mockJobData);\n      expect(mockEmailSendingStarter.queueEmail).not.toHaveBeenCalled();\n    });\n\n    it('should queue bulk emails via Bull', async () => {\n      const bulkJobs: EmailJobData[] = [mockJobData, { ...mockJobData, to: 'test2@example.com' }];\n\n      await service.queueBulkEmails(bulkJobs);\n\n      expect(mockEmailSendProducer.queueBulkEmails).toHaveBeenCalledWith(bulkJobs);\n      expect(mockEmailSendingStarter.queueBulkEmails).not.toHaveBeenCalled();\n    });\n\n    it('should get queue stats from Bull', async () => {\n      const stats = await service.getQueueStats();\n\n      expect(stats).toEqual({\n        waiting: 5,\n        active: 2,\n        completed: 100,\n        failed: 3,\n      });\n      expect(mockEmailSendProducer.getQueueStats).toHaveBeenCalled();\n      expect(mockEmailSendingStarter.getQueueStats).not.toHaveBeenCalled();\n    });\n  });\n\n  describe('Temporal Backend', () => {\n    beforeEach(() => {\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.TEMPORAL);\n      // Re-create service to pick up new config\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n    });\n\n    it('should use Temporal backend when EMAIL_QUEUE_BACKEND=temporal', () => {\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n      expect(service.isTemporal()).toBe(true);\n      expect(service.isBull()).toBe(false);\n    });\n\n    it('should queue single email via Temporal', async () => {\n      await service.queueEmail(mockJobData);\n\n      expect(mockEmailSendingStarter.queueEmail).toHaveBeenCalledWith({\n        to: mockJobData.to,\n        subject: mockJobData.subject,\n        template: mockJobData.template,\n        templateData: mockJobData.templateData,\n        userId: mockJobData.userId,\n        metadata: mockJobData.metadata,\n      });\n      expect(mockEmailSendProducer.queueEmail).not.toHaveBeenCalled();\n    });\n\n    it('should queue bulk emails via Temporal', async () => {\n      const bulkJobs: EmailJobData[] = [mockJobData, { ...mockJobData, to: 'test2@example.com' }];\n\n      await service.queueBulkEmails(bulkJobs);\n\n      expect(mockEmailSendingStarter.queueBulkEmails).toHaveBeenCalledWith({\n        emails: bulkJobs.map((job) => ({\n          to: job.to,\n          subject: job.subject,\n          template: job.template,\n          templateData: job.templateData,\n          userId: job.userId,\n          metadata: job.metadata,\n        })),\n      });\n      expect(mockEmailSendProducer.queueBulkEmails).not.toHaveBeenCalled();\n    });\n\n    it('should get queue stats from Temporal', async () => {\n      const stats = await service.getQueueStats();\n\n      expect(stats).toEqual({\n        waiting: 0, // Temporal doesn't have waiting\n        active: 1,\n        completed: 50,\n        failed: 1,\n      });\n      expect(mockEmailSendingStarter.getQueueStats).toHaveBeenCalled();\n      expect(mockEmailSendProducer.getQueueStats).not.toHaveBeenCalled();\n    });\n  });\n\n  describe('Default Backend', () => {\n    it('should default to Bull backend when EMAIL_QUEUE_BACKEND is not set', () => {\n      mockConfigService.get.mockReturnValue(undefined);\n      // Re-create service to pick up new config\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.BULL);\n    });\n  });\n\n  describe('Case Insensitive Backend Selection', () => {\n    it('should handle lowercase \"temporal\"', () => {\n      mockConfigService.get.mockReturnValue('temporal');\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n    });\n\n    it('should handle uppercase \"TEMPORAL\"', () => {\n      mockConfigService.get.mockReturnValue('TEMPORAL');\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n    });\n\n    it('should handle mixed case \"TeMpOrAl\"', () => {\n      mockConfigService.get.mockReturnValue('TeMpOrAl');\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n    });\n  });\n});\n"
}

🔧 Tool: Bash
Input: {
  "command": "npx jest tests/verify-email-queue-service.spec.ts 2>&1",
  "description": "Run verification test",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npx jest tests/verify-email-queue-service.spec.ts --testPathIgnorePatterns= [] 2>&1",
  "description": "Run verification test",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npx jest --testPathPatterns=\"verify-email-queue-service\" 2>&1",
  "description": "Run verification test",
  "timeout": 120000
}
Let me check the jest configuration and move the test to the correct location:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/jest.config.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/jest.config.js"
}
The test needs to be in the `src` directory. Let me move it:

🔧 Tool: Bash
Input: {
  "command": "rm /Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/tests/verify-email-queue-service.spec.ts && npx jest --listTests | grep -i \"notification\" | head -10",
  "description": "List notification tests",
  "timeout": 30000
}
Let me create a proper test file in the src directory:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/services/email-queue.service.spec.ts",
  "content": "/**\n * Email Queue Service Verification Test\n *\n * Temporary test to verify the EmailQueueService works correctly\n * with both Bull and Temporal backends.\n */\n\nimport { Test, TestingModule } from '@nestjs/testing';\nimport { ConfigService } from '@nestjs/config';\nimport { EmailQueueService, EmailQueueBackend } from './email-queue.service';\nimport { EmailSendProducer } from '../queues/email-send.producer';\nimport { EmailSendingStarter } from '../../temporal/workflows/notification/email-sending.starter';\nimport { EmailJobData } from '../dto/send-email.input';\n\ndescribe('EmailQueueService Verification', () => {\n  let service: EmailQueueService;\n  let mockEmailSendProducer: jest.Mocked<EmailSendProducer>;\n  let mockEmailSendingStarter: jest.Mocked<EmailSendingStarter>;\n  let mockConfigService: jest.Mocked<ConfigService>;\n\n  const mockJobData: EmailJobData = {\n    to: 'test@example.com',\n    subject: 'Test Email',\n    template: 'welcome' as any,\n    templateData: { name: 'Test User' },\n    userId: 'user-123',\n  };\n\n  beforeEach(async () => {\n    // Create mocks\n    mockEmailSendProducer = {\n      queueEmail: jest.fn().mockResolvedValue(undefined),\n      queueBulkEmails: jest.fn().mockResolvedValue(undefined),\n      getQueueStats: jest.fn().mockResolvedValue({\n        waiting: 5,\n        active: 2,\n        completed: 100,\n        failed: 3,\n      }),\n    } as any;\n\n    mockEmailSendingStarter = {\n      queueEmail: jest.fn().mockResolvedValue({\n        workflowId: 'wf-123',\n        runId: 'run-123',\n        taskQueue: 'email-task-queue',\n        workflowType: 'emailSending',\n      }),\n      queueBulkEmails: jest.fn().mockResolvedValue({\n        workflowId: 'bulk-wf-123',\n        runId: 'bulk-run-123',\n        taskQueue: 'email-task-queue',\n        workflowType: 'bulkEmailSending',\n        emailCount: 10,\n      }),\n      getQueueStats: jest.fn().mockResolvedValue({\n        active: 1,\n        completed: 50,\n        failed: 1,\n      }),\n      getWorkflowStatus: jest.fn(),\n      getWorkflowResult: jest.fn(),\n      cancelWorkflow: jest.fn(),\n    } as any;\n\n    mockConfigService = {\n      get: jest.fn(),\n    } as any;\n\n    const module: TestingModule = await Test.createTestingModule({\n      providers: [\n        EmailQueueService,\n        {\n          provide: ConfigService,\n          useValue: mockConfigService,\n        },\n        {\n          provide: EmailSendProducer,\n          useValue: mockEmailSendProducer,\n        },\n        {\n          provide: EmailSendingStarter,\n          useValue: mockEmailSendingStarter,\n        },\n      ],\n    }).compile();\n\n    service = module.get<EmailQueueService>(EmailQueueService);\n  });\n\n  afterEach(() => {\n    jest.clearAllMocks();\n  });\n\n  describe('Bull Backend', () => {\n    beforeEach(() => {\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.BULL);\n      // Re-create service to pick up new config\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n    });\n\n    it('should use Bull backend when EMAIL_QUEUE_BACKEND=bull', () => {\n      expect(service.getBackend()).toBe(EmailQueueBackend.BULL);\n      expect(service.isBull()).toBe(true);\n      expect(service.isTemporal()).toBe(false);\n    });\n\n    it('should queue single email via Bull', async () => {\n      await service.queueEmail(mockJobData);\n\n      expect(mockEmailSendProducer.queueEmail).toHaveBeenCalledWith(mockJobData);\n      expect(mockEmailSendingStarter.queueEmail).not.toHaveBeenCalled();\n    });\n\n    it('should queue bulk emails via Bull', async () => {\n      const bulkJobs: EmailJobData[] = [mockJobData, { ...mockJobData, to: 'test2@example.com' }];\n\n      await service.queueBulkEmails(bulkJobs);\n\n      expect(mockEmailSendProducer.queueBulkEmails).toHaveBeenCalledWith(bulkJobs);\n      expect(mockEmailSendingStarter.queueBulkEmails).not.toHaveBeenCalled();\n    });\n\n    it('should get queue stats from Bull', async () => {\n      const stats = await service.getQueueStats();\n\n      expect(stats).toEqual({\n        waiting: 5,\n        active: 2,\n        completed: 100,\n        failed: 3,\n      });\n      expect(mockEmailSendProducer.getQueueStats).toHaveBeenCalled();\n      expect(mockEmailSendingStarter.getQueueStats).not.toHaveBeenCalled();\n    });\n  });\n\n  describe('Temporal Backend', () => {\n    beforeEach(() => {\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.TEMPORAL);\n      // Re-create service to pick up new config\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n    });\n\n    it('should use Temporal backend when EMAIL_QUEUE_BACKEND=temporal', () => {\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n      expect(service.isTemporal()).toBe(true);\n      expect(service.isBull()).toBe(false);\n    });\n\n    it('should queue single email via Temporal', async () => {\n      await service.queueEmail(mockJobData);\n\n      expect(mockEmailSendingStarter.queueEmail).toHaveBeenCalledWith({\n        to: mockJobData.to,\n        subject: mockJobData.subject,\n        template: mockJobData.template,\n        templateData: mockJobData.templateData,\n        userId: mockJobData.userId,\n        metadata: mockJobData.metadata,\n      });\n      expect(mockEmailSendProducer.queueEmail).not.toHaveBeenCalled();\n    });\n\n    it('should queue bulk emails via Temporal', async () => {\n      const bulkJobs: EmailJobData[] = [mockJobData, { ...mockJobData, to: 'test2@example.com' }];\n\n      await service.queueBulkEmails(bulkJobs);\n\n      expect(mockEmailSendingStarter.queueBulkEmails).toHaveBeenCalledWith({\n        emails: bulkJobs.map((job) => ({\n          to: job.to,\n          subject: job.subject,\n          template: job.template,\n          templateData: job.templateData,\n          userId: job.userId,\n          metadata: job.metadata,\n        })),\n      });\n      expect(mockEmailSendProducer.queueBulkEmails).not.toHaveBeenCalled();\n    });\n\n    it('should get queue stats from Temporal', async () => {\n      const stats = await service.getQueueStats();\n\n      expect(stats).toEqual({\n        waiting: 0, // Temporal doesn't have waiting\n        active: 1,\n        completed: 50,\n        failed: 1,\n      });\n      expect(mockEmailSendingStarter.getQueueStats).toHaveBeenCalled();\n      expect(mockEmailSendProducer.getQueueStats).not.toHaveBeenCalled();\n    });\n  });\n\n  describe('Default Backend', () => {\n    it('should default to Bull backend when EMAIL_QUEUE_BACKEND is not set', () => {\n      mockConfigService.get.mockReturnValue(undefined);\n      // Re-create service to pick up new config\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.BULL);\n    });\n  });\n\n  describe('Case Insensitive Backend Selection', () => {\n    it('should handle lowercase \"temporal\"', () => {\n      mockConfigService.get.mockReturnValue('temporal');\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n    });\n\n    it('should handle uppercase \"TEMPORAL\"', () => {\n      mockConfigService.get.mockReturnValue('TEMPORAL');\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n    });\n\n    it('should handle mixed case \"TeMpOrAl\"', () => {\n      mockConfigService.get.mockReturnValue('TeMpOrAl');\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n    });\n  });\n});\n"
}

🔧 Tool: Bash
Input: {
  "command": "npx jest src/modules/notifications/services/email-queue.service.spec.ts 2>&1",
  "description": "Run verification test",
  "timeout": 120000
}
I need to fix the test - the mock isn't being set up correctly during service creation. Let me update the test:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/services/email-queue.service.spec.ts",
  "old_string": "/**\n * Email Queue Service Verification Test\n *\n * Temporary test to verify the EmailQueueService works correctly\n * with both Bull and Temporal backends.\n */\n\nimport { Test, TestingModule } from '@nestjs/testing';\nimport { ConfigService } from '@nestjs/config';\nimport { EmailQueueService, EmailQueueBackend } from './email-queue.service';\nimport { EmailSendProducer } from '../queues/email-send.producer';\nimport { EmailSendingStarter } from '../../temporal/workflows/notification/email-sending.starter';\nimport { EmailJobData } from '../dto/send-email.input';\n\ndescribe('EmailQueueService Verification', () => {\n  let service: EmailQueueService;\n  let mockEmailSendProducer: jest.Mocked<EmailSendProducer>;\n  let mockEmailSendingStarter: jest.Mocked<EmailSendingStarter>;\n  let mockConfigService: jest.Mocked<ConfigService>;\n\n  const mockJobData: EmailJobData = {\n    to: 'test@example.com',\n    subject: 'Test Email',\n    template: 'welcome' as any,\n    templateData: { name: 'Test User' },\n    userId: 'user-123',\n  };\n\n  beforeEach(async () => {\n    // Create mocks\n    mockEmailSendProducer = {\n      queueEmail: jest.fn().mockResolvedValue(undefined),\n      queueBulkEmails: jest.fn().mockResolvedValue(undefined),\n      getQueueStats: jest.fn().mockResolvedValue({\n        waiting: 5,\n        active: 2,\n        completed: 100,\n        failed: 3,\n      }),\n    } as any;\n\n    mockEmailSendingStarter = {\n      queueEmail: jest.fn().mockResolvedValue({\n        workflowId: 'wf-123',\n        runId: 'run-123',\n        taskQueue: 'email-task-queue',\n        workflowType: 'emailSending',\n      }),\n      queueBulkEmails: jest.fn().mockResolvedValue({\n        workflowId: 'bulk-wf-123',\n        runId: 'bulk-run-123',\n        taskQueue: 'email-task-queue',\n        workflowType: 'bulkEmailSending',\n        emailCount: 10,\n      }),\n      getQueueStats: jest.fn().mockResolvedValue({\n        active: 1,\n        completed: 50,\n        failed: 1,\n      }),\n      getWorkflowStatus: jest.fn(),\n      getWorkflowResult: jest.fn(),\n      cancelWorkflow: jest.fn(),\n    } as any;\n\n    mockConfigService = {\n      get: jest.fn(),\n    } as any;\n\n    const module: TestingModule = await Test.createTestingModule({\n      providers: [\n        EmailQueueService,\n        {\n          provide: ConfigService,\n          useValue: mockConfigService,\n        },\n        {\n          provide: EmailSendProducer,\n          useValue: mockEmailSendProducer,\n        },\n        {\n          provide: EmailSendingStarter,\n          useValue: mockEmailSendingStarter,\n        },\n      ],\n    }).compile();\n\n    service = module.get<EmailQueueService>(EmailQueueService);\n  });\n\n  afterEach(() => {\n    jest.clearAllMocks();\n  });\n\n  describe('Bull Backend', () => {\n    beforeEach(() => {\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.BULL);\n      // Re-create service to pick up new config\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n    });\n\n    it('should use Bull backend when EMAIL_QUEUE_BACKEND=bull', () => {\n      expect(service.getBackend()).toBe(EmailQueueBackend.BULL);\n      expect(service.isBull()).toBe(true);\n      expect(service.isTemporal()).toBe(false);\n    });\n\n    it('should queue single email via Bull', async () => {\n      await service.queueEmail(mockJobData);\n\n      expect(mockEmailSendProducer.queueEmail).toHaveBeenCalledWith(mockJobData);\n      expect(mockEmailSendingStarter.queueEmail).not.toHaveBeenCalled();\n    });\n\n    it('should queue bulk emails via Bull', async () => {\n      const bulkJobs: EmailJobData[] = [mockJobData, { ...mockJobData, to: 'test2@example.com' }];\n\n      await service.queueBulkEmails(bulkJobs);\n\n      expect(mockEmailSendProducer.queueBulkEmails).toHaveBeenCalledWith(bulkJobs);\n      expect(mockEmailSendingStarter.queueBulkEmails).not.toHaveBeenCalled();\n    });\n\n    it('should get queue stats from Bull', async () => {\n      const stats = await service.getQueueStats();\n\n      expect(stats).toEqual({\n        waiting: 5,\n        active: 2,\n        completed: 100,\n        failed: 3,\n      });\n      expect(mockEmailSendProducer.getQueueStats).toHaveBeenCalled();\n      expect(mockEmailSendingStarter.getQueueStats).not.toHaveBeenCalled();\n    });\n  });\n\n  describe('Temporal Backend', () => {\n    beforeEach(() => {\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.TEMPORAL);\n      // Re-create service to pick up new config\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n    });\n\n    it('should use Temporal backend when EMAIL_QUEUE_BACKEND=temporal', () => {\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n      expect(service.isTemporal()).toBe(true);\n      expect(service.isBull()).toBe(false);\n    });\n\n    it('should queue single email via Temporal', async () => {\n      await service.queueEmail(mockJobData);\n\n      expect(mockEmailSendingStarter.queueEmail).toHaveBeenCalledWith({\n        to: mockJobData.to,\n        subject: mockJobData.subject,\n        template: mockJobData.template,\n        templateData: mockJobData.templateData,\n        userId: mockJobData.userId,\n        metadata: mockJobData.metadata,\n      });\n      expect(mockEmailSendProducer.queueEmail).not.toHaveBeenCalled();\n    });\n\n    it('should queue bulk emails via Temporal', async () => {\n      const bulkJobs: EmailJobData[] = [mockJobData, { ...mockJobData, to: 'test2@example.com' }];\n\n      await service.queueBulkEmails(bulkJobs);\n\n      expect(mockEmailSendingStarter.queueBulkEmails).toHaveBeenCalledWith({\n        emails: bulkJobs.map((job) => ({\n          to: job.to,\n          subject: job.subject,\n          template: job.template,\n          templateData: job.templateData,\n          userId: job.userId,\n          metadata: job.metadata,\n        })),\n      });\n      expect(mockEmailSendProducer.queueBulkEmails).not.toHaveBeenCalled();\n    });\n\n    it('should get queue stats from Temporal', async () => {\n      const stats = await service.getQueueStats();\n\n      expect(stats).toEqual({\n        waiting: 0, // Temporal doesn't have waiting\n        active: 1,\n        completed: 50,\n        failed: 1,\n      });\n      expect(mockEmailSendingStarter.getQueueStats).toHaveBeenCalled();\n      expect(mockEmailSendProducer.getQueueStats).not.toHaveBeenCalled();\n    });\n  });\n\n  describe('Default Backend', () => {\n    it('should default to Bull backend when EMAIL_QUEUE_BACKEND is not set', () => {\n      mockConfigService.get.mockReturnValue(undefined);\n      // Re-create service to pick up new config\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.BULL);\n    });\n  });\n\n  describe('Case Insensitive Backend Selection', () => {\n    it('should handle lowercase \"temporal\"', () => {\n      mockConfigService.get.mockReturnValue('temporal');\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n    });\n\n    it('should handle uppercase \"TEMPORAL\"', () => {\n      mockConfigService.get.mockReturnValue('TEMPORAL');\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n    });\n\n    it('should handle mixed case \"TeMpOrAl\"', () => {\n      mockConfigService.get.mockReturnValue('TeMpOrAl');\n      service = new EmailQueueService(\n        mockConfigService,\n        mockEmailSendProducer,\n        mockEmailSendingStarter,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n    });\n  });\n});\n",
  "new_string": "/**\n * Email Queue Service Verification Test\n *\n * Temporary test to verify the EmailQueueService works correctly\n * with both Bull and Temporal backends.\n */\n\nimport { EmailQueueService, EmailQueueBackend } from './email-queue.service';\nimport { EmailSendProducer } from '../queues/email-send.producer';\nimport { EmailSendingStarter } from '../../temporal/workflows/notification/email-sending.starter';\nimport { ConfigService } from '@nestjs/config';\nimport { EmailJobData } from '../dto/send-email.input';\n\ndescribe('EmailQueueService Verification', () => {\n  const mockJobData: EmailJobData = {\n    to: 'test@example.com',\n    subject: 'Test Email',\n    template: 'welcome' as any,\n    templateData: { name: 'Test User' },\n    userId: 'user-123',\n  };\n\n  function createMocks() {\n    const mockEmailSendProducer = {\n      queueEmail: jest.fn().mockResolvedValue(undefined),\n      queueBulkEmails: jest.fn().mockResolvedValue(undefined),\n      getQueueStats: jest.fn().mockResolvedValue({\n        waiting: 5,\n        active: 2,\n        completed: 100,\n        failed: 3,\n      }),\n    };\n\n    const mockEmailSendingStarter = {\n      queueEmail: jest.fn().mockResolvedValue({\n        workflowId: 'wf-123',\n        runId: 'run-123',\n        taskQueue: 'email-task-queue',\n        workflowType: 'emailSending',\n      }),\n      queueBulkEmails: jest.fn().mockResolvedValue({\n        workflowId: 'bulk-wf-123',\n        runId: 'bulk-run-123',\n        taskQueue: 'email-task-queue',\n        workflowType: 'bulkEmailSending',\n        emailCount: 10,\n      }),\n      getQueueStats: jest.fn().mockResolvedValue({\n        active: 1,\n        completed: 50,\n        failed: 1,\n      }),\n      getWorkflowStatus: jest.fn(),\n      getWorkflowResult: jest.fn(),\n      cancelWorkflow: jest.fn(),\n    };\n\n    const mockConfigService = {\n      get: jest.fn(),\n    };\n\n    return { mockEmailSendProducer, mockEmailSendingStarter, mockConfigService };\n  }\n\n  describe('Bull Backend', () => {\n    it('should use Bull backend when EMAIL_QUEUE_BACKEND=bull', () => {\n      const { mockEmailSendProducer, mockEmailSendingStarter, mockConfigService } = createMocks();\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.BULL);\n\n      const service = new EmailQueueService(\n        mockConfigService as any,\n        mockEmailSendProducer as any,\n        mockEmailSendingStarter as any,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.BULL);\n      expect(service.isBull()).toBe(true);\n      expect(service.isTemporal()).toBe(false);\n    });\n\n    it('should queue single email via Bull', async () => {\n      const { mockEmailSendProducer, mockEmailSendingStarter, mockConfigService } = createMocks();\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.BULL);\n\n      const service = new EmailQueueService(\n        mockConfigService as any,\n        mockEmailSendProducer as any,\n        mockEmailSendingStarter as any,\n      );\n\n      await service.queueEmail(mockJobData);\n\n      expect(mockEmailSendProducer.queueEmail).toHaveBeenCalledWith(mockJobData);\n      expect(mockEmailSendingStarter.queueEmail).not.toHaveBeenCalled();\n    });\n\n    it('should queue bulk emails via Bull', async () => {\n      const { mockEmailSendProducer, mockEmailSendingStarter, mockConfigService } = createMocks();\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.BULL);\n      const bulkJobs: EmailJobData[] = [mockJobData, { ...mockJobData, to: 'test2@example.com' }];\n\n      const service = new EmailQueueService(\n        mockConfigService as any,\n        mockEmailSendProducer as any,\n        mockEmailSendingStarter as any,\n      );\n\n      await service.queueBulkEmails(bulkJobs);\n\n      expect(mockEmailSendProducer.queueBulkEmails).toHaveBeenCalledWith(bulkJobs);\n      expect(mockEmailSendingStarter.queueBulkEmails).not.toHaveBeenCalled();\n    });\n\n    it('should get queue stats from Bull', async () => {\n      const { mockEmailSendProducer, mockEmailSendingStarter, mockConfigService } = createMocks();\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.BULL);\n\n      const service = new EmailQueueService(\n        mockConfigService as any,\n        mockEmailSendProducer as any,\n        mockEmailSendingStarter as any,\n      );\n\n      const stats = await service.getQueueStats();\n\n      expect(stats).toEqual({\n        waiting: 5,\n        active: 2,\n        completed: 100,\n        failed: 3,\n      });\n      expect(mockEmailSendProducer.getQueueStats).toHaveBeenCalled();\n      expect(mockEmailSendingStarter.getQueueStats).not.toHaveBeenCalled();\n    });\n  });\n\n  describe('Temporal Backend', () => {\n    it('should use Temporal backend when EMAIL_QUEUE_BACKEND=temporal', () => {\n      const { mockEmailSendProducer, mockEmailSendingStarter, mockConfigService } = createMocks();\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.TEMPORAL);\n\n      const service = new EmailQueueService(\n        mockConfigService as any,\n        mockEmailSendProducer as any,\n        mockEmailSendingStarter as any,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n      expect(service.isTemporal()).toBe(true);\n      expect(service.isBull()).toBe(false);\n    });\n\n    it('should queue single email via Temporal', async () => {\n      const { mockEmailSendProducer, mockEmailSendingStarter, mockConfigService } = createMocks();\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.TEMPORAL);\n\n      const service = new EmailQueueService(\n        mockConfigService as any,\n        mockEmailSendProducer as any,\n        mockEmailSendingStarter as any,\n      );\n\n      await service.queueEmail(mockJobData);\n\n      expect(mockEmailSendingStarter.queueEmail).toHaveBeenCalledWith({\n        to: mockJobData.to,\n        subject: mockJobData.subject,\n        template: mockJobData.template,\n        templateData: mockJobData.templateData,\n        userId: mockJobData.userId,\n        metadata: mockJobData.metadata,\n      });\n      expect(mockEmailSendProducer.queueEmail).not.toHaveBeenCalled();\n    });\n\n    it('should queue bulk emails via Temporal', async () => {\n      const { mockEmailSendProducer, mockEmailSendingStarter, mockConfigService } = createMocks();\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.TEMPORAL);\n      const bulkJobs: EmailJobData[] = [mockJobData, { ...mockJobData, to: 'test2@example.com' }];\n\n      const service = new EmailQueueService(\n        mockConfigService as any,\n        mockEmailSendProducer as any,\n        mockEmailSendingStarter as any,\n      );\n\n      await service.queueBulkEmails(bulkJobs);\n\n      expect(mockEmailSendingStarter.queueBulkEmails).toHaveBeenCalledWith({\n        emails: bulkJobs.map((job) => ({\n          to: job.to,\n          subject: job.subject,\n          template: job.template,\n          templateData: job.templateData,\n          userId: job.userId,\n          metadata: job.metadata,\n        })),\n      });\n      expect(mockEmailSendProducer.queueBulkEmails).not.toHaveBeenCalled();\n    });\n\n    it('should get queue stats from Temporal', async () => {\n      const { mockEmailSendProducer, mockEmailSendingStarter, mockConfigService } = createMocks();\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.TEMPORAL);\n\n      const service = new EmailQueueService(\n        mockConfigService as any,\n        mockEmailSendProducer as any,\n        mockEmailSendingStarter as any,\n      );\n\n      const stats = await service.getQueueStats();\n\n      expect(stats).toEqual({\n        waiting: 0, // Temporal doesn't have waiting\n        active: 1,\n        completed: 50,\n        failed: 1,\n      });\n      expect(mockEmailSendingStarter.getQueueStats).toHaveBeenCalled();\n      expect(mockEmailSendProducer.getQueueStats).not.toHaveBeenCalled();\n    });\n  });\n\n  describe('Default Backend', () => {\n    it('should default to Bull backend when EMAIL_QUEUE_BACKEND is not set', () => {\n      const { mockEmailSendProducer, mockEmailSendingStarter, mockConfigService } = createMocks();\n      mockConfigService.get.mockReturnValue(EmailQueueBackend.BULL); // Default from service\n\n      const service = new EmailQueueService(\n        mockConfigService as any,\n        mockEmailSendProducer as any,\n        mockEmailSendingStarter as any,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.BULL);\n    });\n  });\n\n  describe('Case Insensitive Backend Selection', () => {\n    it('should handle lowercase \"temporal\"', () => {\n      const { mockEmailSendProducer, mockEmailSendingStarter, mockConfigService } = createMocks();\n      mockConfigService.get.mockReturnValue('temporal');\n\n      const service = new EmailQueueService(\n        mockConfigService as any,\n        mockEmailSendProducer as any,\n        mockEmailSendingStarter as any,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n    });\n\n    it('should handle uppercase \"TEMPORAL\"', () => {\n      const { mockEmailSendProducer, mockEmailSendingStarter, mockConfigService } = createMocks();\n      mockConfigService.get.mockReturnValue('TEMPORAL');\n\n      const service = new EmailQueueService(\n        mockConfigService as any,\n        mockEmailSendProducer as any,\n        mockEmailSendingStarter as any,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n    });\n\n    it('should handle mixed case \"TeMpOrAl\"', () => {\n      const { mockEmailSendProducer, mockEmailSendingStarter, mockConfigService } = createMocks();\n      mockConfigService.get.mockReturnValue('TeMpOrAl');\n\n      const service = new EmailQueueService(\n        mockConfigService as any,\n        mockEmailSendProducer as any,\n        mockEmailSendingStarter as any,\n      );\n\n      expect(service.getBackend()).toBe(EmailQueueBackend.TEMPORAL);\n    });\n  });\n});\n"
}

🔧 Tool: Bash
Input: {
  "command": "npx jest src/modules/notifications/services/email-queue.service.spec.ts 2>&1",
  "description": "Run verification test",
  "timeout": 120000
}
All tests pass. Now let me clean up the temporary test file and update the todo list:

🔧 Tool: Bash
Input: {
  "command": "rm /Users/piteer/workspace/radca-prawny/legal/.worktrees/feature-temporal/apps/backend/src/modules/notifications/services/email-queue.service.spec.ts",
  "description": "Remove temporary verification test",
  "timeout": 10000
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Creating EmailQueueService adapter",
      "content": "Create EmailQueueService adapter to support both Bull and Temporal backends",
      "status": "completed"
    },
    {
      "activeForm": "Updating NotificationManagerService",
      "content": "Update NotificationManagerService to use EmailQueueService",
      "status": "completed"
    },
    {
      "activeForm": "Updating EmailNotificationListener",
      "content": "Update EmailNotificationListener to use EmailQueueService",
      "status": "completed"
    },
    {
      "activeForm": "Adding environment variable support",
      "content": "Add EMAIL_QUEUE_BACKEND environment variable support",
      "status": "completed"
    },
    {
      "activeForm": "Updating notifications module",
      "content": "Update notifications module providers",
      "status": "completed"
    },
    {
      "activeForm": "Verifying implementation",
      "content": "Verify the implementation works",
      "status": "completed"
    }
  ]
}
Let me run the type check one more time to ensure everything compiles:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | head -10",
  "description": "Type check backend",
  "timeout": 120000
}
<summary>
## Summary: Migrate Email Queue from Bull to Temporal

### Changes Implemented
- **Created `EmailQueueService` adapter** (`apps/backend/src/modules/notifications/services/email-queue.service.ts`) - A unified service that abstracts both Bull and Temporal backends, allowing seamless switching via environment variable
- **Updated `NotificationManagerService`** to use `EmailQueueService` instead of directly using `EmailSendProducer`
- **Updated `EmailNotificationListener`** to use `EmailQueueService` instead of directly using `EmailSendProducer`
- **Added `EMAIL_QUEUE_BACKEND` environment variable** to `.env.example` for switching between `bull` (default) and `temporal` backends
- **Updated `NotificationsModule`** to export the new `EmailQueueService`
- **Fixed TypeScript errors** in migration file and test file

### Files Modified
- `apps/backend/src/modules/notifications/services/email-queue.service.ts` (new)
- `apps/backend/src/modules/notifications/services/notification-manager.service.ts`
- `apps/backend/src/modules/notifications/listeners/email-notification.listener.ts`
- `apps/backend/src/modules/notifications/notifications.module.ts`
- `apps/backend/.env.example`
- `apps/backend/src/modules/temporal/bull-to-temporal-email-migration.ts` (bug fix)
- `apps/backend/src/shared/startup/startup.validation.spec.ts` (bug fix)

### Notes for Developer
The Temporal email workflow feature was already implemented. This change completes the migration by:
1. Creating an adapter service (`EmailQueueService`) that abstracts both Bull (legacy) and Temporal (new) backends
2. Using the `EMAIL_QUEUE_BACKEND` environment variable to switch backends:
   - `EMAIL_QUEUE_BACKEND=bull` (default) - uses Bull queues
   - `EMAIL_QUEUE_BACKEND=temporal` - uses Temporal workflows
3. Existing code remains backward compatible - Bull continues to work as default
4. To migrate to Temporal: set `EMAIL_QUEUE_BACKEND=temporal` in environment and run the migration script

### Verification Status
- TypeScript compilation: ✓ passes
- Jest unit tests: ✓ all 12 tests passed for `EmailQueueService` adapter
- Linting: ✓ no errors in new code

The implementation allows gradual migration from Bull to Temporal without requiring immediate changes to existing calling code.
</summary>