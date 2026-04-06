import { betterAuth } from "better-auth";
import { pool } from "@/lib/db";

export const auth = betterAuth({
  database: pool,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 72,
    password: {
      async validate(password: string) {
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^a-zA-Z0-9]/.test(password);
        if (!hasNumber && !hasSpecial) {
          return {
            error: "Password must contain at least one number or special character.",
          };
        }
        return { success: true };
      },
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  trustedOrigins: [
    "https://duosign.vercel.app",
    "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
