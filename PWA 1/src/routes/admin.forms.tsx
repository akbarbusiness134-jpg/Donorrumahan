import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Plus, Trash2, Edit2, MoveUp, MoveDown, Copy, ExternalLink, Link as LinkIcon, Database, X, HelpCircle, CheckCircle2 } from "lucide-react";
import { useAdminStore, type DynamicForm, type FormField as IFormField } from "@/lib/admin-store";
import { Modal } from "@/components/admin/Modal";
import { FormField as UIFormField } from "@/components/admin/FormField";
import { Input, Select, Textarea } from "@/components/admin/Input";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { uploadBase64ToSupabase } from "@/lib/supabase";
import { compressImage } from "@/lib/utils";

export const Route = createFileRoute("/admin/forms")({
  component: AdminFormsPage,
});

function AdminFormsPage() {
  const { cms, updateCMSForms } = useAdminStore();
  const forms = cms.forms || [];

  const [editingForm, setEditingForm] = useState<DynamicForm | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSaveForm = (form: DynamicForm) => {
    let newForms;
    if (isCreating) {
      if (forms.some((f) => f.id === form.id)) {
        toast.error("ID Form sudah digunakan", { description: "Gunakan ID/Slug lain." });
        return;
      }
      newForms = [...forms, form];
    } else {
      newForms = forms.map((f) => (f.id === form.id ? form : f));
    }
    updateCMSForms(newForms);
    toast.success("Form berhasil disimpan!");
    setEditingForm(null);
    setIsCreating(false);
  };

  const handleDeleteForm = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus form ini? Semua pengaturan kolom dan URL akan hilang.")) return;
    updateCMSForms(forms.filter((f) => f.id !== id));
    toast.success("Form berhasil dihapus!");
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingForm({
      id: "",
      title: "",
      description: "",
      googleScriptUrl: "",
      submitLabel: "Kirim",
      successMessage: "Terima kasih, data Anda telah berhasil dikirim!",
      fields: [],
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link berhasil disalin!");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Manajemen Formulir</p>
          <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">Pembuat Form (Form Builder)</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Buat form kustom untuk berbagai kegiatan dan hubungkan ke Google Sheets.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-background hover:bg-primary transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Buat Form Baru
        </button>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {forms.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-border bg-card p-12 text-center">
            <Database className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-display text-foreground">Belum Ada Form</h3>
            <p className="mt-1 text-sm text-muted-foreground mb-6">
              Mulai buat form pertama Anda untuk mendata relawan atau kegiatan lainnya.
            </p>
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> Buat Form Sekarang
            </button>
          </div>
        ) : (
          forms.map((form) => (
            <div key={form.id} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/40"></div>
              <div className="flex-1">
                <h3 className="font-display text-xl text-foreground mb-1">{form.title}</h3>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                  {form.description || "Tidak ada deskripsi"}
                </p>
                
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-foreground/80 bg-muted/50 p-2 rounded-md">
                    <span className="font-medium bg-background px-1.5 py-0.5 rounded border">ID/Slug</span>
                    <span className="font-mono text-[10px] truncate">{form.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/80 bg-muted/50 p-2 rounded-md">
                    <span className="font-medium bg-background px-1.5 py-0.5 rounded border">Kolom</span>
                    <span>{form.fields.length} item</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mt-2 pt-4 border-t border-border/50">
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingForm(form);
                      setIsCreating(false);
                    }}
                    title="Edit Form"
                    className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background text-foreground/70 hover:bg-muted transition-all active:scale-90"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/form/${form.id}`)}
                    title="Salin Link Publik"
                    className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background text-foreground/70 hover:bg-muted transition-all active:scale-90"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                  </button>
                  <Link
                    to="/form/$formId"
                    params={{ formId: form.id }}
                    target="_blank"
                    title="Buka Form"
                    className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background text-foreground/70 hover:bg-muted transition-all active:scale-90"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <button
                  onClick={() => handleDeleteForm(form.id)}
                  title="Hapus Form"
                  className="grid h-8 w-8 place-items-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all active:scale-90"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editingForm && (
        <FormEditor
          form={editingForm}
          isCreating={isCreating}
          onSave={handleSaveForm}
          onClose={() => {
            setEditingForm(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}

function FormEditor({
  form: initialForm,
  isCreating,
  onSave,
  onClose,
}: {
  form: DynamicForm;
  isCreating: boolean;
  onSave: (form: DynamicForm) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<DynamicForm>(initialForm);
  const [activeTab, setActiveTab] = useState<"general" | "fields">("general");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSheetTutorial, setShowSheetTutorial] = useState(false);

  const updateField = (index: number, data: Partial<FormField>) => {
    const newFields = [...form.fields];
    newFields[index] = { ...newFields[index], ...data };
    setForm({ ...form, fields: newFields });
  };

  const addField = () => {
    setForm((prevForm) => ({
      ...prevForm,
      fields: [
        ...prevForm.fields,
        {
          id: `kolom_${Date.now()}`,
          label: "Kolom Baru",
          type: "text",
          required: false,
        },
      ],
    }));
    
    // Scroll automatically
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const removeField = (index: number) => {
    if (!confirm("Hapus kolom ini?")) return;
    const fieldId = form.fields[index].id;
    setDeletingId(fieldId);
    
    setTimeout(() => {
      setForm((prev) => {
        const newFields = [...prev.fields];
        newFields.splice(index, 1);
        return { ...prev, fields: newFields };
      });
      setDeletingId(null);
    }, 300);
  };

  const moveField = (index: number, direction: 1 | -1) => {
    if (index + direction < 0 || index + direction >= form.fields.length) return;
    const newFields = [...form.fields];
    const temp = newFields[index];
    newFields[index] = newFields[index + direction];
    newFields[index + direction] = temp;
    setForm({ ...form, fields: newFields });
  };

  const handleSave = () => {
    if (!form.id || !form.title) {
      toast.error("ID dan Judul form wajib diisi");
      return;
    }
    // simple slug validation
    if (!/^[a-z0-9-]+$/.test(form.id)) {
      toast.error("ID Form hanya boleh berisi huruf kecil, angka, dan strip (-)");
      return;
    }
    
    // Clean up options before saving
    const cleanedForm = {
      ...form,
      fields: form.fields.map(field => {
        if (field.options) {
          return {
            ...field,
            options: field.options.map(opt => opt.trim()).filter(Boolean)
          };
        }
        return field;
      })
    };
    
    onSave(cleanedForm);
  };

  return (
    <Modal title={isCreating ? "Buat Form Baru" : "Edit Form"} onClose={onClose} maxWidth="max-w-3xl">
      <div className="flex border-b border-border mb-6">
        <button
          className={`pb-3 px-4 text-sm font-medium transition-colors ${
            activeTab === "general" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("general")}
        >
          Pengaturan Umum
        </button>
        <button
          className={`pb-3 px-4 text-sm font-medium transition-colors ${
            activeTab === "fields" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("fields")}
        >
          Konfigurasi Kolom ({form.fields.length})
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto px-1 pb-4">
        {activeTab === "general" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <UIFormField label="Judul Form" required>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Misal: Pendaftaran Relawan"
                />
              </UIFormField>
              <UIFormField label="ID / URL Slug" required>
                <Input
                  value={form.id}
                  disabled={!isCreating}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  placeholder="Misal: daftar-relawan"
                  className={!isCreating ? "bg-muted" : ""}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Digunakan untuk URL: /form/<strong>{form.id || "..."}</strong> (hanya huruf kecil & strip)
                </p>
              </UIFormField>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <UIFormField label="Deskripsi (Opsional)">
                <Textarea
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Penjelasan singkat tentang form ini..."
                  rows={2}
                />
              </UIFormField>
              <UIFormField label="Rata Teks Deskripsi">
                <Select
                  value={form.descriptionAlign || "center"}
                  onChange={(e) => setForm({ ...form, descriptionAlign: e.target.value as any })}
                >
                  <option value="center">Rata Tengah (Center)</option>
                  <option value="left">Rata Kiri (Left)</option>
                  <option value="justify">Rata Kiri Kanan (Justify)</option>
                </Select>
              </UIFormField>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <UIFormField label="Upload Gambar / Banner 1">
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        toast.loading("Mengunggah gambar...", { id: "upload-form-1" });
                        const base64 = await compressImage(file);
                        const finalUrl = await uploadBase64ToSupabase(base64, 'form_banner');
                        setForm({ ...form, imageUrl: finalUrl, imagePosition: form.imagePosition || "top", imageSize: form.imageSize || "full" });
                        toast.success("Gambar berhasil diunggah!", { id: "upload-form-1" });
                      } catch (err) {
                        toast.error("Gagal mengunggah gambar", { id: "upload-form-1" });
                      }
                    }}
                  />
                  {form.imageUrl && (
                    <div className="relative inline-block w-max">
                      <img src={form.imageUrl} alt="Banner 1" className="h-20 w-auto rounded object-cover border border-border shadow-sm" />
                      <button 
                        onClick={() => setForm({ ...form, imageUrl: undefined })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                        title="Hapus Gambar"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </UIFormField>
              <UIFormField label="Posisi Gambar 1">
                <Select
                  value={form.imagePosition || "top"}
                  onChange={(e) => setForm({ ...form, imagePosition: e.target.value as any })}
                  disabled={!form.imageUrl}
                >
                  <option value="top">Paling Atas (Di Atas Judul)</option>
                  <option value="below-title">Tepat Di Bawah Judul</option>
                  <option value="below-desc">Di Bawah Deskripsi / Sebelum Form</option>
                  <option value="bottom">Paling Bawah (Setelah Form)</option>
                </Select>
              </UIFormField>
              <UIFormField label="Ukuran Gambar 1">
                <Select
                  value={form.imageSize || "full"}
                  onChange={(e) => setForm({ ...form, imageSize: e.target.value as any })}
                  disabled={!form.imageUrl}
                >
                  <option value="small">Kecil</option>
                  <option value="medium">Sedang</option>
                  <option value="large">Besar</option>
                  <option value="full">Penuh (Full Width)</option>
                </Select>
              </UIFormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <UIFormField label="Upload Gambar / Banner 2">
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        toast.loading("Mengunggah gambar...", { id: "upload-form-2" });
                        const base64 = await compressImage(file);
                        const finalUrl = await uploadBase64ToSupabase(base64, 'form_banner');
                        setForm({ ...form, imageUrl2: finalUrl, imagePosition2: form.imagePosition2 || "bottom", imageSize2: form.imageSize2 || "full" });
                        toast.success("Gambar berhasil diunggah!", { id: "upload-form-2" });
                      } catch (err) {
                        toast.error("Gagal mengunggah gambar", { id: "upload-form-2" });
                      }
                    }}
                  />
                  {form.imageUrl2 && (
                    <div className="relative inline-block w-max">
                      <img src={form.imageUrl2} alt="Banner 2" className="h-20 w-auto rounded object-cover border border-border shadow-sm" />
                      <button 
                        onClick={() => setForm({ ...form, imageUrl2: undefined })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                        title="Hapus Gambar"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </UIFormField>
              <UIFormField label="Posisi Gambar 2">
                <Select
                  value={form.imagePosition2 || "bottom"}
                  onChange={(e) => setForm({ ...form, imagePosition2: e.target.value as any })}
                  disabled={!form.imageUrl2}
                >
                  <option value="top">Paling Atas (Di Atas Judul)</option>
                  <option value="below-title">Tepat Di Bawah Judul</option>
                  <option value="below-desc">Di Bawah Deskripsi / Sebelum Form</option>
                  <option value="bottom">Paling Bawah (Setelah Form)</option>
                </Select>
              </UIFormField>
              <UIFormField label="Ukuran Gambar 2">
                <Select
                  value={form.imageSize2 || "full"}
                  onChange={(e) => setForm({ ...form, imageSize2: e.target.value as any })}
                  disabled={!form.imageUrl2}
                >
                  <option value="small">Kecil</option>
                  <option value="medium">Sedang</option>
                  <option value="large">Besar</option>
                  <option value="full">Penuh (Full Width)</option>
                </Select>
              </UIFormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <UIFormField label="Upload Gambar / Banner 3">
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        toast.loading("Mengunggah gambar...", { id: "upload-form-3" });
                        const base64 = await compressImage(file);
                        const finalUrl = await uploadBase64ToSupabase(base64, 'form_banner');
                        setForm({ ...form, imageUrl3: finalUrl, imagePosition3: form.imagePosition3 || "bottom", imageSize3: form.imageSize3 || "full" });
                        toast.success("Gambar berhasil diunggah!", { id: "upload-form-3" });
                      } catch (err) {
                        toast.error("Gagal mengunggah gambar", { id: "upload-form-3" });
                      }
                    }}
                  />
                  {form.imageUrl3 && (
                    <div className="relative inline-block w-max">
                      <img src={form.imageUrl3} alt="Banner 3" className="h-20 w-auto rounded object-cover border border-border shadow-sm" />
                      <button 
                        onClick={() => setForm({ ...form, imageUrl3: undefined })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                        title="Hapus Gambar"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </UIFormField>
              <UIFormField label="Posisi Gambar 3">
                <Select
                  value={form.imagePosition3 || "bottom"}
                  onChange={(e) => setForm({ ...form, imagePosition3: e.target.value as any })}
                  disabled={!form.imageUrl3}
                >
                  <option value="top">Paling Atas (Di Atas Judul)</option>
                  <option value="below-title">Tepat Di Bawah Judul</option>
                  <option value="below-desc">Di Bawah Deskripsi / Sebelum Form</option>
                  <option value="bottom">Paling Bawah (Setelah Form)</option>
                </Select>
              </UIFormField>
              <UIFormField label="Ukuran Gambar 3">
                <Select
                  value={form.imageSize3 || "full"}
                  onChange={(e) => setForm({ ...form, imageSize3: e.target.value as any })}
                  disabled={!form.imageUrl3}
                >
                  <option value="small">Kecil</option>
                  <option value="medium">Sedang</option>
                  <option value="large">Besar</option>
                  <option value="full">Penuh (Full Width)</option>
                </Select>
              </UIFormField>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <UIFormField label="URL Google Apps Script" required />
                <button
                  type="button"
                  onClick={() => setShowSheetTutorial(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-full transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Cara Menghubungkan
                </button>
              </div>
              <div className="mt-[-1rem]">
                <Input
                  value={form.googleScriptUrl || ""}
                  onChange={(e) => setForm({ ...form, googleScriptUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                URL tujuan (Webhook) untuk menerima data yang diisi dari formulir ini.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <UIFormField label="Teks Tombol Submit" required>
                <Input
                  value={form.submitLabel || ""}
                  onChange={(e) => setForm({ ...form, submitLabel: e.target.value })}
                  placeholder="Kirim / Submit / Daftar Sekarang"
                />
              </UIFormField>
              <UIFormField label="Pesan Sukses (Berhasil Dikirim)" required>
                <Textarea
                  value={form.successMessage || ""}
                  onChange={(e) => setForm({ ...form, successMessage: e.target.value })}
                  placeholder="Terima kasih, data Anda telah kami terima."
                  rows={2}
                />
              </UIFormField>
              <UIFormField label="Gambar Pesan Sukses (Opsional)">
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        toast.loading("Mengunggah gambar sukses...", { id: "upload-form-success" });
                        const base64 = await compressImage(file);
                        const finalUrl = await uploadBase64ToSupabase(base64, 'form_success');
                        setForm({ ...form, successImageUrl: finalUrl });
                        toast.success("Gambar sukses berhasil diunggah!", { id: "upload-form-success" });
                      } catch (err) {
                        toast.error("Gagal mengunggah gambar", { id: "upload-form-success" });
                      }
                    }}
                  />
                  {form.successImageUrl && (
                    <div className="relative inline-block w-max">
                      <img src={form.successImageUrl} alt="Success Graphic" className="h-20 w-auto rounded object-cover border border-border shadow-sm" />
                      <button 
                        onClick={() => setForm({ ...form, successImageUrl: undefined })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                        title="Hapus Gambar"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </UIFormField>
            </div>
          </div>
        )}

        {activeTab === "fields" && (
          <div className="space-y-6">
            <div className="sticky top-0 z-10 flex justify-between items-center bg-background/95 backdrop-blur-sm p-3 -mx-1 px-4 mb-4 rounded-b-xl border-b border-border/50 shadow-sm">
              <span className="text-sm text-foreground/80 font-medium">Susunan Kolom Pertanyaan</span>
              <button
                onClick={addField}
                className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 shadow-sm transition-all active:scale-[0.95]"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Kolom
              </button>
            </div>

            {form.fields.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-xl">
                Belum ada kolom pertanyaan. Klik "Tambah Kolom" untuk memulai.
              </div>
            ) : (
              <div className="space-y-4">
                {form.fields.map((field, idx) => (
                  <div 
                    key={field.id} 
                    className={`flex gap-4 rounded-xl border bg-card p-4 shadow-sm relative group transition-all duration-300 origin-top overflow-visible ${
                      deletingId === field.id ? "opacity-0 scale-95 h-0 py-0 border-transparent mb-0 overflow-hidden" : "opacity-100 scale-100 border-border mb-4"
                    }`}
                  >
                    <div className="flex flex-col gap-1 items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveField(idx, -1)} disabled={idx === 0} className="p-1 hover:bg-muted rounded disabled:opacity-20 transition-transform active:scale-90">
                        <MoveUp className="h-4 w-4" />
                      </button>
                      <button onClick={() => moveField(idx, 1)} disabled={idx === form.fields.length - 1} className="p-1 hover:bg-muted rounded disabled:opacity-20 transition-transform active:scale-90">
                        <MoveDown className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                        <div className="sm:col-span-5">
                          <UIFormField label="Label Kolom">
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(idx, { label: e.target.value })}
                              placeholder="Misal: Nama Lengkap"
                            />
                          </UIFormField>
                        </div>
                        <div className="sm:col-span-4">
                          <UIFormField label="Jenis Input">
                            <Select
                              value={field.type}
                              onChange={(e) => updateField(idx, { type: e.target.value as FormFieldType })}
                            >
                              <option value="text">Teks Pendek</option>
                              <option value="textarea">Paragraf (Teks Panjang)</option>
                              <option value="email">Email</option>
                              <option value="date">Tanggal</option>
                              <option value="select">Dropdown (Pilih Satu)</option>
                              <option value="radio">Radio (Pilih Satu)</option>
                              <option value="checkbox">Checkbox (Centang Banyak)</option>
                            </Select>
                          </UIFormField>
                        </div>
                        <div className="sm:col-span-3">
                          <UIFormField label="ID Parameter">
                            <Input
                              value={field.id}
                              onChange={(e) => updateField(idx, { id: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                              placeholder="nama_lengkap"
                              className="font-mono text-xs"
                            />
                          </UIFormField>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 pt-2 border-t border-border/30">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(idx, { required: e.target.checked })}
                            className="rounded border-input text-primary focus:ring-primary"
                          />
                          <span className="text-xs font-medium text-foreground">Wajib Diisi</span>
                        </label>

                        {["select", "radio", "checkbox"].includes(field.type) && (
                          <div className="flex-1">
                            <UIFormField label="Opsi Pilihan (Pisahkan dengan koma)">
                              <Input
                                value={field.options?.join(",") || ""}
                                onChange={(e) => updateField(idx, { options: e.target.value.split(",") })}
                                placeholder="Pilihan A, Pilihan B, Pilihan C"
                                className="text-xs"
                              />
                            </UIFormField>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeField(idx)}
                      className="absolute top-4 right-4 text-muted-foreground hover:text-red-600 p-1 opacity-50 group-hover:opacity-100 transition-all active:scale-90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {/* Element untuk autoscroll */}
                <div ref={bottomRef} className="h-4"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TUTORIAL SPREADSHEET MODAL */}
      {showSheetTutorial && (
        <Modal
          onClose={() => setShowSheetTutorial(false)}
          title="Cara Menghubungkan ke Google Spreadsheet"
        >
          <div className="space-y-6 text-sm text-foreground">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
            <p><strong>Penting:</strong> Proses ini hanya perlu dilakukan 1 kali. Nantinya formulir akan otomatis mengirim data ke Spreadsheet Anda.</p>
          </div>

          <div className="space-y-6">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">1</span>
              Buat Spreadsheet Baru
            </h3>
            <div className="pl-8 text-muted-foreground">
              <ul className="list-disc ml-4 space-y-1">
                <li>Buka <a href="https://docs.google.com/spreadsheets" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google Sheets</a> dan buat spreadsheet kosong (Blank).</li>
                <li>Beri nama spreadsheet Anda di pojok kiri atas (misalnya: "Data Pendaftaran Relawan").</li>
              </ul>
            </div>

            <h3 className="font-semibold text-base flex items-center gap-2">
              <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">2</span>
              Buka Google Apps Script
            </h3>
            <div className="pl-8 text-muted-foreground">
              <ul className="list-disc ml-4 space-y-1">
                <li>Di menu atas Spreadsheet, klik <strong>Ekstensi (Extensions)</strong> &gt; pilih <strong>Apps Script</strong>.</li>
                <li>Tab baru akan terbuka. Beri nama proyek script Anda di pojok kiri atas (misalnya: "Script Form").</li>
              </ul>
            </div>

            <h3 className="font-semibold text-base flex items-center gap-2">
              <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">3</span>
              Salin & Tempel Kode Berikut
            </h3>
            <div className="pl-8 text-muted-foreground">
              <p className="mb-2">Hapus semua kode awal yang ada (<code>function myFunction() ...</code>), lalu tempelkan kode di bawah ini:</p>
              <div className="relative mb-2">
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto text-xs leading-relaxed">
{`function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
    
    if (headers.join("") === "") {
      headers = ["Waktu Pengisian"];
      for (var key in e.parameter) { headers.push(key); }
      sheet.appendRow(headers);
    }
    
    var rowData = [];
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      if (header === "Waktu Pengisian") {
        rowData.push(new Date());
      } else {
        rowData.push(e.parameter[header] || ""); 
      }
    }
    
    sheet.appendRow(rowData);
    return ContentService.createTextOutput(JSON.stringify({"result":"success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "error": error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
    
    if (headers.join("") === "") {
      headers = ["Waktu Pengisian"];
      for (var key in e.parameter) { headers.push(key); }
      sheet.appendRow(headers);
    }
    
    var rowData = [];
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      if (header === "Waktu Pengisian") {
        rowData.push(new Date());
      } else {
        rowData.push(e.parameter[header] || ""); 
      }
    }
    
    sheet.appendRow(rowData);
    return ContentService.createTextOutput(JSON.stringify({"result":"success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "error": error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`);
                    toast.success("Kode berhasil disalin!");
                  }}
                  className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                  title="Salin Kode"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p>Klik ikon <strong>Simpan (Disket)</strong> di baris menu atas.</p>
            </div>

            <h3 className="font-semibold text-base flex items-center gap-2">
              <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">4</span>
              Terapkan (Deploy) Script Anda
            </h3>
            <div className="pl-8 text-muted-foreground">
              <ul className="list-disc ml-4 space-y-2">
                <li>Klik tombol biru <strong>Terapkan (Deploy)</strong> di pojok kanan atas &gt; Pilih <strong>Deployment Baru</strong>.</li>
                <li>Klik <strong>ikon roda gigi (⚙️)</strong> di sebelah tulisan "Pilih jenis" &gt; Centang <strong>Aplikasi Web (Web app)</strong>.</li>
                <li>Pada bagian "Jalankan sebagai" (Execute as): Pilih <strong>Saya (Me)</strong>.</li>
                <li><strong className="text-red-600">Sangat Penting:</strong> Pada bagian "Siapa yang memiliki akses" (Who has access), <strong>WAJIB ubah menjadi "Siapa saja" (Anyone)</strong>. Jika tidak, data gagal dikirim.</li>
                <li>Klik tombol <strong>Terapkan</strong> di pojok kanan bawah.</li>
              </ul>
            </div>

            <h3 className="font-semibold text-base flex items-center gap-2">
              <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">5</span>
              Memberi Izin Akses (Hanya Pertama Kali)
            </h3>
            <div className="pl-8 text-muted-foreground">
              <ul className="list-disc ml-4 space-y-2">
                <li>Google akan meminta konfirmasi. Klik tombol <strong>Beri Akses (Authorize access)</strong> dan pilih akun Google Anda.</li>
                <li>Jika muncul peringatan <em>"Google belum memverifikasi aplikasi ini"</em>, klik teks kecil <strong>Lanjutan (Advanced)</strong> di kiri bawah.</li>
                <li>Klik <strong>Buka "Nama Proyek" (tidak aman)</strong> yang ada di bagian bawah peringatan.</li>
                <li>Terakhir, scroll ke bawah dan klik tombol <strong>Izinkan (Allow)</strong>.</li>
              </ul>
            </div>

            <h3 className="font-semibold text-base flex items-center gap-2">
              <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">6</span>
              Salin URL Aplikasi Web Anda
            </h3>
            <div className="pl-8 text-muted-foreground">
              <ul className="list-disc ml-4 space-y-2">
                <li>Setelah berhasil, akan muncul layar berisi link di bawah tulisan <strong>URL Aplikasi Web (Web app URL)</strong>.</li>
                <li>Salin (Copy) seluruh link panjang tersebut (dimulai dengan <code>https://script.google.com/...</code>).</li>
                <li>Tutup tab tersebut, kembali ke halaman ini, lalu <strong>Tempel (Paste) link tersebut</strong> ke dalam kolom "URL Google Apps Script" di bawah.</li>
              </ul>
            </div>
          </div>
        </div>
      </Modal>
      )}

      <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all active:scale-[0.98]"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          className="rounded-lg bg-ink px-6 py-2.5 text-sm font-semibold text-background hover:bg-primary shadow-sm transition-all active:scale-[0.98]"
        >
          Simpan Form
        </button>
      </div>
    </Modal>
  );
}
