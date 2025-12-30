# Queue System Guide

This directory contains the queue infrastructure for the Legal AI Platform backend. Queues enable **asynchronous task processing** for long-running operations like AI document generation, PDF exports, and email notifications.

## 📋 Table of Contents

- [Overview](#overview)
- [Queue Naming Conventions](#queue-naming-conventions)
- [Creating Queues](#creating-queues)
- [Adding Jobs to Queues](#adding-jobs-to-queues)
- [Processing Jobs](#processing-jobs)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Monitoring](#monitoring)
- [Testing Queues](#testing-queues)

## 🎯 Overview

### Why Queues?

Queues provide:

1. **Asynchronous Processing**: Long-running tasks don't block the main request/response cycle
2. **Reliability**: Jobs are persisted and can be retried on failure
3. **Scalability**: Process jobs across multiple workers
4. **Priority**: Handle important jobs first
5. **Rate Limiting**: Control job processing rate

### Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Service   │────────▶│    Queue    │────────▶│  Processor  │
│  (Producer) │  add    │   (Redis)   │ process │  (Consumer) │
└─────────────┘         └─────────────┘         └─────────────┘
```

## 📝 Queue Naming Conventions

All queues follow the pattern: **`domain-entity-action`** or **`domain-action`**

- **domain**: Business domain or module (e.g., `document`, `email`, `notification`)
- **entity**: Specific entity (optional for simple domains)
- **action**: Action being performed (e.g., `generation`, `export-pdf`, `send`)

### Examples

- `document-generation` - Generate legal documents
- `document-export-pdf` - Export documents as PDF
- `email-send` - Send emails
- `notification-push` - Send push notifications

See [`base/queue-names.ts`](./base/queue-names.ts) for the complete list.

## 🏗️ Creating Queues

### Step 1: Add Queue Name to Constants

Add your queue name to `base/queue-names.ts`:

```typescript
export const QUEUE_NAMES = {
  // ... existing queues ...
  
  MY_DOMAIN: {
    ACTION: 'mydomain-action',
  },
} as const;
```

### Step 2: Register Queue in Module

Use `QueueRegistry.registerQueue()` to register your queue:

```typescript
import { Module } from '@nestjs/common';
import { QueueRegistry } from '@/shared/queues';
import { QUEUE_NAMES } from '@/shared/queues';

@Module({
  imports: [
    QueueRegistry.registerQueue(QUEUE_NAMES.MY_DOMAIN.ACTION),
  ],
})
export class MyModule {}
```

### Step 3: Define Job Data Interface

Create a job data interface extending `BaseJobData`:

```typescript
import { BaseJobData } from '@/shared/queues';

export interface MyJobData extends BaseJobData {
  documentId: string;
  userId: string;
  options?: {
    format: 'pdf' | 'docx';
  };
}
```

## 📤 Adding Jobs to Queues

### In Services

Inject the queue and add jobs:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUE_NAMES } from '@/shared/queues';
import { MyJobData } from './my-job-data.interface';
import { JobOptions } from '@/shared/queues';

@Injectable()
export class MyService {
  constructor(
    @InjectQueue(QUEUE_NAMES.MY_DOMAIN.ACTION)
    private myQueue: Queue<MyJobData>,
  ) {}

  async processSomething(documentId: string, userId: string) {
    const jobData: MyJobData = {
      documentId,
      userId,
      createdAt: new Date(),
      metadata: {
        source: 'api',
      },
    };

    const jobOptions: JobOptions = {
      attempts: 3,
      delay: 1000, // Wait 1 second before processing
      priority: 10, // Higher priority = processed first
      removeOnComplete: true,
      removeOnFail: false, // Keep failed jobs for debugging
    };

    await this.myQueue.add(jobData, jobOptions);

    return { message: 'Job added to queue' };
  }
}
```

### Job Options

- **priority**: Higher numbers = processed first (default: 0)
- **delay**: Milliseconds to wait before processing (default: 0)
- **attempts**: Number of retry attempts (default: 3)
- **ttl**: Time to live in milliseconds
- **removeOnComplete**: Remove job after completion (default: true)
- **removeOnFail**: Remove job after failure (default: true)

## 📥 Processing Jobs

### Create a Processor

Use the `@Process()` decorator to create a processor:

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { QUEUE_NAMES } from '@/shared/queues';
import { MyJobData } from './my-job-data.interface';

@Processor(QUEUE_NAMES.MY_DOMAIN.ACTION)
export class MyProcessor {
  @Process()
  async handleJob(job: Job<MyJobData>) {
    const { documentId, userId } = job.data;

    try {
      // Process the job
      const result = await this.doSomething(documentId, userId);

      // Update job progress
      await job.progress(50);

      // Complete the job
      return result;
    } catch (error) {
      // Job will be retried automatically based on attempts configuration
      throw error;
    }
  }

  @Process('high-priority')
  async handleHighPriorityJob(job: Job<MyJobData>) {
    // Process high-priority jobs differently
    // Jobs can be added with a specific name: queue.add(data, { ...options, jobId: 'high-priority' })
  }

  private async doSomething(documentId: string, userId: string) {
    // Your processing logic here
  }
}
```

### Processor Options

Configure processor concurrency and retry behavior:

```typescript
@Process({
  name: 'my-job',
  concurrency: 5, // Process 5 jobs concurrently
})
async handleJob(job: Job<MyJobData>) {
  // ...
}
```

### Job Progress

Update job progress during processing:

```typescript
await job.progress(25); // 25% complete
await job.progress(50); // 50% complete
await job.progress(100); // 100% complete
```

## ✅ Best Practices

### 1. **Queue Naming**

- ✅ Use kebab-case: `document-generation`
- ✅ Be specific: `document-export-pdf` (not just `export`)
- ✅ Use past tense for events, present tense for actions: `document-generate` (action)
- ❌ Avoid: `DocumentGeneration`, `document_generation`, `generateDocument`

### 2. **Job Data**

- ✅ Include IDs, not full entities: `documentId: string`
- ✅ Keep payload small and serializable
- ✅ Include timestamp and metadata
- ❌ Avoid: Large objects, circular references, functions, class instances

### 3. **Job Processing**

- ✅ Make processors idempotent (safe to run multiple times)
- ✅ Handle errors gracefully
- ✅ Update progress for long-running jobs
- ✅ Use appropriate concurrency limits
- ❌ Avoid: Blocking operations, infinite loops, unhandled errors

### 4. **Error Handling**

- ✅ Catch and handle specific errors
- ✅ Log errors for debugging
- ✅ Use retry logic for transient failures
- ✅ Fail fast for permanent errors
- ❌ Avoid: Swallowing errors, infinite retries

### 5. **Testing**

- ✅ Test job creation
- ✅ Test processors in isolation
- ✅ Mock queues in unit tests
- ✅ Use real queues in integration tests

## 📚 Examples

### Example 1: Document Generation Queue

```typescript
// document.service.ts
@Injectable()
export class DocumentService {
  constructor(
    @InjectQueue(QUEUE_NAMES.DOCUMENT.GENERATION)
    private documentQueue: Queue<DocumentGenerationJobData>,
  ) {}

  async generateDocument(userId: string, type: string) {
    const doc = await this.documentRepository.create({ userId, type });

    await this.documentQueue.add(
      {
        documentId: doc.id,
        userId,
        documentType: type,
        createdAt: new Date(),
      },
      {
        attempts: 3,
        delay: 0,
        priority: 10,
      },
    );

    return doc;
  }
}

// document.processor.ts
@Processor(QUEUE_NAMES.DOCUMENT.GENERATION)
export class DocumentProcessor {
  constructor(private aiClient: AiClientService) {}

  @Process({ concurrency: 2 })
  async generateDocument(job: Job<DocumentGenerationJobData>) {
    const { documentId, userId, documentType } = job.data;

    await job.progress(10);

    const content = await this.aiClient.generateDocument(documentType);

    await job.progress(80);

    await this.documentRepository.update(documentId, { content });

    await job.progress(100);

    return { documentId, success: true };
  }
}
```

### Example 2: Email Queue

```typescript
// email.service.ts
@Injectable()
export class EmailService {
  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL.SEND)
    private emailQueue: Queue<EmailJobData>,
  ) {}

  async sendWelcomeEmail(userId: string, email: string) {
    await this.emailQueue.add(
      {
        userId,
        to: email,
        template: 'welcome',
        createdAt: new Date(),
      },
      {
        attempts: 5, // More attempts for email
        delay: 0,
        priority: 5,
      },
    );
  }
}

// email.processor.ts
@Processor(QUEUE_NAMES.EMAIL.SEND)
export class EmailProcessor {
  constructor(private emailClient: EmailClient) {}

  @Process({ concurrency: 10 })
  async sendEmail(job: Job<EmailJobData>) {
    const { to, template } = job.data;

    await this.emailClient.send({
      to,
      template,
      data: job.data.metadata,
    });

    return { success: true, to };
  }
}
```

## 📊 Monitoring

### Bull Board

Bull Board provides a web UI for monitoring queues. It's automatically available in development at:

**http://localhost:PORT/admin/queues**

Features:
- View all queues and their status
- See job details (data, progress, attempts)
- Retry failed jobs
- Remove jobs
- View job history

### Programmatic Monitoring

```typescript
const queue = this.documentQueue;

// Get queue stats
const waiting = await queue.getWaitingCount();
const active = await queue.getActiveCount();
const completed = await queue.getCompletedCount();
const failed = await queue.getFailedCount();

// Get jobs
const jobs = await queue.getJobs(['waiting', 'active', 'completed', 'failed']);
```

## 🧪 Testing Queues

### Unit Testing Job Creation

```typescript
describe('DocumentService', () => {
  let service: DocumentService;
  let queue: Queue;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: getQueueToken(QUEUE_NAMES.DOCUMENT.GENERATION),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    queue = module.get<Queue>(getQueueToken(QUEUE_NAMES.DOCUMENT.GENERATION));
  });

  it('should add job to queue', async () => {
    await service.generateDocument('user-123', 'lawsuit');

    expect(queue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        documentType: 'lawsuit',
      }),
      expect.any(Object),
    );
  });
});
```

### Integration Testing Processors

```typescript
describe('DocumentProcessor', () => {
  let app: INestApplication;
  let queue: Queue;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    queue = app.get<Queue>(getQueueToken(QUEUE_NAMES.DOCUMENT.GENERATION));
  });

  it('should process document generation job', async () => {
    const job = await queue.add({
      documentId: 'doc-123',
      userId: 'user-123',
      documentType: 'lawsuit',
    });

    // Wait for job to complete
    const result = await job.finished();

    expect(result.success).toBe(true);
  });
});
```

## 📖 Further Reading

- [NestJS Bull Documentation](https://docs.nestjs.com/techniques/queues)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Bull Board Documentation](https://github.com/felixmosh/bull-board)
- [Redis Documentation](https://redis.io/docs/)

---

**Questions?** Check the [examples](./examples/) directory or reach out to the team.

