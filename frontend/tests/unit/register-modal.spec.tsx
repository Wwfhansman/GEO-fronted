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

test("signup only requires email and password before email verification", async () => {
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
  expect(phoneInput).toBeFalsy();
  expect(companyInput).toBeFalsy();

  fireEvent.change(emailInput!, {
    target: { value: "user@example.com" },
  });
  fireEvent.change(passwordInput!, {
    target: { value: "password123" },
  });

  fireEvent.click(screen.getAllByRole("button", { name: "Create account" }).at(-1)!);

  await waitFor(() =>
    expect(
      screen.getByText("Account created. Please verify your email to continue. After confirmation, you will be redirected back automatically.")
    ).toBeTruthy()
  );
  expect(mocks.signUpWithEmail).toHaveBeenCalledWith(
    "user@example.com",
    "password123"
  );
  expect(mocks.bootstrapUser).not.toHaveBeenCalled();
});

test("signup with immediate session closes modal and calls onSuccess", async () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  mocks.signUpWithEmail.mockResolvedValue({
    data: { session: { access_token: "token" } },
    error: null,
  });

  const { container } = render(<RegisterModal open onClose={onClose} onSuccess={onSuccess} />);
  const emailInput = container.querySelector('input[name="email"]');
  const passwordInput = container.querySelector('input[name="password"]');

  fireEvent.change(emailInput!, {
    target: { value: "user@example.com" },
  });
  fireEvent.change(passwordInput!, {
    target: { value: "password123" },
  });

  fireEvent.click(screen.getAllByRole("button", { name: "Create account" }).at(-1)!);

  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(mocks.bootstrapUser).not.toHaveBeenCalled();
});
