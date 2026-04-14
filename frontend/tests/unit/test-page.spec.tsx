import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  executeTest: vi.fn(),
  getAccessToken: vi.fn(),
  getCurrentUserEmail: vi.fn(),
  getUserContext: vi.fn(),
  listTestRuns: vi.fn(),
  loadDraft: vi.fn(),
  registerModal: vi.fn(),
  saveDraft: vi.fn(),
  submitContactLead: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  executeTest: mocks.executeTest,
  getUserContext: mocks.getUserContext,
  listTestRuns: mocks.listTestRuns,
  submitContactLead: mocks.submitContactLead,
}));

vi.mock("../../lib/auth", () => ({
  getAccessToken: mocks.getAccessToken,
  getCurrentUserEmail: mocks.getCurrentUserEmail,
}));

vi.mock("../../lib/draft", () => ({
  loadDraft: mocks.loadDraft,
  saveDraft: mocks.saveDraft,
}));

vi.mock("../../components/auth/RegisterModal", () => ({
  RegisterModal: (props: unknown) => {
    mocks.registerModal(props);
    return null;
  },
}));

import TestPage from "../../app/test/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadDraft.mockReturnValue(null);
  mocks.listTestRuns.mockResolvedValue([]);
  mocks.getAccessToken.mockResolvedValue("token");
  mocks.getCurrentUserEmail.mockResolvedValue("user@example.com");
  mocks.getUserContext.mockResolvedValue({
    is_registered: false,
    total_query_count: 0,
    total_mentioned_count: 0,
    total_exposure_count: 0,
    free_test_quota_remaining: 3,
    overall_evaluation_text: "",
  });
});

test("authenticated but unregistered users are routed into bootstrap flow", async () => {
  render(<TestPage />);

  // Wait for context to load (refreshContext completes)
  await waitFor(() => {
    expect(mocks.getUserContext).toHaveBeenCalled();
  });

  fireEvent.change(screen.getByPlaceholderText("公司名"), {
    target: { value: "Acme" },
  });
  fireEvent.change(screen.getByPlaceholderText("产品关键词"), {
    target: { value: "云服务器" },
  });

  fireEvent.click(screen.getByRole("button", { name: "查看AI曝光情况" }));

  await waitFor(() => {
    expect(mocks.registerModal.mock.calls.at(-1)?.[0]).toMatchObject({
      open: true,
      mode: "bootstrap",
      bootstrapEmail: "user@example.com",
    });
  });

  expect(mocks.executeTest).not.toHaveBeenCalled();
});
