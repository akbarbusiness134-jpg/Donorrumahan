import { createFileRoute, Link } from "@tanstack/react-router";
import { Inbox, Users, Megaphone, FileText, AlertCircle } from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import { BloodBadge, StatusBadge } from "@/components/admin/Badges";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

export { BloodBadge, StatusBadge };

function AdminOverview() {
  const { requests, donors, announcements, articles } = useAdminStore();

  const newReqs = requests.filter((r) => r.status === "Baru").length;
  const urgent = announcements.filter((a) => a.urgent && a.active).length;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Ringkasan</p>
        <h1 className="mt-2 font-display text-4xl text-ink md:text-5xl">Selamat datang kembali.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Pantau permintaan darah, koordinasikan pendonor, dan kelola konten beranda dari satu pusat
          kendali.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Donor Darah Pengganti (DDP)" cta="" className="space-y-3">
          <Row
            icon={Inbox}
            label="Permintaan Baru"
            value={`${newReqs}`}
            accent
          />
          <Row icon={Users} label="Total Pendonor" value={`${donors.length}`} />
        </Section>

        <Section title="Konten aktif" cta="" className="space-y-3">
          <Row
            icon={Megaphone}
            label="Pengumuman aktif"
            value={`${announcements.filter((a) => a.active).length}/5`}
          />
          <Row icon={FileText} label="Publikasi tayang" value={`${articles.length}`} />
          <Row icon={AlertCircle} label="Tagar darurat" value={`${urgent}`} accent />
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  to,
  cta,
  children,
  className,
}: {
  title: string;
  to?: string;
  cta?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={["rounded-2xl border border-border bg-card p-6 shadow-card", className].join(" ")}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {to && cta && (
          <Link to={to} className="text-xs font-medium text-primary hover:underline">
            {cta}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-lg border px-4 py-3",
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 text-sm">
        <Icon
          className={["h-4 w-4", accent ? "text-primary" : "text-muted-foreground"].join(" ")}
        />
        <span className="text-foreground/80">{label}</span>
      </div>
      <span className={["font-display text-xl", accent ? "text-primary" : "text-ink"].join(" ")}>
        {value}
      </span>
    </div>
  );
}
