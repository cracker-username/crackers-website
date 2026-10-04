import EmbeddedPostgres from "embedded-postgres";
import path from "path";

async function main() {
  const dbDir = path.resolve(process.cwd(), ".postgres-data");
  console.log("Initializing Embedded Postgres at:", dbDir);

  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    user: "postgres",
    password: "postgrespassword",
    port: 5433, // Use 5433 to avoid collision if 5432 is ever used
    persistent: true,
  });

  try {
    await pg.initialise();
    console.log("Cluster initialized.");
    await pg.start();
    console.log("Postgres started on port 5433!");

    try {
      await pg.createDatabase("crackers_db");
      console.log("Database crackers_db created.");
    } catch {
      console.log("Database crackers_db already exists or created.");
    }

    const client = pg.getPgClient();
    await client.connect();
    const res = await client.query("SELECT version()");
    console.log("Connected! PostgreSQL version:", res.rows[0].version);
    await client.end();

    console.log("Stopping test server...");
    await pg.stop();
    console.log("Server stopped successfully.");
  } catch (err) {
    console.error("Embedded Postgres test error:", err);
  }
}

main();
