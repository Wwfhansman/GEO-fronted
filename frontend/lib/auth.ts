import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export interface PendingBootstrapProfile {
  phone: string;
  companyName: string;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _supabase = createClient(url, key);
  return _supabase;
}

/** @internal use getSupabaseClient() for direct access */
function getSupabase() {
  return getSupabaseClient();
}

function callbackUrl(): string {
  if (typeof window === "undefined") return "/auth/callback";
  return `${window.location.origin}/auth/callback`;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  profile?: PendingBootstrapProfile,
) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not available");
  return sb.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl(),
      data: profile
        ? {
            phone: profile.phone,
            companyName: profile.companyName,
          }
        : undefined,
    },
  });
}

export async function signInWithEmail(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not available");
  return sb.auth.signInWithPassword({ email, password });
}

export async function getAccessToken() {
  if (typeof window === "undefined") return null;
  try {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

export async function getCurrentUserEmail() {
  if (typeof window === "undefined") return null;
  try {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session?.user?.email ?? null;
  } catch {
    return null;
  }
}
