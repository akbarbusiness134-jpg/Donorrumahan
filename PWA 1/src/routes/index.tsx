import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Hero } from "@/components/site/Hero";
import { KsrPmiUnhas } from "@/components/site/KsrPmiUnhas";
import { PublikasiDokumentasi } from "@/components/site/PublikasiDokumentasi";
import { Galeri } from "@/components/site/Galeri";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KSR PMI UNHAS — Organisasi & Respon Cepat Donor Darah" },
      {
        name: "description",
        content:
          "Portal informasi & respon cepat donor darah. Daftar jadi pendonor, cari pendonor, dan ikuti kegiatan kemanusiaan kami.",
      },
      { property: "og:title", content: "KSR PMI UNHAS — Setetes darah, sejuta harapan" },
      {
        property: "og:description",
        content:
          "Jaringan respon cepat donor darah, menghubungkan pendonor dengan mereka yang membutuhkan.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        {/* Konten Beranda - All in one section */}
        <section className="relative bg-background">
          <KsrPmiUnhas />
          <PublikasiDokumentasi />
          <Galeri />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
