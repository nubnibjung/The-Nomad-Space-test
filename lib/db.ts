import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL ?? "postgres://nomad:nomad@localhost:5432/nomad_space";

declare global {
  var nomadPostgresPool: Pool | undefined;
}

export const db = globalThis.nomadPostgresPool ?? new Pool({ connectionString });

if (process.env.NODE_ENV !== "production") {
  globalThis.nomadPostgresPool = db;
}
