import React, { useState } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { type Article } from "@/lib/admin-data";
import { parseArticleBody } from "@/lib/utils";
import { Calendar, FileText, AlertCircle, ArrowRight, X } from "lucide-react";
import { Modal } from "@/components/admin/Modal";

function ArticleItem({ a, onReadMore }: { a: Article; onReadMore: () => void }) {
  let displayImage = a.image;
  if (!displayImage && a.body) {
    const match = a.body.match(/<img[^>]+src="([^">]+)"/i);
    if (match) {
      displayImage = match[1];
    }
  }

  const hasImage = !!displayImage;
  const bodyText = a.body || "";

  // Calculate read time
  const wordCount = bodyText.trim().split(/\s+/).length || 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 220));

  const showReadMore = bodyText.trim().length > 0;

  return (
    <article className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative group flex flex-col justify-between h-full">
      {/* Light glow on hover */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div>
        {/* Card Image */}
        {hasImage && (
          <div 
            onClick={onReadMore}
            className="cursor-pointer overflow-hidden relative w-full h-48 border-b border-border/40 bg-muted"
          >
            <img
              src={displayImage}
              alt={a.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            />
          </div>
        )}

        {/* Card Body */}
        <div className="p-4 lg:p-5 flex flex-col items-center">
          <p className="text-primary text-xs font-semibold mb-2 tracking-wide">
            {a.publishedAt}
          </p>
          <div className="w-8 h-[2px] bg-primary mb-3" />

          <h3 
            onClick={onReadMore}
            className="font-display font-bold text-base lg:text-lg text-ink leading-snug mb-2 text-center group-hover:text-primary transition-colors duration-200 cursor-pointer"
          >
            {a.title}
          </h3>
        </div>
      </div>

      {/* Button footer */}
      <div className="px-4 pb-4 pt-1 flex justify-center w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {showReadMore && (
          <button
            type="button"
            onClick={onReadMore}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-rose-600 transition-colors duration-200 cursor-pointer group/btn"
          >
            Baca <ArrowRight className="h-4 w-4 transition group-hover/btn:translate-x-1" />
          </button>
        )}
      </div>
    </article>
  );
}

export function PublikasiDokumentasi() {
  const { articles, cms } = useAdminStore();
  const [selectedTag, setSelectedTag] = useState("Semua");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  if (articles.length === 0) {
    return null;
  }

  // Filter tags to only show those that exist in availableTags configuration
  const availableTags = cms.articles?.availableTags || [];
  const uniqueArticleTags = Array.from(new Set(articles.map((a) => a.tag).filter(Boolean)));
  
  const activeTags = uniqueArticleTags.filter((tag) =>
    availableTags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );

  // Hide "Semua" tag if there is at most 1 active tag
  const tags = activeTags.length > 1 ? ["Semua", ...activeTags] : activeTags;

  const activeSelectedTag = tags.includes(selectedTag) 
    ? selectedTag 
    : (tags.includes("Semua") ? "Semua" : (tags[0] || "Semua"));

  // Filter articles
  const filteredArticles =
    activeSelectedTag === "Semua" 
      ? articles 
      : articles.filter((a) => a.tag && a.tag.toLowerCase() === activeSelectedTag.toLowerCase());

  return (
    <section
      id="edukasi"
      className="relative bg-background overflow-hidden pt-8 pb-16 lg:pt-12 lg:pb-24 animate-fade-in"
    >
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          {(cms.articles?.sectionTag || "Publikasi & Dokumentasi") && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 mb-3">
              <FileText className="h-3 w-3" /> {cms.articles?.sectionTag || "Publikasi & Dokumentasi"}
            </span>
          )}
          {(cms.articles?.sectionTitle || "Edukasi & Informasi") && (
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-ink">
              {cms.articles?.sectionTitle || "Edukasi & Informasi"}
            </h2>
          )}
          {cms.articles?.sectionSubtitle && (
            <p className="mt-3 text-muted-foreground md:text-lg">
              {cms.articles?.sectionSubtitle}
            </p>
          )}
        </div>

        {/* Tag Filters */}
        {tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeSelectedTag === tag
                    ? "bg-primary text-white shadow-md hover:bg-primary/95 scale-105"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Articles Grid Layout */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch">
            {filteredArticles.map((a) => (
              <ArticleItem key={a.id} a={a} onReadMore={() => setSelectedArticle(a)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-3xl bg-card text-center max-w-md mx-auto">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <h4 className="font-display font-bold text-lg text-ink">Belum Ada Artikel</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Tidak ada artikel dengan kategori "{selectedTag}" untuk saat ini. Silakan pilih
              kategori lain.
            </p>
          </div>
        )}
      </div>

      {/* Modal / Jendela Besar untuk Artikel */}
      {selectedArticle && (
        <Modal
          title={selectedArticle.title}
          subtitle={`${selectedArticle.publishedAt} • Oleh: ${selectedArticle.author || "Admin"}`}
          onClose={() => setSelectedArticle(null)}
          maxWidth="4xl"
          animation="slide-up"
          fullScreen={true}
        >
          {selectedArticle.image && (
            <div className="w-full mb-6 flex justify-center">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-auto h-auto max-h-[60vh] max-w-full object-contain rounded-xl"
              />
            </div>
          )}
          <div
            className="prose prose-red max-w-none text-foreground/85 text-[15px] leading-relaxed text-justify [&>p]:text-justify [&>p]:mb-4"
            dangerouslySetInnerHTML={{
              __html: selectedArticle.isHtml ? selectedArticle.body : parseArticleBody(selectedArticle.body || ""),
            }}
          />
          {/* Tombol Tutup di Bawah (Semua Perangkat untuk UX yang lebih baik) */}
          <div className="mt-12 flex justify-center pb-6 border-t border-border/50 pt-8">
            <button
              onClick={() => setSelectedArticle(null)}
              className="group inline-flex items-center gap-2 rounded-full bg-rose-700 text-white hover:bg-rose-800 px-7 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer border-none shadow-sm"
            >
              <X className="h-4 w-4 shrink-0 transition-transform group-hover:rotate-90 duration-300" />
              Tutup Artikel
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
