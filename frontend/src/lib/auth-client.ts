import { createAuthClient } from "better-auth/react";

function resolveAuthBaseURL(): string {
  if (typeof window !== "undefined") {
    const { origin, hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return origin;
    }
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export const authClient = createAuthClient({
  baseURL: resolveAuthBaseURL(),
});

export const { signIn, signUp, signOut, useSession, updateUser, deleteUser } = authClient;
