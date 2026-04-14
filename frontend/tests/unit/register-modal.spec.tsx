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

  render(<RegisterModal open onClose={vi.fn()} />);

  fireEvent.change(screen.getByPlaceholderText("邮箱（必填）"), {
    target: { value: "user@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("密码（必填）"), {
    target: { value: "password123" },
  });
  fireEvent.change(screen.getByPlaceholderText("手机号（必填）"), {
    target: { value: "13800000000" },
  });
  fireEvent.change(screen.getByPlaceholderText("公司名（必填）"), {
    target: { value: "Acme" },
  });

  fireEvent.click(screen.getByRole("button", { name: "立即注册" }));

  await waitFor(() =>
    expect(
      screen.getByText("注册后没有拿到登录态。当前项目大概率仍开启了邮箱验证，请先关闭 Supabase 的 Confirm email。")
    ).toBeTruthy()
  );
  expect(mocks.signUpWithEmail).toHaveBeenCalledWith(
    "user@example.com",
    "password123",
    { phone: "13800000000", companyName: "Acme" }
  );
  expect(mocks.bootstrapUser).not.toHaveBeenCalled();
});
