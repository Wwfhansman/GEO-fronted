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

test("contact sales success opens confirmation modal and disables the button after closing", async () => {
  mocks.getUserContext.mockResolvedValue({
    is_registered: true,
    total_query_count: 3,
    total_mentioned_count: 0,
    total_exposure_count: 0,
    free_test_quota_remaining: 0,
    overall_evaluation_text: "",
  });
  mocks.submitContactLead.mockResolvedValue({ success: true });

  render(<TestPage />);

  const contactButton = await screen.findByRole("button", { name: /联系销售获取更多测试额度/ });
  fireEvent.click(contactButton);

  await waitFor(() => {
    expect(mocks.submitContactLead).toHaveBeenCalledTimes(1);
  });
  expect(await screen.findByText("销售顾问会尽快联系您")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /我知道了/ }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: /已提交，等待顾问联系/ }).hasAttribute("disabled")).toBe(true);
  });
});

test("contact sales rate limit shows modal feedback and disables the button", async () => {
  mocks.getUserContext.mockResolvedValue({
    is_registered: true,
    total_query_count: 3,
    total_mentioned_count: 0,
    total_exposure_count: 0,
    free_test_quota_remaining: 0,
    overall_evaluation_text: "",
  });
  mocks.submitContactLead.mockRejectedValue(new Error("Lead submit is limited to once per 24 hours"));

  render(<TestPage />);

  fireEvent.click(await screen.findByRole("button", { name: /联系销售获取更多测试额度/ }));

  expect(await screen.findByText("您今天已经提交过一次需求")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /我知道了/ }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: /24h 内已提交申请/ }).hasAttribute("disabled")).toBe(true);
  });
});

test("authenticated but unregistered users are routed into bootstrap flow", async () => {
  render(<TestPage />);

  // Wait for context to load (refreshContext completes)
  await waitFor(() => {
    expect(mocks.getUserContext).toHaveBeenCalled();
  });

  fireEvent.change(screen.getByPlaceholderText("例如：华为、阿里"), {
    target: { value: "Acme" },
  });
  fireEvent.change(screen.getByPlaceholderText("输入需要检测的产品关键词，如床垫、电竞椅"), {
    target: { value: "云服务器" },
  });

  fireEvent.click(screen.getByRole("button", { name: /评估 AI 曝光度/ }));

  await waitFor(() => {
    expect(mocks.registerModal.mock.calls.at(-1)?.[0]).toMatchObject({
      open: true,
      mode: "bootstrap",
      bootstrapEmail: "user@example.com",
    });
  });

  expect(mocks.executeTest).not.toHaveBeenCalled();
});

test("bootstrap success only executes the pending test once", async () => {
  mocks.executeTest.mockResolvedValue({
    test_run_id: "run-1",
    status: "completed",
    is_mentioned: true,
    mentioned_count_for_query: 1,
    exposure_count_for_query: 1,
    final_match_source: "rule",
    evaluation_text: "ok",
  });

  render(<TestPage />);

  await waitFor(() => {
    expect(mocks.getUserContext).toHaveBeenCalled();
  });

  fireEvent.change(screen.getByPlaceholderText("例如：华为、阿里"), {
    target: { value: "Acme" },
  });
  fireEvent.change(screen.getByPlaceholderText("输入需要检测的产品关键词，如床垫、电竞椅"), {
    target: { value: "云服务器" },
  });

  fireEvent.click(screen.getByRole("button", { name: /评估 AI 曝光度/ }));

  await waitFor(() => {
    expect(mocks.registerModal.mock.calls.at(-1)?.[0]).toMatchObject({
      open: true,
      mode: "bootstrap",
    });
  });

  mocks.getUserContext.mockResolvedValue({
    is_registered: true,
    total_query_count: 1,
    total_mentioned_count: 1,
    total_exposure_count: 1,
    free_test_quota_remaining: 2,
    overall_evaluation_text: "ok",
  });

  const onSuccess = mocks.registerModal.mock.calls.at(-1)?.[0].onSuccess as (() => Promise<void>) | undefined;
  expect(onSuccess).toBeTruthy();

  await Promise.all([onSuccess?.(), onSuccess?.()]);

  await waitFor(() => {
    expect(mocks.executeTest).toHaveBeenCalledTimes(1);
  });
});
