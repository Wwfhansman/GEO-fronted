import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  bootstrapUser: vi.fn(),
  signUpWithEmail: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  bootstrapUser: mocks.bootstrapUser,
}));

vi.mock("../../lib/auth", () => ({
  signUpWithEmail: mocks.signUpWithEmail,
}));

import { RegisterModal } from "../../components/auth/RegisterModal";

beforeEach(() => {
  vi.clearAllMocks();
});

test("signup without session shows config guidance and skips bootstrap", async () => {
  mocks.signUpWithEmail.mockResolvedValue({
    data: { session: null },
    error: null,
  });

  const { container } = render(<RegisterModal open onClose={vi.fn()} />);
  const emailInput = container.querySelector('input[name="email"]');
  const passwordInput = container.querySelector('input[name="password"]');
  const phoneInput = container.querySelector('input[name="phone"]');
  const companyInput = container.querySelector('input[name="companyName"]');

  expect(emailInput).toBeTruthy();
  expect(passwordInput).toBeTruthy();
  expect(phoneInput).toBeTruthy();
  expect(companyInput).toBeTruthy();

  fireEvent.change(emailInput!, {
    target: { value: "user@example.com" },
  });
  fireEvent.change(passwordInput!, {
    target: { value: "password123" },
  });
  fireEvent.change(phoneInput!, {
    target: { value: "13800000000" },
  });
  fireEvent.change(companyInput!, {
    target: { value: "Acme" },
  });

  fireEvent.click(screen.getAllByRole("button", { name: "Create account" }).at(-1)!);

  await waitFor(() =>
    expect(
      screen.getByText("No active session was returned after sign up. Supabase Confirm email is likely still enabled. Please disable it first.")
    ).toBeTruthy()
  );
  expect(mocks.signUpWithEmail).toHaveBeenCalledWith(
    "user@example.com",
    "password123",
    { phone: "13800000000", companyName: "Acme" }
  );
  expect(mocks.bootstrapUser).not.toHaveBeenCalled();
});
