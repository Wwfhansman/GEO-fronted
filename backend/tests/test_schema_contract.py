from pathlib import Path


def test_init_sql_contains_core_tables():
    project_root = Path(__file__).resolve().parents[2]
    sql = (project_root / "infra/supabase/migrations/0001_init.sql").read_text()
    for table in [
        "users",
        "user_test_metrics",
        "test_runs",
        "prompt_templates",
        "contact_leads",
    ]:
        assert f"create table {table}" in sql.lower()
