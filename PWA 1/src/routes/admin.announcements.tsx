import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
import { type Announcement } from "@/lib/admin-data";
import { useAdminStore } from "@/lib/admin-store";
import { toast } from "sonner";
import { FormField } from "@/components/admin/FormField";
import { Input, Textarea } from "@/components/admin/Input";
import { Modal } from "@/components/admin/Modal";
import { MAX_ACTIVE_ANNOUNCEMENTS } from "@/lib/constants";

export const Route = createFileRoute("/admin/announcements")({
  component: AnnouncementsPage,
});

const empty: Announcement = {
  id: "",
  title: "",
  description: "",
  date: "",
  time: "",
  place: "",
  urgent: false,
  active: true,
};

function AnnouncementsPage() {
  const store = useAdminStore();
  const items = store.announcements;
  const [editing, setEditing] = useState<Announcement | null>(null);

  const activeCount = items.filter((i) => i.active).length;

  function save(a: Announcement) {
    if (a.id) {
      store.updateAnnouncement(a.id, a);
      toast.success("Pengumuman berhasil diperbarui!", {
        description: "Perubahan telah disimpan",
        duration: 3000,
      });
    } else {
      const newItem: Announcement = {
        ...a,
        id: `AN-${Date.now()}`,
        active: activeCount < 5 ? a.active : false,
      };
      store.addAnnouncement(newItem);
      toast.success("Pengumuman baru berhasil ditambahkan!", {
        description: "Pengumuman telah dipublikasikan",
        duration: 3000,
      });
    }
    setEditing(null);
  }

  function toggleActive(id: string) {
    const ok = store.toggleAnnouncementActive(id);
    if (!ok) {
      alert(`Maksimal ${MAX_ACTIVE_ANNOUNCEMENTS} pengumuman aktif di beranda. Nonaktifkan salah satu lebih dulu.`);
    }
  }

  function remove(id: string) {
    if (!confirm("Hapus pengumuman ini?")) return;
    store.removeAnnouncement(id);
    toast.success("Pengumuman berhasil dihapus!", {
      description: "Pengumuman telah dihapus dari sistem",
      duration: 3000,
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary">CMS</p>
          <h1 className="mt-2 font-display text-2xl text-ink md:text-4xl">Pengumuman</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kelola papan pengumuman beranda.{" "}
            <span className="font-medium text-foreground">{activeCount}/5</span> aktif.
          </p>
        </div>
        <button
          onClick={() => setEditing(empty)}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-background hover:bg-primary"
        >
          <Plus className="h-4 w-4" /> Buat Pengumuman
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it) => (
          <article
            key={it.id}
            className={[
              "relative rounded-2xl border bg-card p-5 shadow-card transition",
              it.urgent ? "border-primary/40 ring-1 ring-primary/15" : "border-border",
              !it.active && "opacity-55",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {it.urgent && (
              <span className="absolute left-3 top-3 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 font-semibold text-ink">{it.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                  {it.description}
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" /> {it.date} · {it.time} · {it.place}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={it.active}
                  onChange={() => toggleActive(it.id)}
                  className="h-4 w-4 accent-primary"
                />
                Tampilkan di beranda
              </label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setEditing(it)}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(it.id)}
                  className="grid h-7 w-7 place-items-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <EditAnnouncement initial={editing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function EditAnnouncement({
  initial,
  onSave,
  onClose,
}: {
  initial: Announcement;
  onSave: (a: Announcement) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState(initial);
  const u = <K extends keyof Announcement>(k: K, v: Announcement[K]) =>
    setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal
      title={initial.id ? "Edit Pengumuman" : "Pengumuman Baru"}
      onClose={onClose}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <FormField label="Judul">
          <Input
            value={f.title}
            maxLength={120}
            onChange={(e) => u("title", e.target.value)}
          />
        </FormField>
        <FormField label="Deskripsi">
          <Textarea
            rows={3}
            value={f.description}
            maxLength={400}
            onChange={(e) => u("description", e.target.value)}
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Tanggal">
            <Input
              type="date"
              value={f.date}
              onChange={(e) => u("date", e.target.value)}
            />
          </FormField>
          <FormField label="Waktu">
            <Input
              placeholder="08.00 – 14.00"
              value={f.time}
              onChange={(e) => u("time", e.target.value)}
            />
          </FormField>
          <FormField label="Lokasi">
            <Input value={f.place} onChange={(e) => u("place", e.target.value)} />
          </FormField>
        </div>
        <label className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <input
            type="checkbox"
            checked={f.urgent}
            onChange={(e) => u("urgent", e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">Tandai sebagai Pengumuman Penting</span>
            <span className="ml-1 text-muted-foreground">
              — akan tampil dengan aksen merah di beranda.
            </span>
          </span>
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm hover:bg-muted">
          Batal
        </button>
        <button
          onClick={() => onSave(f)}
          disabled={!f.title.trim() || !f.description.trim()}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50 transition-all active:scale-95"
        >
          Simpan
        </button>
      </div>
    </Modal>
  );
}
