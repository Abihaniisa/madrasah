import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.warn("Supabase env vars missing. See .env.example.");
}

export const supabase = createClient(url ?? "", key ?? "");

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function isAuthorized(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  const email = data.session.user.email;
  if (!email) return false;

  const { data: row } = await supabase
    .from("authorized_users")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (!row) {
    // Not on the allowlist. Clear the session immediately.
    await supabase.auth.signOut();
    return false;
  }
  return true;
}
