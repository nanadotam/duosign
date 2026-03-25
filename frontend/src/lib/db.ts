import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __duosignPool: Pool | undefined;
}

const connectionConfig = {
  host: process.env.DB_HOST ?? "aws-1-eu-west-1.pooler.supabase.com",
  port: Number(process.env.DB_PORT ?? 6543),
  database: process.env.DB_NAME ?? "postgres",
  user: process.env.DB_USER ?? "postgres.yqhuvnbgtrbjrfmykznk",
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
};

export const pool = globalThis.__duosignPool ?? new Pool(connectionConfig);

if (process.env.NODE_ENV !== "production") {
  globalThis.__duosignPool = pool;
}
