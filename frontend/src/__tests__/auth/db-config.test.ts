/**
 * DB config test — AUTH-07
 * Verifies rejectUnauthorized is true.
 *
 * Run: cd frontend && npx jest src/__tests__/auth/db-config.test.ts
 */

jest.mock("pg", () => {
  const Pool = jest.fn().mockImplementation((config) => ({ _config: config }));
  return { Pool };
});

describe("AUTH-07 — DB SSL config", () => {
  it("has rejectUnauthorized: true", () => {
    // Re-require so the mock Pool is used
    jest.resetModules();
    jest.mock("pg", () => {
      const Pool = jest.fn().mockImplementation((config) => ({ _config: config }));
      return { Pool };
    });

    const { Pool } = require("pg");
    require("@/lib/db");

    const callArgs = (Pool as jest.Mock).mock.calls[0]?.[0];
    expect(callArgs?.ssl?.rejectUnauthorized).toBe(true);
  });
});
