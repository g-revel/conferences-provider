import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

// La connexion poolée Neon (hostname en "-pooler") passe par PgBouncer en mode
// transaction, incompatible avec les prepared statements par défaut de postgres.js
// (sinon erreurs aléatoires "prepared statement already exists" sous charge
// concurrente) — toujours `prepare: false`.
const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 5 });

export const db = drizzle(client, { schema });
