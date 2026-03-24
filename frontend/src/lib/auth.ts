import { betterAuth } from "better-auth";
import { Pool } from "pg";

const pool = new Pool({
  host: "aws-1-eu-west-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.yqhuvnbgtrbjrfmykznk",
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  trustedOrigins: [
    "https://duosign.vercel.app",
    "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
