import { prisma } from "../lib/db/prisma";

async function main() {
  try {
    await prisma.$connect();
    console.log("DATABASE_CONNECTED");
    process.exit(0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log("DATABASE_CONNECTION_FAILED:", message);
    process.exit(1);
  }
}

main();
