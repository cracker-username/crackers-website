import EmbeddedPostgres from "embedded-postgres";
import path from "path";

async function main() {
  const dbDir = path.resolve(process.cwd(), ".postgres-data");
  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    user: "postgres",
    password: "postgrespassword",
    port: 5433,
    persistent: true,
  });

  await pg.start();
  const client = pg.getPgClient();
  await client.connect();
  await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
  const res = await client.query("SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'");
  console.log("pg_trgm extension status:", res.rows[0]?.extname === "pg_trgm" ? "ENABLED" : "NOT FOUND");
  await client.end();
  await pg.stop();
}

main();
