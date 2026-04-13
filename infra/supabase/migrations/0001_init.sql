create table users (
  id uuid primary key,
  supabase_auth_id uuid unique not null,
  email text unique not null,
  email_verified boolean not null default false,
  phone text not null,
  company_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_test_metrics (
  user_id uuid primary key references users(id) on delete cascade,
  total_query_count integer not null default 0,
  total_mentioned_count integer not null default 0,
  total_exposure_count integer not null default 0,
  free_test_quota_total integer not null default 3,
  free_test_quota_remaining integer not null default 3,
  overall_evaluation_text text not null default '',
  last_test_at timestamptz,
  updated_at timestamptz not null default now()
);

create table prompt_templates (
  id uuid primary key,
  industry text not null,
  template_version text not null,
  template_content text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table test_runs (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  input_company_name text not null,
  input_product_keyword text not null,
  input_industry text not null,
  input_provider text not null,
  template_id uuid references prompt_templates(id),
  template_version text,
  final_prompt text not null,
  provider_model_name text,
  raw_response_text text,
  raw_provider_response jsonb,
  response_latency_ms integer,
  normalized_company_name text,
  rule_matched boolean not null default false,
  llm_review_triggered boolean not null default false,
  final_match_source text,
  is_mentioned boolean,
  mentioned_count_for_query integer,
  exposure_count_for_query integer,
  matched_snippets jsonb,
  evaluation_text text,
  evaluation_source text,
  status text not null,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table contact_leads (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  test_run_id uuid references test_runs(id),
  email text not null,
  phone text not null,
  company_name text not null,
  test_summary jsonb not null,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);
