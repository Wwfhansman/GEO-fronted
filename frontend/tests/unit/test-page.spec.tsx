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

  const contactButton = await screen.findByRole("button", { name: /Contact sales for more quota/ });
  fireEvent.click(contactButton);

  await waitFor(() => {
    expect(mocks.submitContactLead).toHaveBeenCalledTimes(1);
  });
  expect(await screen.findByText("A sales advisor will contact you soon")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /Got it/ }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: /Submitted, waiting for advisor/ }).hasAttribute("disabled")).toBe(true);
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

  fireEvent.click(await screen.findByRole("button", { name: /Contact sales for more quota/ }));

  expect(await screen.findByText("You already submitted once today")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /Got it/ }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: /Already submitted within 24h/ }).hasAttribute("disabled")).toBe(true);
  });
});

test("authenticated but unregistered users are routed into bootstrap flow", async () => {
  render(<TestPage />);

  // Wait for context to load (refreshContext completes)
  await waitFor(() => {
    expect(mocks.getUserContext).toHaveBeenCalled();
  });

  fireEvent.change(screen.getByPlaceholderText("e.g. Huawei, Alibaba"), {
    target: { value: "Acme" },
  });
  fireEvent.change(screen.getByPlaceholderText("Enter the keyword to audit, such as mattress or gaming chair"), {
    target: { value: "云服务器" },
  });

  expect(screen.queryByText("Latest audit result")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: /Run AI visibility audit/ }));

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

  fireEvent.change(screen.getByPlaceholderText("e.g. Huawei, Alibaba"), {
    target: { value: "Acme" },
  });
  fireEvent.change(screen.getByPlaceholderText("Enter the keyword to audit, such as mattress or gaming chair"), {
    target: { value: "云服务器" },
  });

  fireEvent.click(screen.getByRole("button", { name: /Run AI visibility audit/ }));

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
