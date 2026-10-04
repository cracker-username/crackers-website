import { processOutboxBatch } from "../lib/services/outboxService";

async function main() {
  console.log("[Outbox Runner] Starting outbox processing batch...");
  try {
    const result = await processOutboxBatch(50);
    console.log(`[Outbox Runner] Completed. Processed: ${result.processedCount}, Failed: ${result.failedCount}, Dead: ${result.deadCount}`);
    process.exit(0);
  } catch (err) {
    console.error("[Outbox Runner] Error processing outbox:", err);
    process.exit(1);
  }
}

main();
