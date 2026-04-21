import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
  setSession: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.replace,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("../../lib/auth", () => ({
  getSupabaseClient: () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      getSession: mocks.getSession,
      setSession: mocks.setSession,
    },
  }),
}));

import AuthCallbackPage from "../../app/auth/callback/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
  mocks.setSession.mockResolvedValue({ error: null });
  mocks.getSession.mockResolvedValue({
    data: {
      session: {
        user: {
          email: "user@example.com",
          user_metadata: {
            phone: "13800000000",
            companyName: "Acme",
          },
        },
      },
    },
  });
  window.localStorage.clear();
  window.history.replaceState({}, "", "/auth/callback");
});

test("hash token callback stores session and redirects to test page", async () => {
  window.history.replaceState(
    {},
    "",
    "/auth/callback#access_token=token123&refresh_token=refresh456&type=signup"
  );

  render(<AuthCallbackPage />);

  await waitFor(() => {
    expect(mocks.setSession).toHaveBeenCalledWith({
      access_token: "token123",
      refresh_token: "refresh456",
    });
  });
  await waitFor(() => {
    expect(mocks.replace).toHaveBeenCalledWith("/test?complete_registration=1");
  });
});

test("expired otp in hash shows a clear message", async () => {
  window.history.replaceState(
    {},
    "",
    "/auth/callback#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"
  );

  render(<AuthCallbackPage />);

  expect(
    await screen.findByText("This verification link has expired. Please sign up again or request a new verification email.")
  ).toBeTruthy();
  expect(mocks.replace).not.toHaveBeenCalled();
});
