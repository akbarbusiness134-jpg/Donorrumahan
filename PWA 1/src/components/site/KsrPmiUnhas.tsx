import aboutImage from "@/assets/about-team.jpg";
import { useState, useRef, useEffect } from "react";
import { useAdminStore } from "@/lib/admin-store";
import { parseArticleBody } from "@/lib/utils";
import { Heart, ChevronDown, ChevronUp, Droplet } from "lucide-react";
import { Modal } from "@/components/admin/Modal";
export function KsrPmiUnhas() {
  const { cms, isLoaded } = useAdminStore();
  const { title, paragraphs, photoCaption, photo, photoPosition = 'center', contentHtml } = cms.about;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [maxLines, setMaxLines] = useState(11);
  const [isMobile, setIsMobile] = useState(false);

  // Ekstrak gambar pertama dari contentHtml jika ada (untuk ditampilkan di mobile saat teks disembunyikan)
  const extractedImageSrc = contentHtml ? contentHtml.match(/<img[^>]+src="([^">]+)"/)?.[1] : null;
  const mobilePhotoSrc = extractedImageSrc || photo || aboutImage;

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const legacyFullText = paragraphs.join("\n\n");
  const plainText = contentHtml ? contentHtml.replace(/<[^>]*>?/gm, '') : legacyFullText;
  const contentLength = plainText.length;

  // Calculate max lines based on image height for left/right positions
  useEffect(() => {
    if (photoPosition !== 'center' && photo) {
      const calculateLines = () => {
        if (imageRef.current) {
          const imageHeight = imageRef.current.offsetHeight;
          // Approximate line height (17px text + 1.7 line-height = ~29px per line)
          const approximateLineHeight = 29;

          // Calculate how many FULL lines fit in image height
          // Use Math.floor to ensure we only show complete lines
          const calculatedLines = Math.floor(imageHeight / approximateLineHeight);
          setMaxLines(Math.max(9, Math.min(calculatedLines, 14))); // Between 9-14 lines
        }
      };

      // Initial calculation with delay
      const timer = setTimeout(calculateLines, 200);

      // Recalculate on window resize
      window.addEventListener('resize', calculateLines);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', calculateLines);
      };
    } else {
      setMaxLines(11); // Reset to default
    }
  }, [photoPosition, photo]);
  // Simple length-based check for "Read More" button
  const showReadMore = isMobile || (contentHtml ? contentLength > 500 : (
    (photoPosition === 'center' && contentLength > 300) ||
    (photoPosition !== 'center' && contentLength > 500)
  ));

  return (
    <section id="tentang" className={`relative bg-background overflow-hidden pt-16 pb-12 lg:pt-24 lg:pb-12 transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
      {/* Decorative Grid and Glow Backgrounds */}
      <div className="absolute inset-0 -z-10 pointer-events-none opacity-40">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="block w-full clear-both">
          {/* Header Judul */}
          <div className="text-center mb-8 lg:mb-12 flex flex-col items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 mb-4">
              KSR PMI UNHAS
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight max-w-4xl text-center mx-auto">
              {title || "Jaringan kemanusiaan, dibangun sejak 2008."}
            </h2>
          </div>

          {/* Foto Mobile (Dipindah ke atas) */}
          <div className="block md:hidden w-full max-w-[400px] mx-auto mb-6 relative group">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-2xl opacity-50 -z-10" />
            <div className="flex items-center justify-center p-1">
              <img
                src={mobilePhotoSrc}
                  alt={photoCaption || "Konten highlight team"}
                  loading="lazy"
                  className="w-full h-auto max-h-[400px] object-cover rounded-3xl drop-shadow-md"
                />
              </div>
              {photoCaption && (
                <p className="mt-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {photoCaption}
                </p>
              )}
            </div>
          {/* Wrapper Konten Utama */}
          <div className="relative w-full">
            <div 
              className={`relative overflow-hidden max-h-0 opacity-0 md:opacity-100 md:max-h-[320px] lg:max-h-[480px]`}
            >
              {/* Foto Float Desktop (Hanya jika menggunakan legacy form) */}
              {!contentHtml && (
                <div className={`hidden lg:block lg:w-[45%] max-w-[480px] ${photoPosition === 'left' ? 'float-left mr-10' : 'float-right ml-10'} mb-6 mt-2 relative group`}>
                  <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 -z-10" />
                  <div className="flex items-center justify-center transition-all duration-500 hover:-rotate-1 transform p-2">
                    <img
                      src={photo || aboutImage}
                      alt={photoCaption || "Konten highlight team"}
                      loading="eager"
                      className="w-full h-auto max-h-[500px] object-contain rounded-3xl drop-shadow-xl group-hover:drop-shadow-2xl transition-all duration-500 ease-out group-hover:scale-[1.02]"
                    />
                  </div>
                  {photoCaption && (
                    <p className="mt-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {photoCaption}
                    </p>
                  )}
                </div>
              )}

              {/* Teks Paragraf */}
              <div
                ref={contentRef}
                className="prose prose-red max-w-none text-foreground/85 md:text-[17px] leading-relaxed text-justify [&>p]:text-justify [&>p]:mb-5 [&_img]:hidden md:[&_img]:block"
                dangerouslySetInnerHTML={{
                  __html: contentHtml ? contentHtml : parseArticleBody(legacyFullText),
                }}
              />

              {/* Gradient overlay for fade out effect */}
              {contentLength > 500 && (
                <div className="hidden md:block absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-background/0 z-10 pointer-events-none" />
              )}
            </div>

            {/* Read more buttons */}
            <div className="mt-2 md:mt-6 clear-both flex justify-center md:justify-start">
              {showReadMore && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground/85 transition hover:border-primary hover:text-primary hover:shadow-md cursor-pointer"
                >
                  Baca Selengkapnya <ChevronDown className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Modal untuk Membaca Selengkapnya */}
            {isModalOpen && (
              <Modal
                title={title || "Jaringan kemanusiaan, dibangun sejak 2008."}
                subtitle="KSR PMI UNHAS"
                onClose={() => setIsModalOpen(false)}
                maxWidth="4xl"
                animation="slide-up"
                fullScreen={true}
              >
                {!contentHtml && photo && (
                  <div className="w-full mb-6 flex flex-col items-center justify-center">
                    <img
                      src={photo}
                      alt={photoCaption || "Konten highlight team"}
                      className="w-auto h-auto max-h-[50vh] max-w-full object-contain rounded-xl drop-shadow-md"
                    />
                    {photoCaption && (
                      <p className="mt-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {photoCaption}
                      </p>
                    )}
                  </div>
                )}
                
                <div
                  className="prose prose-red max-w-none text-foreground/85 md:text-[17px] leading-relaxed text-justify [&>p]:text-justify [&>p]:mb-5"
                  dangerouslySetInnerHTML={{
                    __html: contentHtml ? contentHtml : parseArticleBody(legacyFullText),
                  }}
                />
              </Modal>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}
