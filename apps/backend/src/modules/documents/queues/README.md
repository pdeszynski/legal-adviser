# Ruling Indexing Queue

## Overview

The Ruling Indexing Queue is a Bull-based job queue system that periodically fetches and indexes legal rulings from external sources (SAOS and ISAP) into the local database.

## Architecture

### Components

1. **RulingIndexingJobData** (`ruling-index.job.ts`)
   - Defines the job data structure for indexing jobs
   - Includes source (SAOS/ISAP), date ranges, batch size, and update preferences

2. **RulingIndexingProcessor** (`ruling-index.processor.ts`)
   - Processes indexing jobs from the queue
   - Fetches rulings from external APIs (SAOS/ISAP adapters)
   - Deduplicates against existing local rulings by signature
   - Inserts new rulings or updates existing ones
   - Updates search vectors for full-text search

3. **RulingIndexingProducer** (`ruling-index.producer.ts`)
   - Adds indexing jobs to the queue
   - Provides methods for daily sync, manual triggers
   - Queue management (stats, cleaning, pause/resume)

4. **RulingIndexingScheduler** (`ruling-index.scheduler.ts`)
   - Scheduled tasks using @nestjs/schedule
   - Daily sync: Every day at 2:00 AM (Europe/Warsaw)
   - Weekly deep sync: Every Sunday at 3:00 AM (Europe/Warsaw)

## Scheduled Jobs

### Daily Sync
- **Schedule**: Every day at 2:00 AM
- **Duration**: Last 1 day
- **Purpose**: Keep database up-to-date with latest rulings
- **Update Existing**: Yes

### Weekly Deep Sync
- **Schedule**: Every Sunday at 3:00 AM
- **Duration**: Last 7 days
- **Purpose**: Catch any missed rulings from the week
- **Update Existing**: Yes

## Usage

### Queue a Manual Indexing Job

```typescript
import { RulingIndexingProducer } from './queues';

constructor(
  private readonly rulingIndexingProducer: RulingIndexingProducer,
) {}

// Manual sync for last 3 days from SAOS
await this.rulingIndexingProducer.queueRulingIndexing({
  source: 'SAOS',
  dateFrom: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  dateTo: new Date(),
  batchSize: 100,
  updateExisting: true,
});
```

### Trigger Daily Sync Programmatically

```typescript
await this.rulingIndexingProducer.queueDailySync(1); // Sync last 1 day
```

### Check Job Status

```typescript
const job = await this.rulingIndexingProducer.getJobStatus(jobId);
const state = await job.getState(); // 'waiting', 'active', 'completed', 'failed'
const result = await this.rulingIndexingProducer.getJobResult(jobId);
```

### Queue Statistics

```typescript
const stats = await this.rulingIndexingProducer.getQueueStats();
console.log(`Active: ${stats.active}, Waiting: ${stats.waiting}`);
```

## Job Result Structure

```typescript
{
  source: 'SAOS' | 'ISAP',
  processedCount: number,     // Total rulings processed
  addedCount: number,         // New rulings added
  updatedCount: number,       // Existing rulings updated
  skippedCount: number,       // Duplicates skipped
  failedCount: number,        // Failed to process
  processingTimeMs: number,   // Total processing time
  processedSignatures: string[], // List of processed signatures
  errors: Array<{             // Error details
    signature: string,
    error: string,
  }>
}
```

## Error Handling

- Jobs are retried up to 3 times with exponential backoff
- Individual ruling failures don't fail the entire job
- Errors are logged and tracked in the job result
- Failed jobs are kept for debugging (100 failed jobs retained)

## Configuration

Environment variables (optional):
- `REDIS_HOST`: Redis server host (default: localhost)
- `REDIS_PORT`: Redis server port (default: 6379)
- `REDIS_PASSWORD`: Redis server password (optional)
- `REDIS_DB`: Redis database number (default: 0)

## Dependencies

- **Bull**: Queue management
- **@nestjs/schedule**: Task scheduling
- **LegalRulingService**: Database operations
- **SaosAdapter/IsapAdapter**: External API integration
- **QueueRegistry**: Centralized queue configuration

## Monitoring

View job statistics via Bull Board (if configured) or programmatically:

```typescript
const stats = await this.rulingIndexingProducer.getQueueStats();
// { waiting, active, completed, failed, delayed, paused }
```

## Future Enhancements

- [ ] Add support for filtering by legal area
- [ ] Implement incremental sync based on last indexed date
- [ ] Add webhook notifications on job completion
- [ ] Implement backpressure for large indexing jobs
- [ ] Add metrics/observability integration
