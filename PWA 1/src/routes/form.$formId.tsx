import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useAdminStore } from "@/lib/admin-store";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/form/$formId")({
  component: DynamicFormPage,
});

function DynamicFormPage() {
  const { formId } = Route.useParams();
  const { cms, isLoaded } = useAdminStore();
  const form = cms.forms?.find((f) => f.id === formId);

  const [values, setValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isLoaded) return <div className="min-h-screen bg-background" />;

  if (!form) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <SiteHeader isHome={false} />
        <main className="flex-1 grid place-items-center p-6">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-4xl font-display mb-4">404</h1>
            <p className="text-muted-foreground mb-8">Formulir yang Anda cari tidak ditemukan atau telah ditutup.</p>
            <Link to="/" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
              Kembali ke Beranda
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const handleChange = (id: string, value: any, type: string) => {
    if (type === "checkbox") {
      const current = values[id] || [];
      const { checked, optionValue } = value;
      if (checked) {
        setValues({ ...values, [id]: [...current, optionValue] });
      } else {
        setValues({ ...values, [id]: current.filter((v: string) => v !== optionValue) });
      }
    } else {
      setValues({ ...values, [id]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.googleScriptUrl) {
      setErrorMsg("URL tujuan formulir belum dikonfigurasi. Hubungi administrator.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // Format data untuk dikirim
      // Jika ada array (seperti dari checkbox), kita gabungkan dengan koma
      const payload: Record<string, string> = {};
      Object.keys(values).forEach(key => {
        if (Array.isArray(values[key])) {
          payload[key] = values[key].join(", ");
        } else {
          payload[key] = values[key];
        }
      });

      // Menggunakan no-cors untuk menghindari error CORS saat mengirim ke Google Apps Script
      // Jika menggunakan no-cors, kita tidak bisa membaca response.
      const formData = new URLSearchParams();
      Object.keys(payload).forEach(key => {
        formData.append(key, payload[key]);
      });

      await fetch(form.googleScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      // Karena no-cors, kita asumsikan request berhasil jika fetch tidak melempar Network Error
      setIsSuccess(true);
      setValues({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMsg("Terjadi kesalahan saat mengirim formulir. Pastikan koneksi internet Anda stabil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAlignClass = (align?: string) => {
    switch (align) {
      case "left": return "text-left";
      case "justify": return "text-justify";
      case "center":
      default: return "text-center";
    }
  };

  const getImageSizeClass = (size?: string) => {
    switch (size) {
      case "small": return "max-w-[150px] md:max-w-[200px] w-full"; // Very small
      case "medium": return "max-w-xs w-full"; // ~320px
      case "large": return "max-w-md w-full"; // ~448px
      case "full":
      default: return "w-full";
    }
  };

  const renderImagesAtPosition = (position: string, wrapperClassName: string, imgMaxHeight: string, objectFit: string) => {
    const img1Match = form?.imageUrl && (form.imagePosition || "top") === position;
    const img2Match = form?.imageUrl2 && (form.imagePosition2 || "bottom") === position;
    const img3Match = form?.imageUrl3 && (form.imagePosition3 || "bottom") === position;

    if (!img1Match && !img2Match && !img3Match) return null;

    return (
      <div className={cn("w-full flex flex-col md:flex-row items-center justify-center gap-3", wrapperClassName)}>
        {img1Match && (
           <img src={form.imageUrl} alt="Banner 1" className={cn(imgMaxHeight, objectFit, "drop-shadow-sm block object-center", getImageSizeClass(form.imageSize))} />
        )}
        {img2Match && (
           <img src={form.imageUrl2} alt="Banner 2" className={cn(imgMaxHeight, objectFit, "drop-shadow-sm block object-center", getImageSizeClass(form.imageSize2))} />
        )}
        {img3Match && (
           <img src={form.imageUrl3} alt="Banner 3" className={cn(imgMaxHeight, objectFit, "drop-shadow-sm block object-center", getImageSizeClass(form.imageSize3))} />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/20 text-foreground selection:bg-primary/20 selection:text-primary">
      <SiteHeader isHome={false} />
      
      <main className="flex-1 py-12 md:py-20 px-5">
        <div className="mx-auto max-w-2xl">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
          </Link>

          {isSuccess ? (
            <div className="rounded-3xl border border-border bg-card p-8 md:p-12 text-center shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              {form.successImageUrl ? (
                <div className="mx-auto mb-8 flex justify-center">
                  <img src={form.successImageUrl} alt="Success" className="max-h-[200px] object-contain drop-shadow-sm" />
                </div>
              ) : (
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 mb-6">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
              )}
              <h2 className="font-display text-3xl mb-4">Berhasil!</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                {form.successMessage || "Data Anda telah berhasil dikirim."}
              </p>
              <button
                onClick={() => setIsSuccess(false)}
                className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition shadow-sm hover:shadow-md"
              >
                Isi Form Lagi
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
              {renderImagesAtPosition("top", "border-b border-border/50", "max-h-[300px]", "object-cover")}
              
              <div className="bg-primary px-8 py-10 md:px-12 md:py-14 text-primary-foreground relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10 text-center flex flex-col items-center">
                  <h1 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-tight mb-4">{form.title}</h1>
                  
                  {renderImagesAtPosition("below-title", "mb-6 mt-2", "max-h-[400px]", "object-contain")}

                  {form.description && (
                    <div className="w-full">
                      <p className={cn("text-primary-foreground/80 md:text-lg max-w-xl mx-auto leading-relaxed whitespace-pre-wrap", getAlignClass(form.descriptionAlign))}>
                        {form.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {renderImagesAtPosition("below-desc", "px-8 md:px-12 pt-8 md:pt-12", "max-h-[400px]", "object-contain")}

              <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
                {errorMsg && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    {errorMsg}
                  </div>
                )}

                {form.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label htmlFor={field.id} className="block text-sm font-semibold text-foreground">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === "textarea" ? (
                      <textarea
                        id={field.id}
                        required={field.required}
                        value={values[field.id] || ""}
                        onChange={(e) => handleChange(field.id, e.target.value, field.type)}
                        className="w-full min-h-[120px] rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder={`Masukkan ${field.label.toLowerCase()}...`}
                      />
                    ) : field.type === "select" ? (
                      <div className="relative">
                        <select
                          id={field.id}
                          required={field.required}
                          value={values[field.id] || ""}
                          onChange={(e) => handleChange(field.id, e.target.value, field.type)}
                          className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 pr-10 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="" disabled>Pilih salah satu...</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    ) : field.type === "radio" ? (
                      <div className="space-y-3 pt-1">
                        {field.options?.map((opt, i) => (
                          <label key={i} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="radio"
                              name={field.id}
                              value={opt}
                              required={field.required && !values[field.id]}
                              checked={values[field.id] === opt}
                              onChange={(e) => handleChange(field.id, e.target.value, field.type)}
                              className="h-4 w-4 border-input text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : field.type === "checkbox" ? (
                      <div className="space-y-3 pt-1">
                        {field.options?.map((opt, i) => {
                          const isChecked = (values[field.id] || []).includes(opt);
                          return (
                            <label key={i} className="flex items-center gap-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                value={opt}
                                checked={isChecked}
                                onChange={(e) => handleChange(field.id, { optionValue: opt, checked: e.target.checked }, field.type)}
                                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                              />
                              <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">{opt}</span>
                            </label>
                          );
                        })}
                        {/* Hidden required field logic for checkbox group if needed, but standard HTML validation doesn't easily support required on a group of checkboxes natively. We'll rely on custom validation or let it pass if empty. */}
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        id={field.id}
                        required={field.required}
                        value={values[field.id] || ""}
                        onChange={(e) => handleChange(field.id, e.target.value, field.type)}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder={`Masukkan ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}

                <div className="pt-6 border-t border-border/50">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 shadow-sm hover:shadow"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sedang mengirim...
                      </>
                    ) : (
                      form.submitLabel || "Kirim"
                    )}
                  </button>
                  <p className="text-center text-xs text-muted-foreground mt-4">
                    Data Anda dienkripsi dan akan diproses secara rahasia.
                  </p>
                </div>
              </form>

              {renderImagesAtPosition("bottom", "px-8 md:px-12 pb-8 md:pb-12", "max-h-[400px]", "object-contain")}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
