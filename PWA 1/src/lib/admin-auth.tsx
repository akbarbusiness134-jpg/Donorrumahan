import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { STORAGE_KEYS } from "./constants";

type User = { email: string; name: string };
type AuthCtx = {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  ready: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

// Mock credentials — replace with Lovable Cloud auth later
const VALID = { email: "admin@sahabatdarah.id", password: "admin123", name: "Admin Sahabat" };

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEYS.ADMIN_USER) : null;
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* noop */
    }
    setReady(true);
  }, []);

  const login: AuthCtx["login"] = async (email, password) => {
    await new Promise((r) => setTimeout(r, 400));
    if (email.trim().toLowerCase() === VALID.email && password === VALID.password) {
      const u = { email: VALID.email, name: VALID.name };
      setUser(u);
      window.localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(u));
      return { ok: true };
    }
    return { ok: false, error: "Email atau password salah." };
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
  };

  return <Ctx.Provider value={{ user, login, logout, ready }}>{children}</Ctx.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
