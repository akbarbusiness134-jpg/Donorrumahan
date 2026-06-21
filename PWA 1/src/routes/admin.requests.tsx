import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Search, X, UserCheck, Droplet, Copy, Check, FileText, Trash2 } from "lucide-react";
import { type BloodRequest, type BloodType } from "@/lib/admin-data";
import { useAdminStore } from "@/lib/admin-store";
import { BloodBadge, StatusBadge } from "@/components/admin/Badges";
import { Modal } from "@/components/admin/Modal";
import { toast } from "sonner";
import { 
  formatIndonesianDate, 
  getTimeDifference, 
  getCurrentIndonesianTimestamp,
  parseIndonesianDate 
} from "@/lib/date-utils";

export const Route = createFileRoute("/admin/requests")({
  component: RequestsPage,
});

function RequestsPage() {
  const navigate = useNavigate();
  const { requests, updateRequest, removeRequest } = useAdminStore();
  const [picModal, setPicModal] = useState<BloodRequest | null>(null);
  const [detailModal, setDetailModal] = useState<BloodRequest | null>(null);
  const [picName, setPicName] = useState("");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // Helper function to get PIC array
  const getPicArray = (pic?: string | string[]): string[] => {
    if (!pic) return [];
    return Array.isArray(pic) ? pic : [pic];
  };

  // Helper function to check if has PIC
  const hasPic = (pic?: string | string[]): boolean => {
    const picArray = getPicArray(pic);
    return picArray.length > 0;
  };

  const filtered = requests
    .filter(
      (r) =>
        r.patient.toLowerCase().includes(query.toLowerCase()) ||
        r.hospital.toLowerCase().includes(query.toLowerCase()) ||
        r.bloodType.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      const aDone = a.status === "Selesai" ? 1 : 0;
      const bDone = b.status === "Selesai" ? 1 : 0;
      return aDone - bDone;
    });

  function openWhatsApp(phone: string, patient: string, requestId: string, lastContactedKin?: string) {
    // Peringatan jika sudah pernah dihubungi
    if (lastContactedKin) {
      // Hitung selisih hari
      const lastContactedDate = parseIndonesianDate(lastContactedKin);
      const now = new Date();
      const diffTime = now.getTime() - lastContactedDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let dayText = "";
      if (diffDays === 0) {
        dayText = "hari ini";
      } else if (diffDays === 1) {
        dayText = "1 hari yang lalu";
      } else {
        dayText = `${diffDays} hari yang lalu`;
      }
      
      const confirm = window.confirm(
        `Keluarga pasien ${patient} sudah dihubungi ${dayText} pada ${lastContactedKin}.\n\n` +
        `Apakah Anda yakin ingin menghubungi lagi?`
      );
      if (!confirm) return;
    }
    
    // Get request details
    const request = requests.find(r => r.id === requestId);
    if (!request) return;
    
    // Build detailed message
    const message = `Permisi, kami dari Badan PDDK - KSR PMI UNHAS, ingin mengonfirmasi terkait Permintaan Bantuan Cari Pendonor:

Nama Pasien: ${request.patient}
Golongan Darah: ${request.bloodType}
Jumlah Kantong: ${request.bags} kantong
Tempat Transfusi: ${request.utd}
Rumah Pasien Dirawat: ${request.hospital}

Nama Keluarga/Kerabat: ${request.kin}
Status Hubungan dengan Pasien: ${request.kinRelation || '(belum tercatat)'}

Apakah data tersebut sudah benar?`;
    
    const msg = encodeURIComponent(message);
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
    
    // Update lastContactedKin timestamp
    const timestamp = getCurrentIndonesianTimestamp();
    
    updateRequest(requestId, { lastContactedKin: timestamp });
    toast.success("Kontak tersimpan!", {
      description: `Waktu kontak dengan keluarga ${patient} telah dicatat`,
      duration: 2000,
    });
  }

  function searchDonorByBlood(bloodType: string) {
    navigate({ 
      to: "/admin/donors",
      search: { bloodType: bloodType as BloodType }
    });
  }

  // Robust clipboard copy fallback
  function copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful ? Promise.resolve() : Promise.reject(new Error("Gagal menyalin data"));
      } catch (err) {
        document.body.removeChild(textArea);
        return Promise.reject(err);
      }
    }
  }

  function copyRequestDetails(request: BloodRequest) {
    const text = `INFORMASI PERMINTAAN DONOR DARAH

Nama Pasien: ${request.patient}
Golongan Darah: ${request.bloodType}
Jumlah Permintaan: ${request.bags} kantong
Tempat Transfusi: ${request.utd}
Tempat Pasien Dirawat: ${request.hospital}
Nama Keluarga: ${request.kin}
Status Hubungan: (belum tercatat)
No. Telepon Keluarga: ${request.kinPhone}

Tanggal Permintaan: ${request.createdAt}`;

    copyToClipboard(text).then(() => {
      setCopied(true);
      toast.success("Data berhasil disalin!", {
        description: "Informasi permintaan telah disalin ke clipboard",
      });
      
      // Auto close modal after copy
      setTimeout(() => {
        setDetailModal(null);
        setCopied(false);
      }, 500); // Close after 500ms
      
    }).catch(() => {
      toast.error("Gagal menyalin data");
    });
  }

  function submitPic() {
    if (!picModal || !picName.trim()) return;
    
    // Get fresh data from store to check for race condition
    const currentRequest = requests.find(r => r.id === picModal.id);
    if (!currentRequest) {
      toast.error("Permintaan tidak ditemukan!");
      setPicModal(null);
      setPicName("");
      return;
    }
    
    const currentPics = getPicArray(currentRequest.pic);
    const newPicName = picName.trim();
    
    // Check if name already exists
    if (currentPics.includes(newPicName)) {
      toast.error("Nama sudah ada!", {
        description: `${newPicName} sudah terdaftar sebagai penanggung jawab`,
        duration: 3000,
      });
      return;
    }
    
    // Check if this was a race condition (someone else added PIC first)
    const wasEmpty = !hasPic(picModal.pic);
    const isNowNotEmpty = hasPic(currentRequest.pic);
    
    if (wasEmpty && isNowNotEmpty) {
      // Race condition: someone else became PIC first
      const existingPics = getPicArray(currentRequest.pic);
      toast.warning("Oops! Ada yang lebih cepat!", {
        description: `${existingPics.join(", ")} sudah menjadi penanggung jawab. Anda bisa "Ikut Bantu" sekarang.`,
        duration: 5000,
      });
      setPicModal(null);
      setPicName("");
      return;
    }
    
    const updatedPics = [...currentPics, newPicName];
    
    updateRequest(picModal.id, { 
      status: "Diproses", 
      pic: updatedPics 
    });
    
    const message = wasEmpty 
      ? "Anda telah menjadi penanggung jawab!"
      : "Anda telah ikut membantu!";
    
    const description = wasEmpty
      ? `Permintaan ${picModal.patient} sekarang ditangani oleh Anda`
      : `Anda bergabung dengan ${currentPics.join(", ")} untuk membantu ${picModal.patient}`;
    
    toast.success(message, {
      description: description,
      duration: 3000,
    });
    
    setPicModal(null);
    setPicName("");
  }

  function markAsDone(request: BloodRequest) {
    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menandai permintaan pencarian donor untuk pasien "${request.patient}" sebagai selesai?\n\n` +
      `Tindakan ini akan mengubah status permintaan menjadi "Selesai".`
    );
    if (!isConfirmed) return;

    updateRequest(request.id, { status: "Selesai" });
    toast.success("Permintaan selesai!", {
      description: `Permintaan untuk pasien ${request.patient} telah diselesaikan`,
      duration: 3000,
    });
  }

  function handleDeleteRequest(request: BloodRequest) {
    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus permintaan bantuan atas nama pasien "${request.patient}"?\n\n` +
      `Tindakan ini permanen dan tidak dapat dibatalkan.`
    );
    if (!isConfirmed) return;

    removeRequest(request.id);
    toast.success("Permintaan dihapus!", {
      description: `Permintaan untuk pasien ${request.patient} telah dihapus dari sistem`,
      duration: 3000,
    });
  }

  function showDoneWarning() {
    toast.info("Permintaan ini sudah selesai", {
      description: "Aksi tetap bisa dilakukan sebagai referensi",
      duration: 2500,
    });
  }

  function showDoneBlock() {
    toast.warning("Permintaan sudah selesai", {
      description: "Tidak dapat menambah penanggung jawab pada permintaan yang sudah selesai",
      duration: 3000,
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
      <header className="grid gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary">
            Manajemen Pencarian Darah
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">Permintaan Masuk</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tangani setiap permintaan secara cepat dan tercatat penanggung jawabnya.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pasien, RS, golongan..."
            className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </header>

      {/* Mobile cards */}
      <ul className="grid gap-4 md:hidden">
        {filtered.map((r) => {
          const statusStyles: Record<string, string> = {
            Baru: "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-700/50",
            Diproses: "bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-blue-300 dark:border-blue-700/50",
            Selesai: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/50",
          };
          const currentStatusStyle = statusStyles[r.status] ?? "bg-muted dark:bg-muted/50 text-muted-foreground border-border";

          return (
            <li key={r.id} className="relative flex flex-col h-full rounded-2xl border border-border bg-card overflow-hidden shadow-card">
              {/* Status Bar along the top edge */}
              <div className={`relative px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider border-b ${currentStatusStyle}`}>
                Status: {r.status}
                {r.status === "Selesai" && (
                  <button
                    onClick={() => handleDeleteRequest(r)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Hapus Permintaan"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              
              <div className="p-3 flex flex-col flex-1">
                {/* Time difference below the status line */}
                <div className="flex justify-between items-center text-[11px] text-muted-foreground border-b border-border/40 pb-1.5 mb-2">
                  <span>{r.id} · {formatIndonesianDate(r.createdAt)}</span>
                  <span className="text-primary font-medium">{getTimeDifference(r.createdAt)}</span>
                </div>
                
                {/* Header: Patient Name + Badges */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[15px] text-foreground leading-tight">{r.patient}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-center text-right">
                    <span className="font-mono text-2xl font-black text-primary select-none leading-none mb-0.5">
                      {r.bloodType}
                    </span>
                    <span className="font-sans text-xs font-extrabold text-foreground/80 select-none leading-none">
                      {r.bags} Kantung
                    </span>
                  </div>
                </div>

            {/* Info Grid - Horizontal compact format */}
            <dl className="grid grid-cols-[85px_1fr] gap-x-2 gap-y-1 text-xs mb-2 pb-2 border-b border-border/40">
              <dt className="text-muted-foreground font-medium">UTD/UDD</dt>
              <dd className="font-semibold text-foreground truncate">{r.utd}</dd>

              <dt className="text-muted-foreground font-medium">Rumah Sakit</dt>
              <dd className="font-semibold text-foreground truncate">{r.hospital}</dd>

              <dt className="text-muted-foreground font-medium">Kerabat</dt>
              <dd className="font-semibold text-foreground truncate">{r.kin}</dd>

              <dt className="text-muted-foreground font-medium">No. Telepon</dt>
              <dd className="font-semibold text-foreground font-mono truncate">{r.kinPhone}</dd>

              <dt className="text-muted-foreground font-medium">Hubungi</dt>
              <dd className={`font-semibold ${r.lastContactedKin ? 'text-emerald-700 dark:text-emerald-400' : 'italic text-muted-foreground font-normal'}`}>
                {r.lastContactedKin || 'Belum dihubungi'}
              </dd>
            </dl>

            {/* PIC Info - Horizontal compact format */}
            <div className="mb-2.5 flex items-center gap-2 text-xs min-h-[22px]">
              <span className="text-muted-foreground font-medium shrink-0">PJ:</span>
              {hasPic(r.pic) ? (
                <div className="flex flex-wrap gap-1">
                  {getPicArray(r.pic).map((name, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                        idx === 0
                          ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400'
                          : 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-200/30 dark:text-blue-400'
                      }`}
                    >
                      <UserCheck className={`h-2.5 w-2.5 ${idx === 0 ? 'text-red-600' : 'text-blue-600'}`} />
                      <span>{name}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground italic font-normal">Belum ada</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-auto grid grid-cols-1 gap-1">
              {/* Proses / Ikut Bantu — disabled + warning when Selesai */}
              <button
                onClick={() => {
                  if (r.status === "Selesai") { showDoneBlock(); return; }
                  setPicModal(r);
                }}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  r.status === "Selesai"
                    ? 'border-border bg-muted/40 text-muted-foreground cursor-not-allowed opacity-60'
                    : 'border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                {r.status === "Selesai" ? "Permintaan Selesai" : hasPic(r.pic) ? "Ikut Bantu" : "Proses"}
              </button>

              {/* Cari Darah & WhatsApp */}
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    if (!hasPic(r.pic)) return;
                    if (r.status === "Selesai") {
                      const ok = window.confirm(
                        `Permintaan pasien "${r.patient}" sudah selesai.\n\nApakah Anda yakin ingin melanjutkan pencarian donor?`
                      );
                      if (!ok) return;
                    }
                    searchDonorByBlood(r.bloodType);
                  }}
                  disabled={!hasPic(r.pic)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    !hasPic(r.pic)
                      ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                      : r.status === "Selesai"
                        ? 'bg-primary/30 text-primary/60 hover:bg-primary/40'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  <Droplet className="h-3.5 w-3.5" /> Cari {r.bloodType}
                </button>
                <button
                  onClick={() => {
                    if (!hasPic(r.pic)) return;
                    if (r.status === "Selesai") showDoneWarning();
                    openWhatsApp(r.kinPhone, r.patient, r.id, r.lastContactedKin);
                  }}
                  disabled={!hasPic(r.pic)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                    !hasPic(r.pic)
                      ? 'border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                      : r.lastContactedKin
                        ? 'border-emerald-300/50 bg-emerald-100/50 text-emerald-600/70 hover:bg-emerald-100/70'
                        : 'border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </button>
              </div>

              {/* Copy Data & Selesai */}
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    if (!hasPic(r.pic)) return;
                    if (r.status === "Selesai") {
                      const ok = window.confirm(
                        `Permintaan pasien "${r.patient}" sudah selesai.\n\nApakah Anda yakin ingin menyalin data permintaan ini?`
                      );
                      if (!ok) return;
                    }
                    setDetailModal(r);
                  }}
                  disabled={!hasPic(r.pic)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                    !hasPic(r.pic)
                      ? 'border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                      : r.status === "Selesai"
                        ? 'border-border/50 bg-muted/40 text-muted-foreground hover:bg-muted/60'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" /> Copy Data
                </button>
                {r.status !== "Selesai" ? (
                  <button
                    onClick={() => hasPic(r.pic) && markAsDone(r)}
                    disabled={!hasPic(r.pic)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold text-white transition-colors ${
                      hasPic(r.pic)
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" /> Selesai
                  </button>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1.5 text-[11px] font-semibold text-emerald-800 cursor-not-allowed"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Selesai
                  </button>
                )}
              </div>


              </div>
            </div>
          </li>
        );
      })}
        {filtered.length === 0 && (
          <li className="rounded-2xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
            Tidak ada permintaan ditemukan.
          </li>
        )}
      </ul>

      {/* Desktop cards - same layout as mobile */}
      <ul className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => {
          const statusStyles: Record<string, string> = {
            Baru: "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-700/50",
            Diproses: "bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-blue-300 dark:border-blue-700/50",
            Selesai: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/50",
          };
          const currentStatusStyle = statusStyles[r.status] ?? "bg-muted dark:bg-muted/50 text-muted-foreground border-border";

          return (
            <li key={r.id} className="relative flex flex-col h-full rounded-2xl border border-border bg-card overflow-hidden shadow-card">
              {/* Status Bar along the top edge */}
              <div className={`relative px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider border-b ${currentStatusStyle}`}>
                Status: {r.status}
                {r.status === "Selesai" && (
                  <button
                    onClick={() => handleDeleteRequest(r)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Hapus Permintaan"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              
              <div className="p-3 flex flex-col flex-1">
                {/* Time difference below the status line */}
                <div className="flex justify-between items-center text-[11px] text-muted-foreground border-b border-border/40 pb-1.5 mb-2">
                  <span>{r.id} · {formatIndonesianDate(r.createdAt)}</span>
                  <span className="text-primary font-medium">{getTimeDifference(r.createdAt)}</span>
                </div>
                
                {/* Header: Patient Name + Badges */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[15px] text-foreground leading-tight">{r.patient}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-center text-right">
                    <span className="font-mono text-2xl font-black text-primary select-none leading-none mb-0.5">
                      {r.bloodType}
                    </span>
                    <span className="font-sans text-xs font-extrabold text-foreground/80 select-none leading-none">
                      {r.bags} Kantung
                    </span>
                  </div>
                </div>

            {/* Info Grid - Horizontal compact format */}
            <dl className="grid grid-cols-[85px_1fr] gap-x-2 gap-y-1 text-xs mb-2 pb-2 border-b border-border/40">
              <dt className="text-muted-foreground font-medium">UTD/UDD</dt>
              <dd className="font-semibold text-foreground truncate">{r.utd}</dd>

              <dt className="text-muted-foreground font-medium">Rumah Sakit</dt>
              <dd className="font-semibold text-foreground truncate">{r.hospital}</dd>

              <dt className="text-muted-foreground font-medium">Kerabat</dt>
              <dd className="font-semibold text-foreground truncate">{r.kin}</dd>

              <dt className="text-muted-foreground font-medium">No. Telepon</dt>
              <dd className="font-semibold text-foreground font-mono truncate">{r.kinPhone}</dd>

              <dt className="text-muted-foreground font-medium">Hubungi</dt>
              <dd className={`font-semibold ${r.lastContactedKin ? 'text-emerald-700 dark:text-emerald-400' : 'italic text-muted-foreground font-normal'}`}>
                {r.lastContactedKin || 'Belum dihubungi'}
              </dd>
            </dl>

            {/* PIC Info - Horizontal compact format */}
            <div className="mb-2.5 flex items-center gap-2 text-xs min-h-[22px]">
              <span className="text-muted-foreground font-medium shrink-0">PJ:</span>
              {hasPic(r.pic) ? (
                <div className="flex flex-wrap gap-1">
                  {getPicArray(r.pic).map((name, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                        idx === 0
                          ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400'
                          : 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-200/30 dark:text-blue-400'
                      }`}
                    >
                      <UserCheck className={`h-2.5 w-2.5 ${idx === 0 ? 'text-red-600' : 'text-blue-600'}`} />
                      <span>{name}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground italic font-normal">Belum ada</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-auto grid grid-cols-1 gap-1">
              {/* Proses / Ikut Bantu — disabled + warning when Selesai */}
              <button
                onClick={() => {
                  if (r.status === "Selesai") { showDoneBlock(); return; }
                  setPicModal(r);
                }}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  r.status === "Selesai"
                    ? 'border-border bg-muted/40 text-muted-foreground cursor-not-allowed opacity-60'
                    : 'border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                {r.status === "Selesai" ? "Permintaan Selesai" : hasPic(r.pic) ? "Ikut Bantu" : "Proses"}
              </button>

              {/* Cari Darah & WhatsApp */}
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    if (!hasPic(r.pic)) return;
                    if (r.status === "Selesai") {
                      const ok = window.confirm(
                        `Permintaan pasien "${r.patient}" sudah selesai.\n\nApakah Anda yakin ingin melanjutkan pencarian donor?`
                      );
                      if (!ok) return;
                    }
                    searchDonorByBlood(r.bloodType);
                  }}
                  disabled={!hasPic(r.pic)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    !hasPic(r.pic)
                      ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                      : r.status === "Selesai"
                        ? 'bg-primary/30 text-primary/60 hover:bg-primary/40'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  <Droplet className="h-3.5 w-3.5" /> Cari {r.bloodType}
                </button>
                <button
                  onClick={() => {
                    if (!hasPic(r.pic)) return;
                    if (r.status === "Selesai") showDoneWarning();
                    openWhatsApp(r.kinPhone, r.patient, r.id, r.lastContactedKin);
                  }}
                  disabled={!hasPic(r.pic)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                    !hasPic(r.pic)
                      ? 'border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                      : r.lastContactedKin
                        ? 'border-emerald-300/50 bg-emerald-100/50 text-emerald-600/70 hover:bg-emerald-100/70'
                        : 'border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </button>
              </div>

              {/* Copy Data & Selesai */}
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    if (!hasPic(r.pic)) return;
                    if (r.status === "Selesai") {
                      const ok = window.confirm(
                        `Permintaan pasien "${r.patient}" sudah selesai.\n\nApakah Anda yakin ingin menyalin data permintaan ini?`
                      );
                      if (!ok) return;
                    }
                    setDetailModal(r);
                  }}
                  disabled={!hasPic(r.pic)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                    !hasPic(r.pic)
                      ? 'border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                      : r.status === "Selesai"
                        ? 'border-border/50 bg-muted/40 text-muted-foreground hover:bg-muted/60'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" /> Copy Data
                </button>
                {r.status !== "Selesai" ? (
                  <button
                    onClick={() => hasPic(r.pic) && markAsDone(r)}
                    disabled={!hasPic(r.pic)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold text-white transition-colors ${
                      hasPic(r.pic)
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" /> Selesai
                  </button>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1.5 text-[11px] font-semibold text-emerald-800 cursor-not-allowed"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Selesai
                  </button>
                )}
              </div>


              </div>
            </div>
          </li>
        );
      })}
        {filtered.length === 0 && (
          <li className="col-span-full rounded-2xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
            Tidak ada permintaan ditemukan.
          </li>
        )}
      </ul>

      {/* PIC Modal */}
      {picModal && (
        <Modal
          title="Masukkan Nama Anda"
          subtitle={hasPic(picModal.pic) ? "Ikut Bantu" : "Proses Permintaan"}
          onClose={() => {
            setPicModal(null);
            setPicName("");
          }}
          maxWidth="md"
        >
          <p className="text-sm text-muted-foreground">
            {hasPic(picModal.pic) 
              ? "Masukkan nama Anda untuk ikut membantu pencarian donor"
              : "Masukkan nama Anda sebagai penanggung jawab"
            } untuk permintaan{" "}
            <span className="font-medium text-foreground">{picModal.patient}</span> (
            {picModal.bloodType} · {picModal.bags} kantung).
          </p>
          
          {/* Warning for race condition */}
          {!hasPic(picModal.pic) && (
            <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Info:</span> Jika ada rekan lain yang sedang mengisi nama untuk permintaan ini, 
                sistem akan menerima nama yang masuk terlebih dahulu sebagai penanggung jawab utama.
              </p>
            </div>
          )}
          
          {/* Existing PICs */}
          {hasPic(picModal.pic) && (
            <div className="mt-4 p-3 bg-muted/50 border border-border rounded-lg">
              <p className="text-xs font-medium text-foreground mb-2">Penanggung Jawab:</p>
              <div className="flex flex-wrap gap-1.5">
                {getPicArray(picModal.pic).map((name, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                      idx === 0
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : 'bg-blue-50 border-blue-200 text-blue-900'
                    }`}
                  >
                    <UserCheck className={`h-3 w-3 ${idx === 0 ? 'text-red-600' : 'text-blue-600'}`} />
                    <span>{name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <label className="mt-5 block text-xs font-medium uppercase tracking-wider text-foreground/70">
            Nama Anda
          </label>
          <input
            autoFocus
            value={picName}
            onChange={(e) => setPicName(e.target.value)}
            placeholder="Contoh: Rina Putri"
            className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && picName.trim()) {
                submitPic();
              }
            }}
          />
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => {
                setPicModal(null);
                setPicName("");
              }}
              className="rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
            >
              Batal
            </button>
            <button
              onClick={submitPic}
              disabled={!picName.trim()}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:bg-primary/90"
            >
              {hasPic(picModal.pic) ? "Ikut Bantu" : "Proses"}
            </button>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <Modal
          title="Informasi Lengkap"
          subtitle="Detail Permintaan"
          onClose={() => {
            setDetailModal(null);
            setCopied(false);
          }}
          maxWidth="lg"
        >
          <div className="bg-muted/30 rounded-lg p-4 space-y-3 text-sm">
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-muted-foreground">Nama Pasien:</span>
              <span className="font-medium text-foreground">{detailModal.patient}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-muted-foreground">Golongan Darah:</span>
              <span className="font-medium text-foreground">{detailModal.bloodType}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-muted-foreground">Jumlah Permintaan:</span>
              <span className="font-medium text-foreground">{detailModal.bags} kantong</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-muted-foreground">Tempat Transfusi:</span>
              <span className="font-medium text-foreground">{detailModal.utd}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-muted-foreground">Tempat Pasien Dirawat:</span>
              <span className="font-medium text-foreground">{detailModal.hospital}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-muted-foreground">Nama Keluarga:</span>
              <span className="font-medium text-foreground">{detailModal.kin}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-muted-foreground">Status Hubungan:</span>
              <span className="font-medium text-foreground italic text-muted-foreground">(belum tercatat)</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-muted-foreground">No. Telepon:</span>
              <span className="font-medium text-foreground font-mono">{detailModal.kinPhone}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground">
            <p><span className="font-medium">ID:</span> {detailModal.id}</p>
            <p className="mt-1"><span className="font-medium">Tanggal:</span> {formatIndonesianDate(detailModal.createdAt)} ({getTimeDifference(detailModal.createdAt)})</p>
            <p className="mt-1"><span className="font-medium">Status:</span> {detailModal.status}</p>
            {hasPic(detailModal.pic) && (
              <div className="mt-2">
                <p className="font-medium mb-1">Penanggung Jawab:</p>
                <div className="flex flex-wrap gap-1">
                  {getPicArray(detailModal.pic).map((name, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${
                        idx === 0
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-blue-50 border-blue-200 text-blue-800'
                      }`}
                    >
                      <UserCheck className={`h-3 w-3 ${idx === 0 ? 'text-red-600' : 'text-blue-600'}`} />
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => {
                setDetailModal(null);
                setCopied(false);
              }}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
            >
              Tutup
            </button>
            <button
              onClick={() => copyRequestDetails(detailModal)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Tersalin!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy Data
                </>
              )}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
