/**
 * Login form tests — AUTH-01, AUTH-03, AUTH-05
 *
 * Run: cd frontend && npx jest src/__tests__/auth/login.test.tsx
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/auth/login/page";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/lib/auth-client", () => ({ signIn: { email: jest.fn().mockResolvedValue({ error: null }) } }));
jest.mock("@/widgets/navigation-bar/NavigationBar", () => {
  function MockNav() { return <nav />; }
  return MockNav;
});
jest.mock("next/image", () => ({ __esModule: true, default: (p: Record<string, unknown>) => <img {...p} /> }));

import { signIn } from "@/lib/auth-client";

describe("AUTH-01 — login form password min length", () => {
  it("shows error for 7-character password (min is 8)", async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText(/you@example\.com/i), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "seven77");
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/min 8 characters/i)).toBeInTheDocument();
    });
    expect(signIn.email).not.toHaveBeenCalled();
  });

  it("shows error for 6-character password", async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText(/you@example\.com/i), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "six666");
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/min 8 characters/i)).toBeInTheDocument();
    });
  });

  it("allows submission with 8-character password", async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText(/you@example\.com/i), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "eight888");
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(signIn.email).toHaveBeenCalled();
    });
  });
});

describe("AUTH-03 — login form password max length", () => {
  it("shows error for 73-character password", async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText(/you@example\.com/i), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "a".repeat(73));
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/max 72 characters/i)).toBeInTheDocument();
    });
  });

  it("allows 72-character password", async () => {
    (signIn.email as jest.Mock).mockClear();
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText(/you@example\.com/i), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "a".repeat(72));
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(signIn.email).toHaveBeenCalled();
    });
  });
});

describe("AUTH-05 — login form trims email", () => {
  it("trims leading/trailing spaces from email before API call", async () => {
    (signIn.email as jest.Mock).mockClear();
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText(/you@example\.com/i), "  user@example.com  ");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "password1");
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(signIn.email).toHaveBeenCalledWith(
        expect.objectContaining({ email: "user@example.com" })
      );
    });
  });
});
