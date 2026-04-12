import fs from "fs";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __duosignPool: Pool | undefined;
}

// Supabase's connection pooler (port 6543) uses a cert chain Node doesn't trust locally.
// Set DB_SSL_REJECT_UNAUTHORIZED=false in .env.local to work around this.
// Production always enforces certificate validation — do not set this var in prod.
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false";

const sslConfig = process.env.DB_CA_CERT_PATH
  ? { rejectUnauthorized: true, ca: fs.readFileSync(process.env.DB_CA_CERT_PATH, "utf8") }
  : { rejectUnauthorized };

const connectionConfig = {
  host: process.env.DB_HOST ?? "aws-1-eu-west-1.pooler.supabase.com",
  port: Number(process.env.DB_PORT ?? 6543),
  database: process.env.DB_NAME ?? "postgres",
  user: process.env.DB_USER ?? "postgres.yqhuvnbgtrbjrfmykznk",
  password: process.env.DB_PASSWORD,
  ssl: sslConfig,
};

export const pool = globalThis.__duosignPool ?? new Pool(connectionConfig);
globalThis.__duosignPool = pool;
