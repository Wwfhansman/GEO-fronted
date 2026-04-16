import { getAccessToken } from "./auth";
import { getVisitorId } from "./analytics";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const visitorId = typeof window !== "undefined" ? getVisitorId() : null;
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (visitorId) {
    headers["X-Visitor-Id"] = visitorId;
  }

  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
    ...(options.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

// --- Auth ---

export interface BootstrapUserRequest {
  email: string;
  phone: string;
  company_name: string;
}

export interface BootstrapUserResponse {
  user_id: string;
  email: string;
  phone: string;
  company_name: string;
}

export function bootstrapUser(data: BootstrapUserRequest) {
  return request<BootstrapUserResponse>("/api/auth/bootstrap", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Context ---

export interface UserContext {
  is_registered: boolean;
  total_query_count: number;
  total_mentioned_count: number;
  total_exposure_count: number;
  free_test_quota_remaining: number;
  overall_evaluation_text: string;
}

export function getUserContext() {
  return request<UserContext>("/api/context/me");
}

// --- Tests ---

export interface ExecuteTestRequest {
  company_name: string;
  product_keyword: string;
  industry: string;
  provider: string;
}

export interface ExecuteTestResponse {
  test_run_id: string;
  status: string;
  is_mentioned: boolean;
  mentioned_count_for_query: number;
  exposure_count_for_query: number;
  final_match_source: string;
  evaluation_text: string;
}

export function executeTest(data: ExecuteTestRequest) {
  return request<ExecuteTestResponse>("/api/tests/execute", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface TestRunDetail {
  id: string;
  input_company_name: string;
  input_product_keyword: string;
  input_industry: string;
  input_provider: string;
  raw_response_text: string | null;
  is_mentioned: boolean | null;
  mentioned_count_for_query: number | null;
  exposure_count_for_query: number | null;
  final_match_source: string | null;
  evaluation_text: string | null;
  status: string;
  created_at: string;
}

export interface TestRunSummary {
  id: string;
  input_company_name: string;
  input_industry: string;
  input_provider: string;
  is_mentioned: boolean | null;
  status: string;
  created_at: string;
}

export function listTestRuns() {
  return request<TestRunSummary[]>("/api/tests/runs");
}

export function getTestRun(runId: string) {
  return request<TestRunDetail>(`/api/tests/runs/${runId}`);
}

// --- Leads ---

export interface ContactLeadRequest {
  test_run_id?: string;
  test_summary: Record<string, unknown>;
}

export function submitContactLead(data: ContactLeadRequest) {
  return request<{ success: boolean }>("/api/leads/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
