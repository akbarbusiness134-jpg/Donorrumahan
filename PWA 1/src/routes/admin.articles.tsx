import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, X, Bold, Italic, List, ImageIcon, Link2, Heading2, Heading3, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, ImagePlus } from "lucide-react";
import { type Article } from "@/lib/admin-data";
import { useAdminStore } from "@/lib/admin-store";
import { compressImage, parseArticleBody } from "@/lib/utils";
import { toast } from "sonner";
import { FormField } from "@/components/admin/FormField";
import { Input, Select } from "@/components/admin/Input";
import { Modal } from "@/components/admin/Modal";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

export const Route = createFileRoute("/admin/articles")({
  component: ArticlesPage,
});

type EditState = Article & {
  imageUrl?: string;
};

const empty: EditState = {
  id: "",
  title: "",
  excerpt: "",
  body: "",
  tag: "Edukasi",
  image: "",
  publishedAt: new Date().toISOString().slice(0, 10),
  imagePosition: "center",
  imageCaption: "",
  isHtml: true,
};

function ArticlesPage() {
  const store = useAdminStore();
  const items = store.articles;
  const [editing, setEditing] = useState<EditState | null>(null);


  function save(a: EditState) {
    const { imageUrl, ...articleData } = a;
    const plainText = a.body
      .replace(/<[^>]*>/g, "")
      .replace(/[*#_\-`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    articleData.excerpt = plainText.slice(0, 1000) + (plainText.length > 1000 ? "..." : "");
    articleData.isHtml = true;

    if (a.id) {
      store.updateArticle(a.id, articleData);
      toast.success("Artikel berhasil diperbarui!", {
        description: "Perubahan telah disimpan",
        duration: 3000,
      });
    } else {
      store.addArticle({ ...articleData, id: `AR-${Date.now()}` });
      toast.success("Artikel baru berhasil ditambahkan!", {
        description: "Artikel telah dipublikasikan",
        duration: 3000,
      });
    }
    setEditing(null);
  }

  function remove(id: string) {
    if (!confirm("Hapus artikel ini?")) return;
    store.removeArticle(id);
    toast.success("Artikel berhasil dihapus!", {
      description: "Artikel telah dihapus dari sistem",
      duration: 3000,
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary">CMS</p>
          <h1 className="mt-2 font-display text-2xl text-ink md:text-4xl">Publikasi & Dokumentasi</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            5 artikel terbaru otomatis tampil di beranda.
          </p>
        </div>
        <button
          onClick={() => setEditing(empty)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-background hover:bg-primary md:w-auto"
        >
          <Plus className="h-4 w-4" /> Artikel Baru
        </button>
      </header>

      {/* Pengaturan Card */}
      <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <div className="h-5 w-1 bg-primary rounded-full" />
          <h3 className="font-display text-base font-semibold text-ink">Pengaturan Publikasi di Beranda</h3>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <FormField label="Label Tag (Kecil)">
            <Input
              value={store.cms.articles?.sectionTag || ""}
              onChange={(e) => store.updateCMSArticles({ sectionTag: e.target.value })}
              placeholder="Publikasi & Dokumentasi"
            />
          </FormField>
          <FormField label="Judul Section">
            <Input
              value={store.cms.articles?.sectionTitle || ""}
              onChange={(e) => store.updateCMSArticles({ sectionTitle: e.target.value })}
              placeholder="Edukasi & Informasi"
            />
          </FormField>
          <FormField label="Deskripsi / Sub-judul Section" className="sm:col-span-2 md:col-span-1">
            <Input
              value={store.cms.articles?.sectionSubtitle || ""}
              onChange={(e) => store.updateCMSArticles({ sectionSubtitle: e.target.value })}
              placeholder="Temukan informasi terbaru..."
            />
          </FormField>
        </div>
      </div>

      {/* Pengaturan Tag */}
      <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <div className="h-5 w-1 bg-primary rounded-full" />
          <h3 className="font-display text-base font-semibold text-ink">Manajemen Kategori / Tag Artikel</h3>
        </div>
        <TagManager store={store} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <ul className="divide-y divide-border">
          {items.map((a, i) => (
            <li
              key={a.id}
              className="flex flex-col gap-3 px-5 py-4 hover:bg-muted/30 md:flex-row md:items-start md:gap-4"
            >
              <span className="hidden font-display text-2xl text-muted-foreground md:mt-1 md:block">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs md:gap-3">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium uppercase tracking-wider text-primary">
                    {a.tag}
                  </span>
                  <span className="text-muted-foreground">{a.publishedAt}</span>
                  {i < 5 && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-700">
                      Tayang di beranda
                    </span>
                  )}
                </div>
                <h3 className="mt-1 font-medium text-foreground">{a.title}</h3>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{a.excerpt}</p>
              </div>
              <div className="flex gap-1.5 self-end md:self-start">
                <button
                  onClick={() =>
                    setEditing({
                      ...a,
                      imagePosition: a.imagePosition || "center",
                      imageCaption: a.imageCaption || "",
                    })
                  }
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(a.id)}
                  className="grid h-7 w-7 place-items-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {editing && <EditArticle initial={editing} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditArticle({
  initial,
  onSave,
  onClose,
}: {
  initial: EditState;
  onSave: (a: EditState) => void;
  onClose: () => void;
}) {
  const store = useAdminStore();
  const [f, setF] = useState(() => {
    const state = { ...initial };
    if (!state.isHtml && state.body) {
      state.body = parseArticleBody(state.body);
      state.isHtml = true;
    }
    return state;
  });
  const u = <K extends keyof EditState>(k: K, v: EditState[K]) => setF((p) => ({ ...p, [k]: v }));

  // Removed insertText and handleInlineImageUpload from here, they are inside RichTextEditor now

  return (
    <Modal
      title={initial.id ? "Edit Artikel" : "Artikel Baru"}
      onClose={onClose}
      fullScreen={true}
      maxWidth="5xl"
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1fr_200px_160px]">
          <FormField label="Judul">
            <Input
              value={f.title}
              maxLength={140}
              onChange={(e) => u("title", e.target.value)}
            />
          </FormField>
          <FormField label="Penulis">
            <Input
              value={f.author || ""}
              placeholder="Misal: Admin"
              onChange={(e) => u("author", e.target.value)}
            />
          </FormField>
          <FormField label="Tag">
            <Select value={f.tag} onChange={(e) => u("tag", e.target.value)}>
              {(store.cms.articles?.availableTags || ["Edukasi", "Kesehatan", "Cerita", "Mitos", "Panduan"]).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </FormField>
        </div>

        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-foreground/70 mb-1.5">
            Isi Artikel
          </label>
          <RichTextEditor value={f.body} onChange={(val) => u("body", val)} />
        </div>

      </div>
      
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm hover:bg-muted">
          Batal
        </button>
        <button
          onClick={() => onSave(f)}
          disabled={!f.title.trim() || !f.body.trim()}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50 transition-all active:scale-95"
        >
          Simpan
        </button>
      </div>
    </Modal>
  );
}

function TagManager({ store }: { store: ReturnType<typeof useAdminStore> }) {
  const availableTags = store.cms.articles?.availableTags || [];
  const [newTag, setNewTag] = useState("");

  const addTag = () => {
    const t = newTag.trim();
    if (!t || availableTags.includes(t)) return;
    store.updateCMSArticles({ availableTags: [...availableTags, t] });
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    store.updateCMSArticles({ availableTags: availableTags.filter((t) => t !== tag) });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 pl-3 pr-1.5 py-1 text-xs font-semibold text-primary border border-primary/20">
            {tag}
            <button onClick={() => removeTag(tag)} className="grid h-4 w-4 place-items-center rounded-full hover:bg-primary hover:text-white transition-colors">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {availableTags.length === 0 && (
          <span className="text-sm text-muted-foreground italic">Belum ada tag yang ditambahkan.</span>
        )}
      </div>
      <div className="flex max-w-sm items-center gap-2">
        <Input 
          value={newTag} 
          onChange={(e) => setNewTag(e.target.value)} 
          placeholder="Kategori baru..." 
          onKeyDown={(e) => e.key === "Enter" && addTag()}
        />
        <button onClick={addTag} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-ink px-3 text-sm font-medium text-background hover:bg-primary transition-colors">
          <Plus className="h-3.5 w-3.5" /> Tambah
        </button>
      </div>
    </div>
  );
}
