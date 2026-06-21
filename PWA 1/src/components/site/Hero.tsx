import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import heroImg from "@/assets/hero-donor.jpg";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { useAdminStore } from "@/lib/admin-store";

export function Hero() {
  const { cms, isLoaded } = useAdminStore();
  const { title, subtitle, ctaLabel, ctaLink, cta2Label, cta2Link, bgImage } = cms.hero;

  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Hilangkan kelas animasi setelah selesai agar aman saat di-scroll di iOS Safari
    const timer = setTimeout(() => setIsAnimating(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Check if link is external or anchor
  const isExternalLink = (link: string) => {
    return link.startsWith("http://") || link.startsWith("https://") || link.startsWith("//");
  };

  const isAnchorLink = (link: string) => {
    return link.startsWith("#");
  };

  const renderTitle = (fullTitle: string) => {
    if (!fullTitle) return "";
    return fullTitle;
  };

  const renderButton = (label: string, link: string, isPrimary: boolean) => {
    if (!label) return null;

    const isExternal = isExternalLink(link);
    const isAnchor = isAnchorLink(link);
    const buttonContent = (
      <>
        {label}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </>
    );

    const buttonClass = isPrimary
      ? "rounded-full shadow-lg min-w-[180px] lg:min-w-[220px] bg-gradient-to-r from-primary to-rose-600 text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.35)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 border-none font-semibold tracking-wide"
      : "rounded-full shadow-lg min-w-[180px] lg:min-w-[220px] bg-white text-rose-600 hover:bg-gray-50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 border-none font-semibold tracking-wide";

    // External link
    if (isExternal) {
      return (
        <Button
          asChild
          className={buttonClass}
        >
          <a href={link} target="_blank" rel="noopener noreferrer" className="group">
            {buttonContent}
          </a>
        </Button>
      );
    }

    // Anchor link
    if (isAnchor) {
      return (
        <Button
          asChild
          className={buttonClass}
        >
          <a href={link} className="group">
            {buttonContent}
          </a>
        </Button>
      );
    }

    // Internal route (React Router)
    return (
      <Button
        asChild
        className={buttonClass}
      >
        <Link to={link as any} className="group">
          {buttonContent}
        </Link>
      </Button>
    );
  };

  return (
    <section
      id="beranda"
      className="relative w-full h-[100svh] min-h-[100svh] bg-slate-900 text-white overflow-hidden transform-gpu"
    >
      <style>{`
        @keyframes scaleDownHero {
          from { transform: scale(1.15); }
          to { transform: scale(1); }
        }
        .animate-hero-scale {
          animation: scaleDownHero 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          will-change: transform;
        }
      `}</style>
      <img
        src={bgImage || heroImg}
        alt="Tim donor darah membantu pendonor"
        className={`absolute inset-0 h-full w-full object-cover object-center transform-gpu ${isAnimating ? 'animate-hero-scale' : 'scale-100'}`}
      />
      <div className="absolute inset-0 bg-slate-900/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

      <div className="absolute left-0 top-[56px] md:top-[72px] z-20 w-full">
        <AnnouncementBar />
      </div>

      <div className={`absolute inset-0 flex flex-col items-center justify-center max-w-4xl mx-auto px-5 lg:px-8 text-center pt-40 sm:pt-44 md:pt-48 pb-16 sm:pb-0 transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}>

        <h1 className="mt-6 max-w-4xl text-balance font-extrabold text-white text-4xl leading-[1.15] sm:text-5xl md:text-6xl drop-shadow-lg tracking-tight">
          {renderTitle(title)}
        </h1>
        <p className="mt-6 max-w-2xl text-base text-white/90 md:text-lg lg:text-xl font-medium leading-relaxed drop-shadow">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:gap-6 justify-center">
          {renderButton(cta2Label, cta2Link, true)}
          {renderButton(ctaLabel, ctaLink, false)}
        </div>
      </div>
    </section>
  );
}
