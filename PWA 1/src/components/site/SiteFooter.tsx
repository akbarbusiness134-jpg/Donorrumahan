import {
  Droplet,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { 
  FaInstagram, 
  FaFacebook, 
  FaXTwitter, 
  FaTiktok, 
  FaYoutube,
} from "react-icons/fa6";
import { SiThreads } from "react-icons/si";
import { Link } from "@tanstack/react-router";
import { useAdminStore } from "@/lib/admin-store";

export function SiteFooter() {
  const { cms } = useAdminStore();
  const {
    copyright,
    tagline,
    description,
    responsePhone,
    partnershipPhone,
    email,
    address = "",
    addressUrl = "",
    ig,
    fb,
    twitter,
    thread,
    tiktok,
    youtube,
  } = cms.footer;

  const hasAddress = address && address.trim() !== "";
  const hasMapsUrl = addressUrl && addressUrl.trim() !== "";

  // Filter only filled social media links with brand logos (exclude Email & WhatsApp)
  const socials = [
    { 
      Icon: FaInstagram, 
      href: ig, 
      label: "Instagram",
      bgColor: "bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500"
    },
    { 
      Icon: FaFacebook, 
      href: fb, 
      label: "Facebook",
      bgColor: "bg-[#1877F2]"
    },
    { 
      Icon: FaXTwitter, 
      href: twitter, 
      label: "X (Twitter)",
      bgColor: "bg-black"
    },
    { 
      Icon: SiThreads, 
      href: thread, 
      label: "Threads",
      bgColor: "bg-black"
    },
    { 
      Icon: FaTiktok, 
      href: tiktok, 
      label: "TikTok",
      bgColor: "bg-black"
    },
    { 
      Icon: FaYoutube, 
      href: youtube, 
      label: "YouTube",
      bgColor: "bg-[#FF0000]"
    },
  ].filter((item) => item.href && item.href.trim() !== "" && item.href !== "#");

  const formatWaLink = (phone: string) => {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    return `https://wa.me/${cleaned}`;
  };

  return (
    <footer id="kontak" className="border-t border-border bg-ink text-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        {/* Main Content Grid - 4 Columns Layout for Desktop */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          
          {/* Column 1: Brand & About */}
          <div className="lg:col-span-1 space-y-5">
            <div className="flex items-center gap-2.5">
              {cms.header.logo ? (
                <img
                  src={cms.header.logo}
                  alt={cms.header.orgName}
                  className="h-11 w-11 object-contain flex-shrink-0"
                />
              ) : (
                <span className="grid h-11 w-11 place-items-center rounded-full bg-primary flex-shrink-0">
                  <Droplet className="h-5 w-5 fill-current" />
                </span>
              )}
              <span className="font-display text-lg font-bold leading-tight">{cms.header.orgName}</span>
            </div>
            <div className="space-y-1.5 pr-2">
              <p className="text-sm text-background/70 leading-relaxed">
                {description ||
                  "Setiap nyawa berhak diberi kesempatan kedua. Bergabunglah bersama jaringan respon cepat donor darah terbesar di Indonesia."}
              </p>
              {tagline && (
                <p className="text-sm font-medium text-primary/90 italic">
                  {tagline}
                </p>
              )}
            </div>

            {/* Quick Links */}
            <div className="pt-3 space-y-2.5">
              <Link
                to="/daftar-pendonor"
                className="group flex items-center justify-between rounded-lg bg-background/10 border border-background/10 px-4 py-2.5 text-sm font-semibold text-background hover:bg-background/20 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Droplet className="h-4 w-4 fill-current text-primary" />
                  <span>Daftar Jadi Pendonor</span>
                </div>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/cari-pendonor"
                className="group flex items-center justify-between rounded-lg bg-background/10 border border-background/10 px-4 py-2.5 text-sm font-semibold text-background hover:bg-background/20 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Droplet className="h-4 w-4 fill-current text-primary" />
                  <span>Bantuan Cari Pendonor</span>
                </div>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Column 2: Emergency Response */}
          {responsePhone && responsePhone.trim() !== "" && (
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-background/90 border-b border-background/20 pb-2">
                Badan PDDK
              </h3>
              <div className="space-y-3">
                <a
                  href={formatWaLink(responsePhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 hover:text-primary transition-colors"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-background/10 group-hover:bg-primary/20 transition-colors flex-shrink-0 mt-0.5">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base break-words">{responsePhone}</p>
                    <p className="text-xs text-background/60 mt-0.5">Layanan Pencari Pendonor</p>
                  </div>
                </a>
              </div>
            </div>
          )}

          {/* Column 3: Contact Information */}
          {((email && email.trim() !== "") || (partnershipPhone && partnershipPhone.trim() !== "") || hasAddress) && (
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-background/90 border-b border-background/20 pb-2">
                Hubungi Kami
              </h3>
              <div className="space-y-3">
                {partnershipPhone && partnershipPhone.trim() !== "" && (
                  <a
                    href={formatWaLink(partnershipPhone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 hover:text-primary transition-colors"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-background/10 group-hover:bg-primary/20 transition-colors flex-shrink-0 mt-0.5">
                      <Phone className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base break-words">{partnershipPhone}</p>
                      <p className="text-xs text-background/60 mt-0.5">Kemitraan & Informasi</p>
                    </div>
                  </a>
                )}
                
                {email && email.trim() !== "" && (
                  <a
                    href={`mailto:${email}`}
                    className="group flex items-start gap-3 hover:text-primary transition-colors"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-background/10 group-hover:bg-primary/20 transition-colors flex-shrink-0 mt-0.5">
                      <Mail className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm break-all">{email}</p>
                      <p className="text-xs text-background/60 mt-0.5">Email resmi</p>
                    </div>
                  </a>
                )}

                {/* Address - Desktop & Mobile: below contact */}
                {hasAddress && (
                  <>
                    {hasMapsUrl ? (
                      <a
                        href={addressUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 hover:text-primary transition-colors group"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-background/10 group-hover:bg-primary/20 transition-colors flex-shrink-0 mt-0.5">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-relaxed">{address}</p>
                          <p className="text-xs text-background/60 mt-0.5">Alamat kantor • Klik untuk lihat peta</p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-background/10 flex-shrink-0 mt-0.5">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-relaxed">{address}</p>
                          <p className="text-xs text-background/60 mt-0.5">Alamat kantor</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Column 4: Social Media */}
          {socials.length > 0 && (
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-background/90 border-b border-background/20 pb-2">
                Sosial Media
              </h3>
              <div>
                <p className="text-xs text-background/60 mb-4">Ikuti kami untuk update terbaru</p>
                <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start">
                  {socials.map((item, i) => (
                    <a
                      key={i}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className={`grid h-11 w-11 place-items-center rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-ink ${item.bgColor}`}
                    >
                      <item.Icon className="h-5 w-5 text-white" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Bottom - Copyright */}
        {copyright && (
          <div className="mt-12 pt-8 border-t border-background/10">
            <p className="text-center text-xs text-background/50">
              {copyright}
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}
