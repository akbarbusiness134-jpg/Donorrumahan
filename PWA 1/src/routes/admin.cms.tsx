import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Instagram,
  Facebook,
  Phone,
  Mail,
  Bold,
  Italic,
  List,
  Link2,
  Twitter,
  MessageCircle,
  Music,
  Youtube,
  MessageSquare,
  Pencil,
} from "lucide-react";
import { useAdminStore, type NavItem } from "@/lib/admin-store";
import { compressImage, compressImageWithTransparency } from "@/lib/utils";
import { uploadBase64ToSupabase } from "@/lib/supabase";
import { FormField } from "@/components/admin/FormField";
import { Input, Textarea } from "@/components/admin/Input";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Modal } from "@/components/admin/Modal";

export const Route = createFileRoute("/admin/cms")({
  component: CMSPage,
});

function CMSPage() {
  const [tab, setTab] = useState<"header" | "hero" | "footer">("header");
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary">CMS Beranda</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Header · Hero · Footer</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ubah identitas, panel hero, KSR PMI UNHAS, dan informasi kontak tanpa menyentuh kode.
        </p>
      </header>

      <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
        {[
          { id: "header", label: "Header & Identitas" },
          { id: "hero", label: "Hero & Profil" },
          { id: "footer", label: "Footer & Kontak" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={[
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition",
              tab === t.id ? "bg-ink text-background" : "text-foreground/70 hover:bg-muted",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "header" && <HeaderEditor />}
      {tab === "hero" && <HeroEditor />}
      {tab === "footer" && <FooterEditor />}
    </div>
  );
}

function HeaderEditor() {
  const { cms, updateCMSHeader } = useAdminStore();
  const [orgName, setOrgName] = useState(cms.header.orgName);
  const [tagline, setTagline] = useState(cms.header.tagline);
  const [nav, setNav] = useState<NavItem[]>(cms.header.nav);
  const [logo, setLogo] = useState(cms.header.logo || "");

  function handleSave() {
    updateCMSHeader({ orgName, tagline, nav, logo });
  }

  function handleCancel() {
    setOrgName(cms.header.orgName);
    setTagline(cms.header.tagline);
    setNav(cms.header.nav);
    setLogo(cms.header.logo || "");
  }

  return (
    <Section title="Header & Identitas Website">
      <div className="space-y-6">
        {/* Identitas Website Card */}
        <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <div className="h-5 w-1 bg-primary rounded-full" />
            <h3 className="font-display text-base font-semibold text-ink">Identitas Utama</h3>
          </div>
          
          <div className="grid gap-5 md:grid-cols-[160px_1fr] items-center">
            <div className="flex flex-col items-center md:items-start">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Logo Website</label>
              <div className="mt-2 grid h-32 w-32 place-items-center rounded-xl border border-dashed border-border bg-background overflow-hidden relative shadow-inner">
                {logo ? (
                  <img
                    src={logo}
                    alt="Logo preview"
                    className="absolute inset-0 h-full w-full object-contain p-2"
                  />
                ) : (
                  <ImageIcon className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <input
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("Ukuran foto terlalu besar. Maksimal 5MB.");
                      return;
                    }
                    try {
                      toast.loading("Mengunggah logo...", { id: "upload-logo" });
                      const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
                      if (isPng) {
                        const compressed = await compressImageWithTransparency(file, 200, 200);
                        const finalUrl = await uploadBase64ToSupabase(compressed, 'logo');
                        setLogo(finalUrl);
                        toast.success("Logo berhasil diunggah!", { id: "upload-logo" });
                      } else {
                        const compressed = await compressImage(file, 200, 200);
                        const finalUrl = await uploadBase64ToSupabase(compressed, 'logo');
                        setLogo(finalUrl);
                        toast.success("Logo berhasil diunggah!", { id: "upload-logo" });
                      }
                    } catch (err) {
                      toast.error("Gagal mengunggah logo", { id: "upload-logo" });
                    }
                  }
                }}
              />
              <div className="mt-3 w-32 space-y-1.5">
                <button
                  type="button"
                  onClick={() => document.getElementById("logo-upload")?.click()}
                  className="w-full rounded-md border border-border bg-card py-1.5 text-xs hover:bg-muted font-medium transition cursor-pointer text-center"
                >
                  {logo ? "Ganti Logo" : "Unggah Logo"}
                </button>
                {logo && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Hapus logo organisasi?")) setLogo("");
                    }}
                    className="w-full rounded-md border border-red-200 bg-red-50 py-1 text-xs text-red-600 hover:bg-red-100 font-medium transition cursor-pointer text-center"
                  >
                    Hapus Logo
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-4 w-full">
              <FormField label="Nama Organisasi">
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </FormField>
              <FormField label="Tagline / Sub-judul">
                <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
              </FormField>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Format: PNG (transparan), JPG, WebP, SVG. Rekomendasi ukuran: 200x200px.
          </p>
        </div>

        {/* Menu Navigasi Card */}
        <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 bg-primary rounded-full" />
              <h3 className="font-display text-base font-semibold text-ink">Menu Navigasi</h3>
            </div>
            <button
              type="button"
              onClick={() =>
                setNav((n) => [...n, { id: String(Date.now()), label: "Menu Baru", href: "#" }])
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Menu
            </button>
          </div>
          
          {nav.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada menu navigasi. Klik Tambah untuk membuat.</p>
          ) : (
            <ul className="space-y-2.5">
              {nav.map((n) => (
                <li
                  key={n.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                    <FormField label="Label Menu" className="!mb-0">
                      <Input
                        value={n.label}
                        onChange={(e) =>
                          setNav((xs) =>
                            xs.map((x) => (x.id === n.id ? { ...x, label: e.target.value } : x)),
                          )
                        }
                      />
                    </FormField>
                    <FormField label="Link Tujuan (Anchor/URL)" className="!mb-0">
                      <Input
                        className="font-mono text-xs"
                        value={n.href}
                        onChange={(e) =>
                          setNav((xs) =>
                            xs.map((x) => (x.id === n.id ? { ...x, href: e.target.value } : x)),
                          )
                        }
                      />
                    </FormField>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Hapus menu navigasi ini?")) {
                        setNav((xs) => xs.filter((x) => x.id !== n.id));
                      }
                    }}
                    className="grid h-9 w-9 place-items-center rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition shrink-0 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <SaveBar onSave={handleSave} onCancel={handleCancel} />
    </Section>
  );
}

function HeroEditor() {
  const { cms, updateCMSHero, updateCMSAbout } = useAdminStore();
  const [title, setTitle] = useState(cms.hero.title);
  const [subtitle, setSubtitle] = useState(cms.hero.subtitle);
  const [ctaLabel, setCtaLabel] = useState(cms.hero.ctaLabel);
  const [ctaLink, setCtaLink] = useState(cms.hero.ctaLink);
  const [cta2Label, setCta2Label] = useState(cms.hero.cta2Label || "Bantuan Cari Pendonor");
  const [cta2Link, setCta2Link] = useState(cms.hero.cta2Link || "#kontak");
  const [bgImage, setBgImage] = useState(cms.hero.bgImage || "");
  const [badgeText, setBadgeText] = useState(cms.hero.badgeText || "Setetes darah, sejuta harapan");

  const [aboutTitle, setAboutTitle] = useState(
    cms.about.title || "Jaringan kemanusiaan, dibangun sejak 2008.",
  );
  const [contentHtml, setContentHtml] = useState(cms.about.contentHtml || "");
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  function handleSave() {
    updateCMSHero({
      title,
      subtitle,
      ctaLabel,
      ctaLink,
      cta2Label,
      cta2Link,
      bgImage,
      badgeText,
    });
    updateCMSAbout({
      title: aboutTitle,
      paragraphs: [], // legacy
      photoCaption: "", // legacy
      photoPosition: "center", // legacy
      photo: "", // legacy
      contentHtml: contentHtml,
    });
  }

  function handleCancel() {
    setTitle(cms.hero.title);
    setSubtitle(cms.hero.subtitle);
    setCtaLabel(cms.hero.ctaLabel);
    setCtaLink(cms.hero.ctaLink);
    setCta2Label(cms.hero.cta2Label || "Bantuan Cari Pendonor");
    setCta2Link(cms.hero.cta2Link || "#kontak");
    setBgImage(cms.hero.bgImage || "");
    setBadgeText(cms.hero.badgeText || "Setetes darah, sejuta harapan");
    setAboutTitle(cms.about.title);
    setContentHtml(cms.about.contentHtml || "");
  }

  return (
    <Section title="Panel Hero & Profil">
      <div className="space-y-6">
        {/* Gambar Latar Hero Card */}
        <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <div className="h-5 w-1 bg-primary rounded-full" />
            <h3 className="font-display text-base font-semibold text-ink">Gambar Latar Hero</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_240px] items-center">
            <div className="flex aspect-[21/9] items-center justify-center rounded-xl border border-dashed border-border bg-background overflow-hidden relative shadow-inner">
              {bgImage ? (
                <img
                  src={bgImage}
                  alt="Hero bg preview"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground">Menggunakan gambar default</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                id="hero-bg-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error("Ukuran foto terlalu besar. Maksimal 10MB.");
                      return;
                    }
                    try {
                      toast.loading("Mengunggah latar belakang...", { id: "upload-bg" });
                      const compressed = await compressImage(file, 1920, 1080);
                      const finalUrl = await uploadBase64ToSupabase(compressed, 'hero_bg');
                      setBgImage(finalUrl);
                      toast.success("Gambar berhasil diunggah!", { id: "upload-bg" });
                    } catch (err) {
                      toast.error("Gagal mengunggah gambar", { id: "upload-bg" });
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => document.getElementById("hero-bg-upload")?.click()}
                className="w-full rounded-md border border-border bg-card py-2 text-xs font-semibold hover:bg-muted transition cursor-pointer"
              >
                {bgImage ? "Ganti Gambar Latar" : "Unggah Gambar Latar"}
              </button>
              {bgImage && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Hapus gambar latar hero?")) setBgImage("");
                  }}
                  className="w-full rounded-md border border-red-200 bg-red-50 py-2 text-xs text-red-600 hover:bg-red-100 font-semibold transition cursor-pointer"
                >
                  Hapus Gambar
                </button>
              )}
              <p className="text-[10px] text-muted-foreground leading-normal mt-1">
                Rekomendasi resolusi: 1920x1080px (Aspek rasio 16:9 atau 21:9).
              </p>
            </div>
          </div>
        </div>

        {/* Konten Teks Hero Card */}
        <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <div className="h-5 w-1 bg-primary rounded-full" />
            <h3 className="font-display text-base font-semibold text-ink">Teks & Judul Hero</h3>
          </div>
          <div className="space-y-4">

            <FormField label="Judul Utama Hero">
              <Textarea
                rows={2}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </FormField>
            <FormField label="Sub-judul Hero (Deskripsi Singkat)">
              <Textarea
                rows={3}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* Tombol Aksi Hero Card */}
        <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <div className="h-5 w-1 bg-primary rounded-full" />
            <h3 className="font-display text-base font-semibold text-ink">Tombol Aksi Hero</h3>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 p-4 rounded-lg bg-background border border-border shadow-sm">
              <FormField label="Label Tombol Utama (Merah)" className="!mb-0">
                <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
              </FormField>
              <FormField label="Link Tujuan Utama" className="!mb-0">
                <Input
                  className="font-mono text-xs"
                  placeholder="/daftar-pendonor atau URL"
                  value={ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                />
              </FormField>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 p-4 rounded-lg bg-background border border-border shadow-sm">
              <FormField label="Label Tombol Kedua (Garis)" className="!mb-0">
                <Input value={cta2Label} onChange={(e) => setCta2Label(e.target.value)} />
              </FormField>
              <FormField label="Link Tujuan Kedua" className="!mb-0">
                <Input
                  className="font-mono text-xs"
                  placeholder="/cari-pendonor atau URL"
                  value={cta2Link}
                  onChange={(e) => setCta2Link(e.target.value)}
                />
              </FormField>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Gunakan <code>/daftar-pendonor</code> atau <code>/cari-pendonor</code> untuk formulir internal. Gunakan URL lengkap (misal: <code>https://...</code>) jika ingin mengarahkan ke tautan eksternal.
            </p>
          </div>
        </div>

        {/* Profil KSR PMI UNHAS Card */}
        <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 bg-primary rounded-full" />
              <h3 className="font-display text-base font-semibold text-ink">Profil</h3>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-background border border-border shadow-sm">
              {(() => {
                const imgMatch = contentHtml.match(/<img[^>]+src="([^">]+)"/);
                const imgSrc = imgMatch ? imgMatch[1] : null;
                return imgSrc ? (
                  <div className="w-20 h-20 rounded-md overflow-hidden shrink-0 bg-muted/50 border border-border">
                    <img src={imgSrc} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-md shrink-0 bg-muted/50 border border-border flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-ink text-sm line-clamp-2">{aboutTitle || "Judul Belum Diatur"}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {contentHtml.replace(/<[^>]*>?/gm, '') || "Konten profil belum diatur..."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAboutModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
            >
              <Pencil className="h-4 w-4" /> Edit Konten Profil
            </button>
          </div>
        </div>
      </div>

      <SaveBar onSave={handleSave} onCancel={handleCancel} />

      {/* Modal Editor Profil KSR */}
      {isAboutModalOpen && (
        <Modal
          title="Edit Profil"
          isOpen={isAboutModalOpen}
          onClose={() => setIsAboutModalOpen(false)}
          fullScreen={true}
          maxWidth="5xl"
        >
          <div className="p-4 sm:p-6 space-y-6">
            <FormField label="Judul Profil">
              <Input
                placeholder="Contoh: Jaringan kemanusiaan, dibangun sejak 2008"
                value={aboutTitle}
                onChange={(e) => setAboutTitle(e.target.value)}
              />
            </FormField>

            <FormField label="Isi Konten (Visual Editor)">
              <div className="overflow-hidden rounded-xl border border-input shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all bg-background">
                <RichTextEditor value={contentHtml} onChange={setContentHtml} />
              </div>
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  handleSave();
                  setIsAboutModalOpen(false);
                  toast.success("Profil KSR berhasil disimpan!");
                }}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
              >
                Simpan & Tutup Editor
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Section>
  );
}

function FooterEditor() {
  const { cms, updateCMSFooter } = useAdminStore();
  const [copyright, setCopyright] = useState(cms.footer.copyright);
  const [tagline, setTagline] = useState(cms.footer.tagline);
  const [description, setDescription] = useState(
    cms.footer.description ||
      "Setiap nyawa berhak diberi kesempatan kedua. Bergabunglah bersama jaringan respon cepat donor darah terbesar di Indonesia.",
  );
  const [responsePhone, setResponsePhone] = useState(cms.footer.responsePhone);
  const [partnershipPhone, setPartnershipPhone] = useState(cms.footer.partnershipPhone);
  const [email, setEmail] = useState(cms.footer.email);
  const [address, setAddress] = useState(cms.footer.address || "");
  const [addressUrl, setAddressUrl] = useState(cms.footer.addressUrl || "");
  const [pdpkLogo, setPdpkLogo] = useState(cms.footer.pdpkLogo || "");
  const [ig, setIg] = useState(cms.footer.ig);
  const [fb, setFb] = useState(cms.footer.fb);
  const [twitter, setTwitter] = useState(cms.footer.twitter || "");
  const [thread, setThread] = useState(cms.footer.thread || "");
  const [tiktok, setTiktok] = useState(cms.footer.tiktok || "");
  const [youtube, setYoutube] = useState(cms.footer.youtube || "");
  const [whatsapp, setWhatsapp] = useState(cms.footer.whatsapp || "");

  function handleSave() {
    updateCMSFooter({
      copyright,
      tagline,
      description,
      responsePhone,
      partnershipPhone,
      email,
      address,
      addressUrl,
      pdpkLogo,
      ig,
      fb,
      twitter,
      thread,
      tiktok,
      youtube,
      whatsapp,
    });
  }

  function handleCancel() {
    setCopyright(cms.footer.copyright);
    setTagline(cms.footer.tagline);
    setDescription(
      cms.footer.description ||
        "Setiap nyawa berhak diberi kesempatan kedua. Bergabunglah bersama jaringan respon cepat donor darah terbesar di Indonesia.",
    );
    setResponsePhone(cms.footer.responsePhone);
    setPartnershipPhone(cms.footer.partnershipPhone);
    setEmail(cms.footer.email);
    setAddress(cms.footer.address || "");
    setAddressUrl(cms.footer.addressUrl || "");
    setPdpkLogo(cms.footer.pdpkLogo || "");
    setIg(cms.footer.ig);
    setFb(cms.footer.fb);
    setTwitter(cms.footer.twitter || "");
    setThread(cms.footer.thread || "");
    setTiktok(cms.footer.tiktok || "");
    setYoutube(cms.footer.youtube || "");
    setWhatsapp(cms.footer.whatsapp || "");
  }

  return (
    <Section title="Footer & Pengaturan Kontak">
      <div className="space-y-6">
        {/* Teks Informasi Footer Card */}
        <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <div className="h-5 w-1 bg-primary rounded-full" />
            <h3 className="font-display text-base font-semibold text-ink">Informasi Ringkas</h3>
          </div>
          <div className="space-y-4">
            <FormField label="Deskripsi Footer">
              <Textarea
                rows={2}
                placeholder="Deskripsi singkat yang tampil di bagian bawah website"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Teks Hak Cipta (Copyright)">
                <Input
                  placeholder="© 2026 KSR PMI UNHAS"
                  value={copyright}
                  onChange={(e) => setCopyright(e.target.value)}
                />
              </FormField>
              <FormField label="Tagline Kecil Footer">
                <Input
                  placeholder="Setetes darah, sejuta harapan"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Kontak & Alamat Kantor Card */}
        <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <div className="h-5 w-1 bg-primary rounded-full" />
            <h3 className="font-display text-base font-semibold text-ink">Kontak & Alamat</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField label="No. Telp Respon Cepat">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                    <Phone className="h-4 w-4" />
                  </div>
                  <Input
                    className="pl-9"
                    placeholder="0800-1234-567"
                    value={responsePhone}
                    onChange={(e) => setResponsePhone(e.target.value)}
                  />
                </div>
              </FormField>
              <FormField label="No. Telp Kemitraan">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                    <Phone className="h-4 w-4" />
                  </div>
                  <Input
                    className="pl-9"
                    placeholder="+62 21 1234 5678"
                    value={partnershipPhone}
                    onChange={(e) => setPartnershipPhone(e.target.value)}
                  />
                </div>
              </FormField>
              <FormField label="Email Organisasi">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    className="pl-9"
                    placeholder="kontak@domain.id"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </FormField>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Alamat Kantor Fisik">
                <Textarea
                  rows={2}
                  placeholder="Alamat kantor lengkap..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </FormField>
              <FormField label="Link Google Maps (Alamat)">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                    <Link2 className="h-4 w-4" />
                  </div>
                  <Input
                    className="pl-9 font-mono text-xs"
                    placeholder="https://maps.app.goo.gl/..."
                    value={addressUrl}
                    onChange={(e) => setAddressUrl(e.target.value)}
                  />
                </div>
              </FormField>
            </div>

            <div className="grid gap-6 md:grid-cols-[160px_1fr] items-center pt-2">
              <div className="flex flex-col items-center md:items-start">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Logo PDDK</label>
                <div className="mt-2 grid h-32 w-32 place-items-center rounded-xl border border-dashed border-border bg-background overflow-hidden relative shadow-inner">
                  {pdpkLogo ? (
                    <img
                      src={pdpkLogo}
                      alt="Logo PDDK preview"
                      className="absolute inset-0 h-full w-full object-contain p-2"
                    />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="space-y-3 flex-1">
                <input
                  id="pdpk-logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Ukuran foto terlalu besar. Maksimal 5MB.");
                        return;
                      }
                      try {
                        toast.loading("Mengunggah logo PDPK...", { id: "upload-pdpk" });
                        const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
                        if (isPng) {
                          const compressed = await compressImageWithTransparency(file, 200, 200);
                          const finalUrl = await uploadBase64ToSupabase(compressed, 'logo_pdpk');
                          setPdpkLogo(finalUrl);
                          toast.success("Logo PDPK berhasil diunggah!", { id: "upload-pdpk" });
                        } else {
                          const compressed = await compressImage(file, 200, 200);
                          const finalUrl = await uploadBase64ToSupabase(compressed, 'logo_pdpk');
                          setPdpkLogo(finalUrl);
                          toast.success("Logo PDPK berhasil diunggah!", { id: "upload-pdpk" });
                        }
                      } catch (err) {
                        toast.error("Gagal mengunggah gambar", { id: "upload-pdpk" });
                      }
                    }
                  }}
                />
                <div className="flex gap-2 justify-center md:justify-start">
                  <button
                    type="button"
                    onClick={() => document.getElementById("pdpk-logo-upload")?.click()}
                    className="rounded-md border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted transition cursor-pointer"
                  >
                    {pdpkLogo ? "Ganti Logo" : "Unggah Logo"}
                  </button>
                  {pdpkLogo && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Hapus logo PDDK?")) setPdpkLogo("");
                      }}
                      className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600 hover:bg-red-100 font-semibold transition cursor-pointer"
                    >
                      Hapus Logo
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal text-center md:text-left">
                  Logo ini ditampilkan pada halaman sukses pengisian formulir donor atau permintaan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tautan Media Sosial Card */}
        <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <div className="h-5 w-1 bg-primary rounded-full" />
            <h3 className="font-display text-base font-semibold text-ink">Media Sosial</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <FormField label="Instagram (Link)">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <Instagram className="h-4 w-4" />
                </div>
                <Input
                  className="pl-9 font-mono text-xs"
                  placeholder="https://instagram.com/..."
                  value={ig}
                  onChange={(e) => setIg(e.target.value)}
                />
              </div>
            </FormField>
            <FormField label="Facebook (Link)">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <Facebook className="h-4 w-4" />
                </div>
                <Input
                  className="pl-9 font-mono text-xs"
                  placeholder="https://facebook.com/..."
                  value={fb}
                  onChange={(e) => setFb(e.target.value)}
                />
              </div>
            </FormField>
            <FormField label="Twitter / X (Link)">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <Twitter className="h-4 w-4" />
                </div>
                <Input
                  className="pl-9 font-mono text-xs"
                  placeholder="https://twitter.com/..."
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                />
              </div>
            </FormField>
            <FormField label="Threads (Link)">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <Input
                  className="pl-9 font-mono text-xs"
                  placeholder="https://threads.net/..."
                  value={thread}
                  onChange={(e) => setThread(e.target.value)}
                />
              </div>
            </FormField>
            <FormField label="TikTok (Link)">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <Music className="h-4 w-4" />
                </div>
                <Input
                  className="pl-9 font-mono text-xs"
                  placeholder="https://tiktok.com/@..."
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                />
              </div>
            </FormField>
            <FormField label="YouTube (Link)">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <Youtube className="h-4 w-4" />
                </div>
                <Input
                  className="pl-9 font-mono text-xs"
                  placeholder="https://youtube.com/..."
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                />
              </div>
            </FormField>
            <FormField label="WhatsApp (Link)">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <Input
                  className="pl-9 font-mono text-xs"
                  placeholder="https://wa.me/..."
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
            </FormField>
          </div>
        </div>
      </div>

      <SaveBar onSave={handleSave} onCancel={handleCancel} />
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">
      <h2 className="mb-8 font-display text-xl sm:text-2xl text-ink">{title}</h2>
      {children}
    </section>
  );
}

function SaveBar({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [isClicking, setIsClicking] = useState(false);

  const handleSave = () => {
    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 200);
    onSave();
    toast.success("Perubahan berhasil disimpan!", {
      description: "Data telah diperbarui dan langsung tampil di website",
      duration: 3000,
    });
  };

  const handleCancel = () => {
    onCancel();
    toast.info("Perubahan dibatalkan", {
      description: "Data dikembalikan ke kondisi sebelumnya",
      duration: 2000,
    });
  };

  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground text-center sm:text-left">
        Perubahan akan langsung tampil di beranda.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={handleCancel}
          className="order-2 sm:order-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-all active:scale-95"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          className={[
            "order-1 sm:order-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all",
            isClicking ? "scale-95" : "active:scale-95",
          ].join(" ")}
        >
          Simpan Perubahan
        </button>
      </div>
    </div>
  );
}
