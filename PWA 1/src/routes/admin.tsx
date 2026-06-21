import {
  createFileRoute,
  Outlet,
  Link,
  useRouterState,
  useNavigate,
  Navigate,
} from "@tanstack/react-router";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Megaphone,
  FileText,
  Settings,
  LogOut,
  Droplet,
  Menu,
  X,
  Home,
  Image as ImageIcon,
  Calendar,
  Clock,
  ClipboardList,
  Database,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";
import { getCurrentDateTimeInfo } from "@/lib/date-utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Dashboard — KSR PMI UNHAS" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminLayout,
});

const allNav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/", label: "Beranda", icon: Home, exact: true },
  { to: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  { to: "/admin/requests", label: "Permintaan Masuk", icon: Inbox },
  { to: "/admin/donors", label: "Pencarian Pendonor", icon: Users },
  { to: "/admin/announcements", label: "Pengumuman", icon: Megaphone },
  { to: "/admin/articles", label: "Publikasi", icon: FileText },
  { to: "/admin/gallery", label: "Galeri", icon: ImageIcon },
  { to: "/admin/cms", label: "Header · Hero · Footer", icon: Settings },
  { to: "/admin/forms", label: "Pengaturan Form", icon: ClipboardList },
  { to: "/admin/database", label: "Pengaturan Database", icon: Database },
];

// Filter out items with empty/invalid label or to
const nav = allNav.filter(
  (item) => item.label && item.label.trim() !== "" && item.to && item.to.trim() !== "",
);

function AdminLayout() {
  const { user, logout, ready } = useAdminAuth();
  const { cms, requests } = useAdminStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Count unprocessed requests (status "Baru" or no PIC)
  const unprocessedCount = requests.filter((r) => {
    const hasPic = r.pic && (Array.isArray(r.pic) ? r.pic.length > 0 : true);
    return r.status === "Baru" || !hasPic;
  }).length;

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (open) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [open]);

  // Get formatted date and time
  const dateTimeInfo = getCurrentDateTimeInfo();

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Memuat...
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" />;

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-background transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <Link to="/" className="flex items-center gap-1.5">
            {cms.header.logo ? (
              <img
                src={cms.header.logo}
                alt={cms.header.orgName}
                className="h-12 w-12 object-contain"
              />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
                <Droplet className="h-6 w-6 fill-current" />
              </span>
            )}
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg text-ink">{cms.header.orgName}</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Admin Console
              </span>
            </span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {nav.map((n) => {
            const active = isActive(n.to, n.exact);
            const isExternal =
              n.to.startsWith("http://") || n.to.startsWith("https://") || n.to.startsWith("//");
            const linkClasses = [
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
              active
                ? "bg-ink text-background"
                : "text-foreground/75 hover:bg-muted hover:text-foreground",
            ].join(" ");

            if (isExternal) {
              return (
                <a
                  key={n.to}
                  href={n.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className={linkClasses}
                >
                  <n.icon className="h-4 w-4" />
                  <span className="flex-1">{n.label}</span>
                  {/* Badge for unprocessed requests */}
                  {n.to === "/admin/requests" && unprocessedCount > 0 && (
                    <span className={`ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                      active 
                        ? 'bg-background text-ink' 
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      {unprocessedCount}
                    </span>
                  )}
                </a>
              );
            }

            return (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className={linkClasses}>
                <n.icon className="h-4 w-4" />
                <span className="flex-1">{n.label}</span>
                {/* Badge for unprocessed requests */}
                {n.to === "/admin/requests" && unprocessedCount > 0 && (
                  <span className={`ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                    active 
                      ? 'bg-background text-ink' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {unprocessedCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-ink text-xs font-semibold text-background">
              {user.name
                .split(" ")
                .map((s) => s[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/auth" });
              }}
              title="Keluar"
              className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-background hover:text-primary"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop mobile */}
      {open && (
        <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-5 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Buka menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-lg">Admin Console</span>
          <div className="w-5" />
        </header>
        
        {/* Desktop DateTime Display - Fixed */}
        <div className="hidden lg:block fixed top-0 right-0 left-72 z-30 border-b border-border bg-background backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-end gap-4 px-6 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                {dateTimeInfo.dayName}, {dateTimeInfo.date} {dateTimeInfo.monthName} {dateTimeInfo.year}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-mono font-medium text-foreground">
                {dateTimeInfo.hours}:{dateTimeInfo.minutes}:{dateTimeInfo.seconds}
              </span>
            </div>
          </div>
        </div>
        
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:px-8 lg:pb-8 xl:px-10 xl:pb-10 lg:pt-[80px] xl:pt-[90px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
