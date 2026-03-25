import { betterAuth } from "better-auth";
import { pool } from "@/lib/db";

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
