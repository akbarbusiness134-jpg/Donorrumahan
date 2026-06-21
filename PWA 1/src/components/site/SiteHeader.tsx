import { Link, useLocation } from "@tanstack/react-router";
import { Droplet, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminStore } from "@/lib/admin-store";

export function SiteHeader() {
  const { user } = useAdminAuth();
  const { cms } = useAdminStore();
  const [open, setOpen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.scrollY > 100;
    }
    return false;
  });
  const location = useLocation();

  const isHome = location.pathname === "/";
  const showDarkStyles = !isHome || isScrolled || open;

  // Filter navigation: remove items with empty/invalid label or href
  const nav = (cms.header.nav || []).filter((n) => {
    // Check if item has valid structure
    if (!n || typeof n !== "object") return false;

    // Check label is valid
    const hasValidLabel =
      n.label &&
      typeof n.label === "string" &&
      n.label.trim() !== "";

    // Check href is valid
    const hasValidHref = n.href && typeof n.href === "string" && n.href.trim() !== "";

    return hasValidLabel && hasValidHref;
  });

  const mobileNav = nav;

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.matchMedia("(orientation: landscape)").matches);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // Handle scroll for sticky behavior and background blur
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    handleScroll(); // Check initial position
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (open) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [open]);

  return (
    <>
      {/* Mobile menu overlay (closes menu when clicking outside) */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden transition-opacity animate-in fade-in"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <header className={`${
        isHome ? 'fixed' : 'sticky'
      } top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        showDarkStyles 
          ? 'border-border/60 bg-background/95 backdrop-blur-xl shadow-sm text-foreground' 
          : 'border-transparent bg-transparent text-white'
      }`}>
        <div className="header-content mx-auto flex max-w-7xl items-center justify-between gap-4 md:gap-8 px-5 py-3 md:py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-1">
            {cms.header.logo ? (
              <img
                src={cms.header.logo}
                alt={cms.header.orgName}
                className="h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 object-contain"
              />
            ) : (
              <span className="grid h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 place-items-center rounded-full bg-primary text-primary-foreground">
                <Droplet className="h-6 w-6 md:h-7 md:w-7 fill-current" />
              </span>
            )}
            <span className="flex flex-col leading-none">
              <span className={`font-display font-bold text-lg md:text-xl lg:text-2xl transition-colors duration-300 ${
                showDarkStyles ? 'text-ink' : 'text-white'
              }`}>
                {cms.header.orgName}
              </span>
              <span className={`text-[10px] md:text-xs uppercase tracking-[0.15em] transition-colors duration-300 mt-0.5 ${
                showDarkStyles ? 'text-muted-foreground' : 'text-white/80'
              }`}>
                {cms.header.tagline}
              </span>
            </span>
          </Link>
          <nav className="hidden items-center justify-center gap-6 lg:flex">
            {nav.map((n) => (
              <a
                key={n.id}
                href={n.href}
                className={`text-sm transition-colors duration-300 ${
                  showDarkStyles 
                    ? 'text-foreground/75 hover:text-primary' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-1.5">
            <a
              href="#kontak"
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-300 lg:px-4 lg:py-2 ${
                showDarkStyles 
                  ? 'bg-ink text-background hover:bg-primary shadow-sm' 
                  : 'bg-white text-ink hover:bg-white/95 shadow-md hover:scale-105 transform'
              }`}
            >
              Hubungi Kami
            </a>
          </div>
          <button
            aria-label="Menu"
            className={`lg:hidden relative h-10 w-10 flex flex-col justify-center items-center rounded-full transition-all duration-200 active:scale-90 ${
              showDarkStyles 
                ? 'text-foreground hover:bg-foreground/5' 
                : 'text-white hover:bg-white/10'
            }`}
            onClick={() => setOpen(!open)}
          >
            {/* Custom animated burger lines */}
            <div className="relative w-5 h-4 flex flex-col justify-between items-center">
              <span className={`block h-[2px] w-5 rounded bg-current transform transition-all duration-300 ease-in-out origin-center ${
                open ? "rotate-45 translate-y-[7px]" : ""
              }`} />
              <span className={`block h-[2px] w-5 rounded bg-current transition-all duration-200 ease-in-out ${
                open ? "opacity-0 -translate-x-2" : "opacity-100"
              }`} />
              <span className={`block h-[2px] w-5 rounded bg-current transform transition-all duration-300 ease-in-out origin-center ${
                open ? "-rotate-45 -translate-y-[7px]" : ""
              }`} />
            </div>
          </button>
        </div>
        
        {/* Mobile menu - Portrait mode */}
        {open && !isLandscape && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border shadow-2xl animate-slide-down-fade origin-top transform-gpu">
            <div className="flex flex-col px-6 py-6 gap-2">
              {mobileNav.map((n, idx) => (
                <a
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  className="w-full text-left py-3.5 px-4 text-base font-medium text-foreground/80 rounded-xl transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:pl-6 animate-slide-right-fade transform-gpu"
                >
                  {n.label}
                </a>
              ))}
              <div className="w-full h-px bg-border/50 my-2" />
              <a
                href="#kontak"
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${mobileNav.length * 40}ms` }}
                className="mt-2 w-full rounded-full bg-primary px-5 py-3.5 text-center text-base font-bold text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md animate-slide-right-fade transform-gpu"
              >
                Hubungi Kami
              </a>
            </div>
          </div>
        )}
        
        {/* Mobile menu - Landscape mode (Fullscreen) */}
        {open && isLandscape && (
          <div className="absolute top-full left-0 right-0 h-[calc(100vh-3.5rem)] bg-background/95 backdrop-blur-xl lg:hidden overflow-y-auto animate-slide-down-fade transform-gpu">
            <div className="flex flex-col px-6 py-6 gap-2 pb-24">
              {mobileNav.map((n, idx) => (
                <a
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  className="w-full text-left py-3 px-4 text-base font-medium text-foreground/80 rounded-xl transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:pl-6 animate-slide-right-fade transform-gpu"
                >
                  {n.label}
                </a>
              ))}
              <div className="w-full h-px bg-border/50 my-2" />
              <a
                href="#kontak"
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${mobileNav.length * 40}ms` }}
                className="mt-2 w-full max-w-sm rounded-full bg-primary px-5 py-3 text-center text-base font-bold text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02] shadow-md animate-slide-right-fade transform-gpu"
              >
                Hubungi Kami
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
