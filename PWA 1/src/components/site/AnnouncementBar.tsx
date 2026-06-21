import { useEffect, useRef, useState } from "react";
import { Calendar, FileText, Phone, MapPin, Clock, X } from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import { Modal } from "@/components/admin/Modal";

type Announcement = {
  id: string;
  type: "event" | "urgent";
  title: string;
  description: string;
  date: string;
  time: string;
  place: string;
};

export function AnnouncementBar() {
  const { announcements: storeAnnouncements, cms, isLoaded } = useAdminStore();
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  
  const offsetRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get Badan PDDK phone number from footer
  const responsePhone = cms.footer.responsePhone || "";

  // Derive announcements from admin store — only show active ones
  const announcements: Announcement[] = storeAnnouncements
    .filter((a) => a.active)
    .map((a) => ({
      id: a.id,
      type: a.urgent ? "urgent" : "event",
      title: a.title,
      description: a.description,
      date: a.date,
      time: a.time,
      place: a.place,
    }));

  const count = announcements.length;
  const shouldMarquee = count > 1 && !(count <= 3 && isDesktop);

  const isModalOpen = showRequirements || selectedAnnouncement !== null;

  useEffect(() => {
    if (announcements.length === 0 || !shouldMarquee) {
      if (trackRef.current) {
        trackRef.current.style.transform = "translate3d(0px, 0, 0)";
      }
      return;
    }

    // Completely stop requestAnimationFrame loop when modal is open, paused, or dragging
    // to free up CPU cycles and allow buttery smooth modal entrance animations.
    if (isPaused || isDragging || isModalOpen) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const step = () => {
      offsetRef.current += 0.5; // Reduced speed for smoother mobile experience
      if (trackRef.current) {
        const halfWidth = trackRef.current.scrollWidth / 2;
        if (halfWidth > 0 && offsetRef.current >= halfWidth) {
          offsetRef.current = offsetRef.current % halfWidth;
        }
        trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPaused, isDragging, isModalOpen, announcements.length, shouldMarquee]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const resetResumeTimer = (isTouchInteraction: boolean = false) => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    // Mobile/touch gets 2 seconds, desktop hover gets 0.2 seconds
    const delay = isTouchInteraction ? 2000 : 200;
    resumeTimerRef.current = window.setTimeout(() => {
      setIsPaused(false);
    }, delay);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const handleMouseLeave = () => {
    resetResumeTimer(false); // Desktop hover = 0.2s
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    dragStartOffsetRef.current = offsetRef.current;
    hasDraggedRef.current = false;
    const startX = e.pageX;

    let animationFrameId: number | null = null;
    let latestPageX = startX;

    const handleMouseMove = (ev: MouseEvent) => {
      latestPageX = ev.pageX;

      // Use RAF for smooth rendering
      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(() => {
          const diff = startX - latestPageX;
          if (Math.abs(diff) > 5) hasDraggedRef.current = true;
          offsetRef.current = dragStartOffsetRef.current + diff;
          if (trackRef.current) {
            trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
          }
          animationFrameId = null;
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      // Normalize offset immediately after drag to prevent getting stuck
      if (trackRef.current) {
        const halfWidth = trackRef.current.scrollWidth / 2;
        if (halfWidth > 0) {
          let normalizedOffset = offsetRef.current % halfWidth;
          if (normalizedOffset < 0) {
            normalizedOffset += halfWidth;
          }
          offsetRef.current = normalizedOffset;
          trackRef.current.style.transform = `translate3d(-${normalizedOffset}px, 0, 0)`;
        }
      }

      resetResumeTimer(false); // Desktop drag = 0.2s (treated as hover-like)
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setIsPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    dragStartOffsetRef.current = offsetRef.current;
    hasDraggedRef.current = false;
    const startX = e.touches[0].pageX;

    let animationFrameId: number | null = null;
    let latestPageX = startX;

    const handleTouchMove = (ev: TouchEvent) => {
      latestPageX = ev.touches[0].pageX;

      // Use RAF for smooth rendering
      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(() => {
          const diff = startX - latestPageX;
          if (Math.abs(diff) > 5) hasDraggedRef.current = true;
          offsetRef.current = dragStartOffsetRef.current + diff;
          if (trackRef.current) {
            trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
          }
          animationFrameId = null;
        });
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      // Normalize offset immediately after drag to prevent getting stuck
      if (trackRef.current) {
        const halfWidth = trackRef.current.scrollWidth / 2;
        if (halfWidth > 0) {
          let normalizedOffset = offsetRef.current % halfWidth;
          if (normalizedOffset < 0) {
            normalizedOffset += halfWidth;
          }
          offsetRef.current = normalizedOffset;
          trackRef.current.style.transform = `translate3d(-${normalizedOffset}px, 0, 0)`;
        }
      }

      resetResumeTimer(true); // Mobile touch = 2s
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
  };

  // Early return after all hooks
  if (!isLoaded || announcements.length === 0) return null;

  return (
    <>
      <section aria-label="Papan Pengumuman" className="w-full overflow-hidden py-2 mt-4">
        <div
          ref={trackRef}
          className={`flex gap-2 select-none ${!shouldMarquee ? "justify-center w-full px-4" : ""}`}
          style={{
            transform: "translate3d(0px, 0, 0)",
            willChange: shouldMarquee ? "transform" : "auto",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            perspective: 1000,
            WebkitPerspective: 1000,
          }}
          onMouseDown={shouldMarquee ? handleMouseDown : undefined}
          onTouchStart={shouldMarquee ? handleTouchStart : undefined}
          onMouseEnter={shouldMarquee ? handleMouseEnter : undefined}
          onMouseLeave={shouldMarquee ? handleMouseLeave : undefined}
        >
          {(shouldMarquee ? [...announcements, ...announcements] : announcements).map((a, i) => (
            <Card 
              key={`${a.id}-${i}`} 
              item={a} 
              responsePhone={responsePhone}
              onShowRequirements={() => setShowRequirements(true)}
              onClick={() => {
                if (hasDraggedRef.current) return;
                setSelectedAnnouncement(a);
              }}
            />
          ))}
        </div>
      </section>

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <AnnouncementModal
          item={selectedAnnouncement}
          responsePhone={responsePhone}
          onClose={() => setSelectedAnnouncement(null)}
          onShowRequirements={() => {
            setShowRequirements(true);
          }}
        />
      )}

      {/* Requirements Modal */}
      {showRequirements && (
        <RequirementsModal onClose={() => setShowRequirements(false)} />
      )}
    </>
  );
}

function Card({ 
  item, 
  responsePhone,
  onShowRequirements,
  onClick
}: { 
  item: Announcement;
  responsePhone: string;
  onShowRequirements: () => void;
  onClick: () => void;
}) {
  const urgent = item.type === "urgent";
  
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (responsePhone && responsePhone.trim() !== "") {
      const cleanPhone = responsePhone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  const handleRequirements = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowRequirements();
  };

  const handleAddToCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Format date and time for calendar
    const eventDate = new Date(item.date);
    const startTime = item.time.split('–')[0].trim();
    const endTime = item.time.split('–')[1]?.trim() || startTime;
    
    // Create Google Calendar URL
    const title = encodeURIComponent(item.title);
    const description = encodeURIComponent(item.description);
    const location = encodeURIComponent(item.place);
    
    // Format: YYYYMMDDTHHmmss
    const formatDateTime = (dateStr: string, timeStr: string) => {
      const date = new Date(dateStr);
      const [hours, minutes] = timeStr.replace(/\./g, ':').split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const startDateTime = formatDateTime(item.date, startTime);
    const endDateTime = formatDateTime(item.date, endTime);
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${description}&location=${location}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <article
      onClick={onClick}
      className={[
        "cursor-pointer relative flex w-full max-w-[260px] shrink-0 snap-start flex-col rounded-xl border p-2 transition hover:-translate-y-0.5 hover:scale-[1.02] duration-300",
        urgent 
          ? "border-red-400/60 bg-red-600/20 backdrop-blur-md shadow-lg hover:border-red-400/80 hover:shadow-xl" 
          : "border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/15 hover:border-white/30 shadow-lg",
      ].join(" ")}
      style={{
        willChange: "transform",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 pr-1.5">
          <h3
            className={[
              "truncate font-semibold leading-none text-sm drop-shadow-md",
              urgent ? "text-white font-bold" : "text-white",
            ].join(" ")}
          >
            {item.title}
          </h3>
          <p className={`mt-1 line-clamp-2 text-[11px] leading-snug drop-shadow ${
            urgent ? "text-white/90" : "text-white/85"
          }`}>{item.description}</p>
        </div>
        <div className="flex flex-col gap-1">
          {urgent ? (
            <>
              <IconBtn label="Hubungi Badan PDDK" urgent onClick={handleWhatsApp}>
                <Phone className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Syarat & Ketentuan" onClick={handleRequirements}>
                <FileText className="h-3.5 w-3.5" />
              </IconBtn>
            </>
          ) : (
            <>
              <IconBtn label="Syarat & Ketentuan" onClick={handleRequirements}>
                <FileText className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Tambah ke Kalender" onClick={handleAddToCalendar}>
                <Calendar className="h-3.5 w-3.5" />
              </IconBtn>
            </>
          )}
        </div>
      </div>
      <div className={`mt-1.5 flex flex-col gap-0.5 truncate border-t pt-1.5 text-[10px] drop-shadow ${
        urgent ? "border-red-400/30 text-white/80" : "border-white/20 text-white/75"
      }`}>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {item.date} · {item.time}
        </span>
        <span className="inline-flex items-center gap-1 truncate">
          <MapPin className="h-3 w-3" /> {item.place}
        </span>
      </div>
    </article>
  );
}

function IconBtn({
  children,
  label,
  urgent,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  urgent?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={[
        "grid h-5 w-5 place-items-center rounded-full border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shadow-md",
        urgent
          ? "border-red-300/50 bg-red-500/40 text-white hover:bg-red-500 hover:border-red-300/70"
          : "border-white/25 bg-white/15 text-white/90 hover:border-white/40 hover:bg-white/25 hover:text-white",
      ].join(" ")}
    >
      <div className="scale-75 origin-center flex items-center justify-center">
        {children}
      </div>
    </button>
  );
}

function RequirementsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      subtitle="Syarat & Ketentuan"
      title="Donor Darah"
      onClose={onClose}
      maxWidth="lg"
    >
      <div className="space-y-1.5 pb-1">
        <RequirementItem number={1} text="Usia minimal 17 tahun" />
        <RequirementItem number={2} text="Berat badan minimal 47 kg" />
        <RequirementItem number={3} text="Dalam kondisi sehat jasmani" />
        <RequirementItem number={4} text="Tidur minimal 5 jam" />
        <RequirementItem number={5} text="Tidak sedang dalam masa haid" />
        <RequirementItem number={6} text="Jarak waktu dari donor darah sebelumnya 8 pekan" />
        <RequirementItem number={7} text="Sudah makan 30 menit sebelum mendonor" />
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
        >
          Saya Mengerti
        </button>
      </div>
    </Modal>
  );
}

function RequirementItem({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-background border-2 border-muted hover:border-primary/50 transition shadow-sm">
      <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
        {number}
      </div>
      <p className="flex-1 text-sm text-ink leading-snug">
        {text}
      </p>
    </div>
  );
}

function AnnouncementModal({
  item,
  responsePhone,
  onClose,
  onShowRequirements
}: {
  item: Announcement;
  responsePhone: string;
  onClose: () => void;
  onShowRequirements: () => void;
}) {
  const urgent = item.type === "urgent";

  const handleWhatsApp = () => {
    if (responsePhone && responsePhone.trim() !== "") {
      const cleanPhone = responsePhone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  const handleCalendar = () => {
    const startTime = item.time.split('–')[0].trim();
    const endTime = item.time.split('–')[1]?.trim() || startTime;
    const formatDateTime = (dateStr: string, timeStr: string) => {
      const date = new Date(dateStr);
      const [hours, minutes] = timeStr.replace(/\./g, ':').split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    try {
      const startDateTime = formatDateTime(item.date, startTime);
      const endDateTime = formatDateTime(item.date, endTime);
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(item.title)}&dates=${startDateTime}/${endDateTime}&details=${encodeURIComponent(item.description)}&location=${encodeURIComponent(item.place)}`;
      window.open(url, '_blank');
    } catch (e) {
      console.error("Invalid date/time format", e);
    }
  };

  return (
    <Modal
      subtitle={urgent ? "Pengumuman Penting" : "Pengumuman"}
      title={item.title}
      onClose={onClose}
      maxWidth="md"
      closeOnOutsideClick={true}
    >
      <div className="space-y-4">
        {/* Description */}
        <div className="rounded-xl bg-muted/50 p-4 border border-border">
          <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {item.description}
          </p>
        </div>
        
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 text-sm text-ink p-3 rounded-xl bg-muted/50 border border-border">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{item.date}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-ink p-3 rounded-xl bg-muted/50 border border-border">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{item.time}</span>
          </div>
          <div className="col-span-2 flex items-center gap-2.5 text-sm text-ink p-3 rounded-xl bg-muted/50 border border-border">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="line-clamp-2">{item.place}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onShowRequirements}
            className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-muted transition shadow-sm"
          >
            <FileText className="h-4 w-4 text-primary" />
            Syarat
          </button>
          
          {urgent ? (
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
            >
              <Phone className="h-4 w-4" />
              Hubungi PDDK
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCalendar}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
            >
              <Calendar className="h-4 w-4" />
              Tambah ke Kalender
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
