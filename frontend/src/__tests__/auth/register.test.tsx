/**
 * Register form tests — AUTH-01, AUTH-03, AUTH-06
 *
 * Run: cd frontend && npx jest src/__tests__/auth/register.test.tsx
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/auth/register/page";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/lib/auth-client", () => ({ signUp: { email: jest.fn().mockResolvedValue({ error: null }) } }));
jest.mock("@/widgets/navigation-bar/NavigationBar", () => {
  function MockNav() { return <nav />; }
  return MockNav;
});
jest.mock("next/image", () => ({ __esModule: true, default: (p: Record<string, unknown>) => <img {...p} /> }));

import { signUp } from "@/lib/auth-client";

async function fillAndSubmit(email: string, password: string) {
  render(<RegisterPage />);
  await userEvent.type(screen.getByPlaceholderText(/you@example\.com/i), email);
  const [pass, confirm] = screen.getAllByPlaceholderText("••••••••");
  await userEvent.type(pass, password);
  await userEvent.type(confirm, password);
  fireEvent.submit(screen.getByRole("button", { name: /create account/i }));
}

describe("AUTH-01 — register form password min length", () => {
  it("shows error for 7-character password", async () => {
    await fillAndSubmit("user@example.com", "seven77");
    await waitFor(() => {
      expect(screen.getByText(/min 8 characters/i)).toBeInTheDocument();
    });
    expect(signUp.email).not.toHaveBeenCalled();
  });

  it("allows 8-character password", async () => {
    (signUp.email as jest.Mock).mockClear();
    await fillAndSubmit("user@example.com", "eight888");
    await waitFor(() => {
      expect(signUp.email).toHaveBeenCalled();
    });
  });
});

describe("AUTH-03 — register form password max length", () => {
  it("shows error for 73-character password", async () => {
    await fillAndSubmit("user@example.com", "a".repeat(73));
    await waitFor(() => {
      expect(screen.getByText(/max 72 characters/i)).toBeInTheDocument();
    });
  });

  it("allows 72-character password", async () => {
    (signUp.email as jest.Mock).mockClear();
    await fillAndSubmit("user@example.com", "a".repeat(72));
    await waitFor(() => {
      expect(signUp.email).toHaveBeenCalled();
    });
  });
});

describe("AUTH-06 — register sanitizes display name from email", () => {
  it("uses plain email local part as name", async () => {
    (signUp.email as jest.Mock).mockClear();
    await fillAndSubmit("nana@example.com", "securePass1");
    await waitFor(() => {
      expect(signUp.email).toHaveBeenCalledWith(
        expect.objectContaining({ name: "nana" })
      );
    });
  });

  it("strips HTML/script tags from derived name", async () => {
    (signUp.email as jest.Mock).mockClear();
    await fillAndSubmit('"><script>@example.com', "securePass1");
    await waitFor(() => {
      const call = (signUp.email as jest.Mock).mock.calls[0][0];
      expect(call.name).not.toMatch(/<|>|"/);
    });
  });

  it("falls back to 'User' when all chars are stripped", async () => {
    (signUp.email as jest.Mock).mockClear();
    await fillAndSubmit("!!!@example.com", "securePass1");
    await waitFor(() => {
      expect(signUp.email).toHaveBeenCalledWith(
        expect.objectContaining({ name: "User" })
      );
    });
  });

  it("truncates long local part to 50 chars", async () => {
    (signUp.email as jest.Mock).mockClear();
    await fillAndSubmit(`${"a".repeat(100)}@example.com`, "securePass1");
    await waitFor(() => {
      const call = (signUp.email as jest.Mock).mock.calls[0][0];
      expect(call.name.length).toBeLessThanOrEqual(50);
    });
  });
});
