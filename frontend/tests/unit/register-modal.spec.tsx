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

test("signup without session shows verification guidance and skips bootstrap", async () => {
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

  fireEvent.click(screen.getByRole("button", { name: "注册" }));

  await waitFor(() =>
    expect(
      screen.getByText("验证邮件已发送。请先完成邮箱验证并登录，之后再继续完成账号初始化。")
    ).toBeTruthy()
  );
  expect(mocks.bootstrapUser).not.toHaveBeenCalled();
});
