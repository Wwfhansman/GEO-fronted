import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;
let _cachedAccessToken: string | null = null;
let _authStateBound = false;

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
  if (!_authStateBound) {
    _authStateBound = true;
    void _supabase.auth.getSession().then(({ data }) => {
      _cachedAccessToken = data.session?.access_token ?? null;
    }).catch(() => {
      _cachedAccessToken = null;
    });
    _supabase.auth.onAuthStateChange((_event, session) => {
      _cachedAccessToken = session?.access_token ?? null;
    });
  }
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
  const result = await sb.auth.signInWithPassword({ email, password });
  _cachedAccessToken = result.data.session?.access_token ?? null;
  return result;
}

export async function getAccessToken() {
  if (typeof window === "undefined") return null;
  try {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    _cachedAccessToken = data.session?.access_token ?? null;
    return _cachedAccessToken;
  } catch {
    return null;
  }
}

export function getCachedAccessToken() {
  return _cachedAccessToken;
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
  _cachedAccessToken = null;
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
