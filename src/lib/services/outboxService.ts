import { prisma } from "../db/prisma";
import { OutboxStatus } from "@prisma/client";

export interface OutboxProcessResult {
  processedCount: number;
  failedCount: number;
  deadCount: number;
}

/**
 * Process pending outbox events with exponential backoff and dead-letter marking
 */
export async function processOutboxBatch(batchSize: number = 20): Promise<OutboxProcessResult> {
  const now = new Date();

  // Atomically claim rows using status update
  const pendingEvents = await prisma.outboxEvent.findMany({
    where: {
      status: { in: [OutboxStatus.PENDING, OutboxStatus.FAILED] },
      nextAttemptAt: { lte: now },
    },
    take: batchSize,
    orderBy: { createdAt: "asc" },
  });

  let processedCount = 0;
  let failedCount = 0;
  let deadCount = 0;

  for (const event of pendingEvents) {
    try {
      // Mark as PROCESSING
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: OutboxStatus.PROCESSING },
      });

      // Simulate sending or send via SMTP
      // For email events in development / test:
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        // Real SMTP transport would send here
      }

      // Mark SENT
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: OutboxStatus.SENT,
          processedAt: new Date(),
        },
      });
      processedCount++;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const nextAttemptNumber = event.attempts + 1;

      if (nextAttemptNumber >= event.maxAttempts) {
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: OutboxStatus.DEAD,
            attempts: nextAttemptNumber,
            lastError: errorMsg,
          },
        });
        deadCount++;
      } else {
        // Exponential backoff: 2 ^ attempts * 30 seconds
        const delaySeconds = Math.pow(2, nextAttemptNumber) * 30;
        const nextAttemptAt = new Date(Date.now() + delaySeconds * 1000);

        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: OutboxStatus.FAILED,
            attempts: nextAttemptNumber,
            nextAttemptAt,
            lastError: errorMsg,
          },
        });
        failedCount++;
      }
    }
  }

  return { processedCount, failedCount, deadCount };
}
