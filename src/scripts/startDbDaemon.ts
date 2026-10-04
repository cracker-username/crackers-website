import EmbeddedPostgres from "embedded-postgres";
import path from "path";
import fs from "fs";

const dbDir = path.resolve(process.cwd(), ".postgres-data");

async function run() {
  const needsInit = !fs.existsSync(path.join(dbDir, "PG_VERSION"));

  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    user: "postgres",
    password: "postgrespassword",
    port: 5433,
    persistent: true,
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
  });

  if (needsInit) {
    console.log("Initializing PostgreSQL cluster with UTF8 encoding...");
    await pg.initialise();
  }

  console.log("Starting PostgreSQL on localhost:5433...");
  await pg.start();

  // Ensure crackers_db exists with UTF8
  try {
    const client = pg.getPgClient();
    await client.connect();
    const dbCheck = await client.query("SELECT 1 FROM pg_database WHERE datname = 'crackers_db'");
    if (dbCheck.rowCount === 0) {
      await client.query("CREATE DATABASE crackers_db WITH ENCODING 'UTF8'");
      console.log("Database crackers_db created with UTF8 encoding.");
    }
    await client.end();
  } catch (e) {
    console.warn("Database creation check error (might already exist):", e);
  }

  // Ensure pg_trgm is enabled
  try {
    const client = pg.getPgClient();
    await client.connect();
    await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
    console.log("pg_trgm extension enabled on crackers_db.");
    await client.end();
  } catch (e) {
    console.warn("Extension pg_trgm creation notice:", e);
  }

  console.log("PostgreSQL daemon running and ready on port 5433.");

  process.on("SIGINT", async () => {
    console.log("Stopping PostgreSQL daemon...");
    await pg.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("Stopping PostgreSQL daemon...");
    await pg.stop();
    process.exit(0);
  });
}

run().catch((err) => {
  console.error("Failed to start PostgreSQL daemon:", err);
  process.exit(1);
});
