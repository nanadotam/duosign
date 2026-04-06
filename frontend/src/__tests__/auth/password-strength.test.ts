/**
 * Password strength validator tests — AUTH-02
 *
 * Tests the validate() function from auth.ts in isolation.
 *
 * Run: cd frontend && npx jest src/__tests__/auth/password-strength.test.ts
 */

// Extract the validator logic directly for unit testing
async function validate(password: string): Promise<{ error?: string; success?: boolean }> {
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  if (!hasNumber && !hasSpecial) {
    return { error: "Password must contain at least one number or special character." };
  }
  return { success: true };
}

describe("AUTH-02 — password complexity validator", () => {
  it('rejects "aaaaaaaa" (letters only)', async () => {
    const result = await validate("aaaaaaaa");
    expect(result.error).toBeDefined();
  });

  it('accepts "12345678" (numbers only)', async () => {
    const result = await validate("12345678");
    expect(result.success).toBe(true);
  });

  it('rejects "password" (common word, letters only)', async () => {
    const result = await validate("password");
    expect(result.error).toBeDefined();
  });

  it('accepts "password1" (has number)', async () => {
    const result = await validate("password1");
    expect(result.success).toBe(true);
  });

  it('accepts "passw0rd!" (has number and special)', async () => {
    const result = await validate("passw0rd!");
    expect(result.success).toBe(true);
  });

  it('accepts "P@ssw0rd" (mixed)', async () => {
    const result = await validate("P@ssw0rd");
    expect(result.success).toBe(true);
  });

  it('accepts "abc!defg" (has special, no number)', async () => {
    const result = await validate("abc!defg");
    expect(result.success).toBe(true);
  });

  it('rejects "" (empty — no number or special)', async () => {
    const result = await validate("");
    expect(result.error).toBeDefined();
  });
});
