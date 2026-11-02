import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main(): Promise<void> {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
  const db = drizzle(client);
  console.log("Applying Postgres migrations from ./drizzle...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Done.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
