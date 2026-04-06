/**
 * Auth rate limiting tests — AUTH-04
 *
 * NOTE: better-auth's rateLimit is enforced at the library level.
 * These tests verify the configuration is present in auth.ts.
 *
 * Run: cd frontend && npx jest src/__tests__/auth/rate-limit.test.ts
 */

jest.mock("better-auth", () => ({
  betterAuth: jest.fn((config) => ({ _config: config })),
}));
jest.mock("@/lib/db", () => ({ pool: {} }));

import { betterAuth } from "better-auth";

describe("AUTH-04 — better-auth rate limiting configured", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock("better-auth", () => ({
      betterAuth: jest.fn((config) => ({ _config: config })),
    }));
    jest.mock("@/lib/db", () => ({ pool: {} }));
  });

  it("has rateLimit.enabled: true", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/lib/auth");
    const config = (betterAuth as jest.Mock).mock.calls[0]?.[0];
    expect(config?.rateLimit?.enabled).toBe(true);
  });

  it("has a rateLimit.window (seconds)", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/lib/auth");
    const config = (betterAuth as jest.Mock).mock.calls[0]?.[0];
    expect(typeof config?.rateLimit?.window).toBe("number");
    expect(config?.rateLimit?.window).toBeGreaterThan(0);
  });

  it("has a rateLimit.max", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/lib/auth");
    const config = (betterAuth as jest.Mock).mock.calls[0]?.[0];
    expect(typeof config?.rateLimit?.max).toBe("number");
    expect(config?.rateLimit?.max).toBeGreaterThan(0);
  });
});
