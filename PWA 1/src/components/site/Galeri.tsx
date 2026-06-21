import { useRef, useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  SlidersHorizontal,
  Maximize2,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
// Global tracking to make history pushState and back navigation safe for Lightbox in React StrictMode
let activeLightboxCount = 0;
let pushedLightboxStateCount = 0;
let pendingLightboxBackTimeout: number | null = null;



function parseGalleryCaption(caption: string) {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/u;
  const match = caption.match(emojiRegex);

  if (match && match.index !== undefined) {
    const mainText = caption.substring(0, match.index).trim().replace(/,\s*$/, '');
    const tagText = caption.substring(match.index).trim();
    return { mainText, tagText };
  }

  const lastCommaIndex = caption.lastIndexOf(',');
  if (lastCommaIndex !== -1) {
    const mainText = caption.substring(0, lastCommaIndex).trim();
    const tagText = caption.substring(lastCommaIndex + 1).trim();
    return { mainText, tagText };
  }

  return { mainText: caption, tagText: "DOKUMENTASI" };
}

export function Galeri() {
  const { gallery, cms, isLoaded } = useAdminStore();
  
  // Jika sedang memuat dari database, jangan tampilkan apa-apa dulu untuk mencegah flicker
  if (!isLoaded) {
    return (
      <section className="relative bg-background overflow-hidden py-16 lg:py-24 animate-pulse">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="h-8 bg-muted w-1/3 mx-auto rounded mb-4"></div>
          <div className="h-4 bg-muted w-1/2 mx-auto rounded"></div>
        </div>
      </section>
    );
  }

  const photos = gallery;

  const [viewMode, setViewMode] = useState<"slide" | "grid">("slide");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const itemWidth = useRef(0);

  // Check if title and description should be shown (default: true if not set)
  const showTitle = cms.gallery?.showTitle !== false;
  const showDescription = cms.gallery?.showDescription !== false;

  // Update scroll button states
  const updateScrollButtons = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;

    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);
  }, []);

  // Smooth scroll ke posisi tertentu
  const scrollToPosition = (targetPosition: number, duration = 500) => {
    const container = containerRef.current;
    if (!container || isAnimating.current) return;

    isAnimating.current = true;
    const startPosition = container.scrollLeft;
    const distance = targetPosition - startPosition;
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      container.scrollLeft = startPosition + distance * easedProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isAnimating.current = false;
        updateScrollButtons();
      }
    };

    requestAnimationFrame(animate);
  };

  // Pindah ke foto tertentu
  const goToSlide = (index: number) => {
    if (index < 0 || index >= photos.length || isAnimating.current) return;
    setCurrentIndex(index);
    const targetPosition = index * itemWidth.current;
    scrollToPosition(targetPosition);
  };

  const prevSlide = () => {
    const container = containerRef.current;
    if (!container || isAnimating.current || !canScrollLeft) return;

    // Scroll by approximately one item width
    const targetPosition = Math.max(0, container.scrollLeft - itemWidth.current);
    scrollToPosition(targetPosition, 400);
  };

  const nextSlide = () => {
    const container = containerRef.current;
    if (!container || isAnimating.current || !canScrollRight) return;

    // Scroll by approximately one item width
    const maxScroll = container.scrollWidth - container.clientWidth;
    const targetPosition = Math.min(maxScroll, container.scrollLeft + itemWidth.current);
    scrollToPosition(targetPosition, 400);
  };

  // Handle manual scroll (touch/mouse) indicator updates only
  useEffect(() => {
    if (viewMode !== "slide") return;
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isAnimating.current) return;

      updateScrollButtons();

      const scrollPosition = container.scrollLeft;
      const calculatedIndex = Math.round(scrollPosition / itemWidth.current);
      const boundedIndex = Math.max(0, Math.min(photos.length - 1, calculatedIndex));

      if (boundedIndex !== currentIndex) {
        setCurrentIndex(boundedIndex);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    // Initial check
    updateScrollButtons();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [currentIndex, photos.length, viewMode, updateScrollButtons]);

  // Setup slide dimensions
  useEffect(() => {
    if (viewMode !== "slide") return;
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      // Reset padding to ensure left alignment
      container.style.paddingLeft = "0px";
      container.style.paddingRight = "0px";

      const firstItem = container.querySelector("figure") as HTMLElement;
      if (firstItem) {
        const itemRect = firstItem.getBoundingClientRect();
        // Width + gap (24px from gap-6)
        itemWidth.current = itemRect.width + 24;
      }

      // Update scroll button states
      updateScrollButtons();
    };

    // Initial update
    updateDimensions();

    // Update on resize
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, [photos.length, viewMode, updateScrollButtons]);

  // Lightbox navigation
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const nextLightboxImage = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const prevLightboxImage = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard controls & Back button history integration for Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    activeLightboxCount++;
    if (pendingLightboxBackTimeout !== null) {
      window.clearTimeout(pendingLightboxBackTimeout);
      pendingLightboxBackTimeout = null;
    }

    if (pushedLightboxStateCount === 0) {
      window.history.pushState({ lightboxOpen: true }, "");
      pushedLightboxStateCount = 1;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextLightboxImage();
      if (e.key === "ArrowLeft") prevLightboxImage();
      if (e.key === "Escape") setLightboxOpen(false);
    };

    const handlePopState = () => {
      pushedLightboxStateCount = 0;
      setLightboxOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);
    // Disable body scroll when lightbox is open
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      activeLightboxCount--;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;

      // Delay the back navigation to let StrictMode settle
      if (activeLightboxCount === 0 && pushedLightboxStateCount > 0) {
        pendingLightboxBackTimeout = window.setTimeout(() => {
          pendingLightboxBackTimeout = null;
          if (pushedLightboxStateCount > 0) {
            pushedLightboxStateCount = 0;
            window.history.back();
          }
        }, 50);
      }
    };
  }, [lightboxOpen, nextLightboxImage, prevLightboxImage]);

  return (
    <section
      id="galeri"
      className="relative bg-background overflow-x-hidden py-16 lg:py-24"
    >
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .hide-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {/* Decorative Gradient Backgrounds */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Top left warm gradient */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-red-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl" />
        {/* Bottom right cool gradient */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tl from-primary/15 via-red-600/5 to-transparent rounded-full blur-3xl" />
        {/* Center subtle accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 via-transparent to-transparent rounded-full blur-2xl" />
      </div>

      <div className="mx-auto max-w-7xl px-5 lg:px-8 overflow-x-hidden">
        {/* Header with View Switcher */}
        <div className="flex flex-col items-center text-center gap-6 mb-12">
          <div className="flex flex-col items-center">
            {(cms.gallery?.sectionTag || "Galeri") && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 mb-3">
                {cms.gallery?.sectionTag || "Galeri"}
              </span>
            )}
            {(cms.gallery?.sectionTitle || "Momen Kegiatan & Aksi Sosial") && (
              <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-ink">
                {cms.gallery?.sectionTitle || "Momen Kegiatan & Aksi Sosial"}
              </h2>
            )}
            {cms.gallery?.sectionSubtitle && (
              <p className="mt-2 text-muted-foreground max-w-2xl text-center">
                {cms.gallery?.sectionSubtitle}
              </p>
            )}
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center bg-card border border-border p-1 rounded-xl w-fit shadow-sm">
            <button
              onClick={() => setViewMode("slide")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-[0.97] ${viewMode === "slide"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/60 hover:text-primary hover:bg-muted"
                }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Slider
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-[0.97] ${viewMode === "grid"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/60 hover:text-primary hover:bg-muted"
                }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grid
            </button>
          </div>
        </div>

        {/* --- Mode Slide (Carousel) --- */}
        {viewMode === "slide" && (
          <div className="relative overflow-hidden -mx-5 lg:-mx-8">
            {/* Carousel Container */}
            <div className="relative overflow-hidden px-5 lg:px-8">
              <div
                ref={containerRef}
                className="hide-scrollbar flex gap-6 overflow-x-scroll py-4 px-2 -mb-4"
                style={{
                  WebkitOverflowScrolling: "touch",
                  scrollBehavior: "smooth",
                  paddingBottom: "1rem",
                }}
              >
                {photos.map((photo, index) => {
                  return (
                    <figure
                      key={photo.id}
                      onClick={() => openLightbox(index)}
                      className="shrink-0 cursor-pointer select-none"
                      style={{
                        width: "280px",
                        minWidth: "280px",
                      }}
                    >
                      <div className="overflow-hidden rounded-3xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                        <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-muted relative group">
                          <img
                            src={photo.src}
                            alt={photo.caption}
                            width="280"
                            height="373"
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {/* Absolute Caption Overlay - Fixed positioning */}
                          {(() => {
                            const { mainText, tagText } = parseGalleryCaption(photo.caption);
                            return (
                              <>
                                {/* Location tag - fixed position from top */}
                                <div className="absolute top-6 left-6 z-10 pointer-events-none">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-white border border-white/20">
                                    {tagText}
                                  </span>
                                </div>
                                {/* Main text - bottom overlay with enhanced gradient */}
                                <figcaption className="absolute bottom-0 left-0 right-0 h-36 px-6 pt-12 text-white text-left z-10 pointer-events-none flex items-start" style={{
                                  background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.75) 35%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.15) 85%, transparent 100%)'
                                }}>
                                  <h3 className="font-display font-bold text-base leading-snug text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_100%)]">
                                    {mainText}
                                  </h3>
                                </figcaption>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </figure>
                  );
                })}
              </div>

              {/* Floating Navigation Buttons */}
              {/* Left Button */}
              <button
                onClick={prevSlide}
                disabled={!canScrollLeft}
                aria-label="Foto Sebelumnya"
                className="hidden lg:grid absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 place-items-center rounded-full border-2 border-white/20 bg-white/90 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Right Button */}
              <button
                onClick={nextSlide}
                disabled={!canScrollRight}
                aria-label="Foto Berikutnya"
                className="hidden lg:grid absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 place-items-center rounded-full border-2 border-white/20 bg-white/90 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>



            {/* Dots Indicator - Hidden */}
          </div>
        )}

        {/* --- Mode Grid --- */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in duration-300 w-full py-4">
            {photos.map((photo, index) => (
              <figure
                key={photo.id}
                onClick={() => openLightbox(index)}
                className="transition-all duration-300 cursor-pointer group w-full"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-3xl shadow-md hover:shadow-xl hover:scale-[1.03] hover:-rotate-1 transform transition-all duration-300 bg-muted relative">
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    width="400"
                    height="300"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Zoom Overlay on hover */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pb-12">
                    <div className="p-3 bg-card/90 backdrop-blur-sm rounded-full shadow-md scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Maximize2 className="h-4.5 w-4.5 text-primary" />
                    </div>
                  </div>
                  {/* Absolute Caption Overlay - Fixed positioning */}
                  {(() => {
                    const { mainText, tagText } = parseGalleryCaption(photo.caption);
                    return (
                      <>
                        {/* Location tag - fixed position from top */}
                        <div className="absolute top-6 left-6 z-10 pointer-events-none">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-white border border-white/20">
                            {tagText}
                          </span>
                        </div>
                        <figcaption className="absolute bottom-0 left-0 right-0 h-24 px-6 pt-8 bg-gradient-to-t from-black/95 via-black/75 via-50% to-transparent text-white text-left z-10 pointer-events-none flex items-start">
                          <h3 className="font-display font-bold text-base leading-snug text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_100%)]">
                            {mainText}
                          </h3>
                        </figcaption>
                      </>
                    );
                  })()}
                </div>
              </figure>
            ))}
          </div>
        )}
      </div>

      {/* --- Lightbox Fullscreen Modal --- */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Lightbox Header */}
          <div
            className="flex items-center justify-between text-white w-full max-w-7xl mx-auto py-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-semibold tracking-wider bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
              {lightboxIndex + 1} / {photos.length}
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-primary hover:text-white transition-all cursor-pointer backdrop-blur-sm border border-white/10"
              aria-label="Tutup Galeri"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Lightbox Main Content */}
          <div className="relative flex items-center justify-center flex-1 w-full max-w-7xl mx-auto my-2 overflow-hidden">
            {/* Prev Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevLightboxImage();
              }}
              className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-white/5 hover:bg-primary text-white border border-white/10 transition-all hover:scale-105 cursor-pointer backdrop-blur-sm"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Image Container */}
            <div
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[lightboxIndex].src}
                alt={photos[lightboxIndex].caption}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-zoom-in"
              />
            </div>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextLightboxImage();
              }}
              className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-white/5 hover:bg-primary text-white border border-white/10 transition-all hover:scale-105 cursor-pointer backdrop-blur-sm"
              aria-label="Berikutnya"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Lightbox Footer Caption */}
          <div
            className="w-full max-w-3xl mx-auto text-center z-10 pb-2 sm:pb-4 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-5 shadow-2xl max-h-[20vh] overflow-y-auto">
              <p className="text-white text-sm sm:text-lg font-medium leading-relaxed">
                {photos[lightboxIndex].caption}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
