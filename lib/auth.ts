import { supabase } from "./supabase";

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Send magic link to email for passwordless authentication
 */
export async function signInWithMagicLink(email: string) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  // Check if email is allowed using centralized helper
  // Import dynamically to avoid issues with server/client boundaries
  const { isAllowedUserEmail } = await import("@/lib/auth/allowed-user");
  if (!isAllowedUserEmail(email)) {
    throw new Error("Access restricted. Only authorized users can sign in.");
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/admin`,
      shouldCreateUser: true,
    },
  });

  if (error) throw error;
  return data;
}
