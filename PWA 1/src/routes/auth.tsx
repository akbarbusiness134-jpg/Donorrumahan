import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { Droplet, ArrowLeft, Loader2 } from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk Admin — KSR PMI UNHAS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { login, user } = useAdminAuth();
  const { cms } = useAdminStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/admin" />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) navigate({ to: "/admin" });
    else setErr(res.error ?? "Gagal masuk.");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden bg-ink text-background lg:flex lg:flex-col lg:justify-between lg:items-center lg:p-12">
        <Link
          to="/"
          className="absolute top-12 left-12 inline-flex w-fit items-center gap-2 text-sm text-background/70 hover:text-background"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
        </Link>
        <div className="flex flex-col items-center justify-center flex-1">
          <Link to="/" className="flex flex-col items-center gap-6">
            {cms.header.logo ? (
              <img
                src={cms.header.logo}
                alt={cms.header.orgName}
                className="h-40 w-40 object-contain"
              />
            ) : (
              <span className="grid h-40 w-40 place-items-center rounded-full bg-primary">
                <Droplet className="h-20 w-20 fill-current" />
              </span>
            )}
            <span className="font-display text-5xl text-center">{cms.header.orgName}</span>
          </Link>
        </div>
        <p className="text-xs text-background/45">
          © 2026 {cms.header.orgName} · Internal use only
        </p>
      </div>

      <div className="flex flex-col items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-10 flex flex-col items-center gap-4 lg:hidden">
            {cms.header.logo ? (
              <img
                src={cms.header.logo}
                alt={cms.header.orgName}
                className="h-32 w-32 object-contain"
              />
            ) : (
              <span className="grid h-32 w-32 place-items-center rounded-full bg-primary text-primary-foreground">
                <Droplet className="h-16 w-16 fill-current" />
              </span>
            )}
            <span className="font-display text-3xl text-center">{cms.header.orgName}</span>
          </Link>
          <h1 className="font-display text-4xl text-ink">Masuk</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-primary">Akses Internal</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="text-xs font-medium uppercase tracking-wider text-foreground/70"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sahabatdarah.id"
                className="mt-2 w-full rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-xs font-medium uppercase tracking-wider text-foreground/70"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {err && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm text-primary">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-background transition hover:bg-primary disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>

          <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Demo:</span> admin@sahabatdarah.id /
            <span className="ml-1 font-mono">admin123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
