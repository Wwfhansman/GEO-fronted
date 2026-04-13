# Deployment Notes

## Frontend

- Deploy `frontend/` to Vercel.
- Set `NEXT_PUBLIC_SUPABASE_URL`.
- Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Set `NEXT_PUBLIC_API_BASE_URL`.
- Set `NEXT_PUBLIC_ANALYTICS_WRITE_KEY`.

## Backend

- Deploy `backend/` to Aliyun.
- Set database, Supabase, model-provider, and email environment variables.
- Configure CORS to allow the frontend origin.
- Keep admin-only dashboard access controlled by `ADMIN_EMAIL_WHITELIST`.

## Mobile

- Verify landing, test, result, and dashboard pages render without horizontal overflow on a 390px-wide viewport.
