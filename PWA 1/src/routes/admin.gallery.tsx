import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Image as ImageIcon, Trash2, Plus, Pencil, X } from "lucide-react";
import { useAdminStore, type GalleryItem } from "@/lib/admin-store";
import { compressImage } from "@/lib/utils";
import { uploadBase64ToSupabase } from "@/lib/supabase";
import { toast } from "sonner";
import { FormField } from "@/components/admin/FormField";
import { Input } from "@/components/admin/Input";

export const Route = createFileRoute("/admin/gallery")({
  component: GalleryPage,
});

function GalleryPage() {
  const store = useAdminStore();
  const { gallery, addGalleryItem, updateGalleryItem, removeGalleryItem } = store;
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState({ src: "", caption: "" });
  const [uploading, setUploading] = useState(false);

  function startEdit(item: GalleryItem) {
    setEditing(item);
    setForm({ src: item.src, caption: item.caption });
  }

  function cancelEdit() {
    setEditing(null);
    setForm({ src: "", caption: "" });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto terlalu besar. Maksimal 5MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      toast.loading("Mengompres dan mengunggah ke Supabase...", { id: "upload-toast" });
      const compressed = await compressImage(file, 1200, 900);
      const finalUrl = await uploadBase64ToSupabase(compressed, 'gallery');
      
      setForm((prev) => ({ ...prev, src: finalUrl }));
      toast.success("Foto berhasil diunggah!", { id: "upload-toast" });
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunggah foto", {
        description: "Silakan coba lagi dengan file yang berbeda",
        duration: 4000,
      });
    } finally {
      setUploading(false);
    }
  }

  function save() {
    if (!form.src || !form.caption.trim()) {
      toast.error("Data tidak lengkap", {
        description: "Foto dan caption harus diisi",
        duration: 3000,
      });
      return;
    }

    if (editing) {
      updateGalleryItem(editing.id, { src: form.src, caption: form.caption.trim() });
      toast.success("Foto galeri berhasil diperbarui!", {
        description: "Perubahan telah disimpan",
        duration: 3000,
      });
    } else {
      addGalleryItem({
        id: `GAL-${Date.now()}`,
        src: form.src,
        caption: form.caption.trim(),
      });
      toast.success("Foto baru berhasil ditambahkan ke galeri!", {
        description: "Foto telah dipublikasikan",
        duration: 3000,
      });
    }

    cancelEdit();
  }

  function remove(id: string) {
    if (!confirm("Hapus foto ini dari galeri?")) return;
    removeGalleryItem(id);
    toast.success("Foto berhasil dihapus!", {
      description: "Foto telah dihapus dari galeri",
      duration: 3000,
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">CMS</p>
        <h1 className="mt-2 font-display text-2xl text-ink md:text-4xl">Galeri</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Unggah dan kelola foto-foto kegiatan donor darah.
        </p>
      </header>

      {/* Pengaturan Card */}
      <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <div className="h-5 w-1 bg-primary rounded-full" />
          <h3 className="font-display text-base font-semibold text-ink">Unggah dan kelola foto kegiatan</h3>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <FormField label="Label Tag (Kecil)">
            <Input
              value={store.cms.gallery?.sectionTag || ""}
              onChange={(e) => store.updateCMSGallery({ sectionTag: e.target.value })}
              placeholder="Galeri"
            />
          </FormField>
          <FormField label="Judul Section">
            <Input
              value={store.cms.gallery?.sectionTitle || ""}
              onChange={(e) => store.updateCMSGallery({ sectionTitle: e.target.value })}
              placeholder="Momen Kegiatan & Aksi Sosial"
            />
          </FormField>
          <FormField label="Deskripsi / Sub-judul Section" className="sm:col-span-2 md:col-span-1">
            <Input
              value={store.cms.gallery?.sectionSubtitle || ""}
              onChange={(e) => store.updateCMSGallery({ sectionSubtitle: e.target.value })}
              placeholder="Dokumentasi nyata dedikasi..."
            />
          </FormField>
        </div>
      </div>

      {/* Form Add/Edit */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">
        <h2 className="mb-6 font-display text-2xl text-ink">
          {editing ? "Edit Foto" : "Tambah Foto Baru"}
        </h2>

        <div className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">Upload Foto</label>
            {form.src ? (
              <div className="relative">
                <img
                  src={form.src}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-xl border border-border"
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, src: "" }))}
                  className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-red-600 text-white hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 transition hover:bg-muted/60">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {uploading ? "Mengunggah..." : "Klik untuk upload foto"}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Caption / Keterangan
            </label>
            <input
              type="text"
              placeholder="Contoh: Donor pertama, harapan pertama 💉 Jakarta, 2025"
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={form.caption}
              onChange={(e) => setForm((prev) => ({ ...prev, caption: e.target.value }))}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={!form.src || !form.caption.trim() || uploading}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {editing ? "Perbarui Foto" : "Tambah ke Galeri"}
            </button>
            {editing && (
              <button
                onClick={cancelEdit}
                className="rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-medium transition hover:bg-muted"
              >
                Batal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div>
        <h2 className="mb-4 font-display text-2xl text-ink">Foto di Galeri ({gallery.length})</h2>
        {gallery.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Belum ada foto. Tambahkan foto pertama Anda!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={item.src}
                    alt={item.caption}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-foreground/80">{item.caption}</p>
                </div>
                {/* Buttons always visible on mobile/tablet, hover on desktop */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(item)}
                    aria-label="Edit foto"
                    className="grid h-9 w-9 place-items-center rounded-full bg-ink/90 text-background hover:bg-ink shadow-lg"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    aria-label="Hapus foto"
                    className="grid h-9 w-9 place-items-center rounded-full bg-red-600/90 text-white hover:bg-red-600 shadow-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
