"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthSessionStarted } from "@/lib/auth/authBridge";
import type { User, Session } from "@supabase/supabase-js";

/** Does a persisted Supabase session token exist? Checked WITHOUT loading
 *  the client library — the storage key shape is `sb-<ref>-auth-token`. */
function hasPersistedSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) return true;
    }
  } catch {
    /* storage unavailable - treat as anonymous */
  }
  return false;
}

/** Is the current URL carrying auth material (magic-link / OAuth return)? */
function hasAuthParamsInUrl(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hash.includes("access_token=") || window.location.search.includes("code=");
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userName: string | null; // User's display name from user_metadata
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  userName: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract user name from user_metadata or email
  const getUserName = (user: User | null): string | null => {
    if (!user) return null;

    // Try user_metadata.full_name first (Supabase default)
    const fullName = user.user_metadata?.full_name;
    if (fullName) return fullName;

    // Extract name from email (part before @) like Atlas does
    if (user.email) {
      return user.email.split("@")[0];
    }

    return null;
  };

  // Lazy Supabase init (2026-07-14 perf pass): the client library is
  // ~34 kB gzip and used to ship in every route's First Load JS just to
  // call getSession() for visitors who have no session. Initialize only
  // when a persisted token exists, the URL carries auth params, or the
  // login flow signals a same-tab sign-in (authBridge). Anonymous
  // visitors resolve immediately with user=null and never fetch the
  // client chunk.
  const initializedRef = useRef(false);
  useEffect(() => {
    let disposed = false;
    let subscription: { unsubscribe: () => void } | null = null;

    const init = async () => {
      if (disposed || initializedRef.current) return;
      initializedRef.current = true;
      const { supabase } = await import("@/lib/supabase");
      if (disposed) return;
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (disposed) return;
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      // Listen for auth changes
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (disposed) return;
        setSession(session);
        setUser(session?.user ?? null);
      });
      subscription = sub;
    };

    if (hasPersistedSession() || hasAuthParamsInUrl()) {
      void init();
    } else {
      setIsLoading(false);
    }
    const offBridge = onAuthSessionStarted(() => void init());

    return () => {
      disposed = true;
      offBridge();
      subscription?.unsubscribe();
      initializedRef.current = false;
    };
  }, []);

  const userName = getUserName(user);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, userName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
