import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, Search, X, Trash2, Eye, Pencil, Plus } from "lucide-react";
import { eligibility, type Donor, type BloodType } from "@/lib/admin-data";
import { useAdminStore } from "@/lib/admin-store";
import { BloodBadge } from "@/components/admin/Badges";
import { Modal } from "@/components/admin/Modal";
import { FormField } from "@/components/admin/FormField";
import { Input, Select } from "@/components/admin/Input";
import { toast } from "sonner";
import { 
  STORAGE_KEYS, 
  ITEMS_PER_PAGE_DONORS, 
  DONOR_ELIGIBILITY_DAYS 
} from "@/lib/constants";
import { getCurrentIndonesianTimestamp, parseIndonesianDate } from "@/lib/date-utils";

const BLOOD_TYPES: (BloodType | "ALL")[] = [
  "ALL",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

type DonorsSearch = {
  bloodType?: BloodType;
};

export const Route = createFileRoute("/admin/donors")({
  component: DonorsPage,
  validateSearch: (search: Record<string, unknown>): DonorsSearch => {
    return {
      bloodType: search.bloodType as BloodType | undefined,
    };
  },
});

const emptyDonor: Donor = {
  id: "",
  name: "",
  bloodType: "A+",
  age: 18,
  weight: 50,
  phone: "",
  birthPlace: "",
  birthDate: "",
};

function DonorsPage() {
  const { donors, addDonor, updateDonor, removeDonor } = useAdminStore();
  const { bloodType } = Route.useSearch();
  
  // Ref for scrolling to results
  const resultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function downloadTemplateCSV() {
    const headers = [
      "Nama", 
      "Tanggal Lahir", 
      "No. WhatsApp", 
      "Alamat", 
      "Mahasiswa Unhas", 
      "Fakultas", 
      "Berat Badan", 
      "Tinggi Badan", 
      "Golongan Darah", 
      "Tanggal Donor Terakhir"
    ];
    const rows = [
      ["Ahmad Faisal", "2002-05-12", '="08123456789"', "Jl. Perintis Kemerdekaan KM 10", "Ya", "Teknik", "68", "175", "A+", "2026-01-15"],
      ["Rina Putri", "1997-11-20", '="08123456790"', "Jl. Sunu No. 12", "Tidak", "", "54", "160", "O-", ""]
    ];
    
    // Excel compatibility: prepending "sep=," without BOM so Excel parses the sep instruction
    // and hides the first line, while using "\r\n" for CRLF Windows line endings.
    const csvContent = "sep=,\r\n" + [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\r\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_pendonor.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Template CSV diunduh!");
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cleanCSVValue = (val: string): string => {
      let cleaned = val.trim();
      
      // Strip surrounding quotes
      cleaned = cleaned.replace(/^["']|["']$/g, "");
      
      // Handle Excel formula format like ="value"
      if (cleaned.startsWith("=")) {
        cleaned = cleaned.substring(1);
        cleaned = cleaned.replace(/^["']|["']$/g, "");
      }
      
      // Handle single quote prefix
      if (cleaned.startsWith("'")) {
        cleaned = cleaned.substring(1);
      }
      
      return cleaned.trim();
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        let lines = text.split(/\r?\n/);
        
        // Skip sep= line if present (used for Excel compatibility)
        if (lines.length > 0 && lines[0].trim().toLowerCase().startsWith("sep=")) {
          lines = lines.slice(1);
        }

        if (lines.length <= 1) {
          toast.error("File CSV kosong atau tidak memiliki data!");
          return;
        }

        // Detect delimiter: check if semicolon or comma is more prevalent in the header row
        const headerLine = lines[0];
        const commaCount = (headerLine.match(/,/g) || []).length;
        const semicolonCount = (headerLine.match(/;/g) || []).length;
        const delimiter = semicolonCount > commaCount ? ";" : ",";

        const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
        const newDonors: Donor[] = [];
        let errorCount = 0;
        const validBloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values: string[] = [];
          let currentVal = "";
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              values.push(cleanCSVValue(currentVal));
              currentVal = "";
            } else {
              currentVal += char;
            }
          }
          values.push(cleanCSVValue(currentVal));

          if (values.length < headers.length) {
            errorCount++;
            continue;
          }

          const donorData: any = {};
          headers.forEach((header, index) => {
            const val = values[index] || "";
            if (header.includes("nama") || header.includes("name")) {
              donorData.name = val;
            } else if (header.includes("golongan") || header.includes("blood")) {
              let bt = val.toUpperCase().replace(/\s+/g, "");
              if (bt === "TIDAKTAHU" || !validBloodTypes.includes(bt)) {
                bt = "O+"; // default/fallback
              }
              donorData.bloodType = bt as BloodType;
            } else if (header.includes("usia") || header.includes("age")) {
              donorData.age = parseInt(val, 10);
            } else if (header.includes("berat") || header.includes("weight")) {
              donorData.weight = parseInt(val, 10);
            } else if (
              header.includes("telepon") || 
              header.includes("phone") || 
              header.includes("hp") || 
              header.includes("wa") || 
              header.includes("whatsapp")
            ) {
              // Normalize phone number: strip non-digits and ensure 62 prefix
              let normalizedPhone = val.replace(/\D/g, "");
              if (normalizedPhone.startsWith("0")) {
                normalizedPhone = "62" + normalizedPhone.slice(1);
              } else if (normalizedPhone && !normalizedPhone.startsWith("62")) {
                normalizedPhone = "62" + normalizedPhone;
              }
              donorData.phone = normalizedPhone;
            } else if (header.includes("tempat") || header.includes("place")) {
              donorData.birthPlace = val;
            } else if (header.includes("donor") || header.includes("donation") || header.includes("riwayat")) {
              donorData.lastDonation = val;
            } else if (header.includes("lahir") || header.includes("date") || header.includes("birth")) {
              donorData.birthDate = val;
            } else if (header.includes("alamat") || header.includes("address")) {
              donorData.address = val;
            } else if (header.includes("mahasiswa") || header.includes("student")) {
              const lowerVal = val.toLowerCase();
              donorData.isUnhasStudent = lowerVal.startsWith("y") || lowerVal === "true" || lowerVal === "1";
            } else if (header.includes("fakultas") || header.includes("faculty")) {
              donorData.faculty = val;
            }
          });

          // Calculate age from birthDate if birthDate is present and age is not explicitly set/valid
          if (donorData.birthDate && (!donorData.age || isNaN(donorData.age))) {
            let birthYear = NaN;
            const parts = donorData.birthDate.split(/[-/]/);
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                birthYear = parseInt(parts[0], 10); // YYYY-MM-DD
              } else if (parts[2].length === 4) {
                birthYear = parseInt(parts[2], 10); // DD/MM/YYYY
              }
            }
            if (isNaN(birthYear)) {
              const parsedDate = new Date(donorData.birthDate);
              if (!isNaN(parsedDate.getTime())) {
                birthYear = parsedDate.getFullYear();
              }
            }
            if (!isNaN(birthYear)) {
              const todayYear = new Date().getFullYear();
              donorData.age = todayYear - birthYear;
            }
          }

          // Map birthPlace matching registration form behavior: Student + Faculty or Address
          if (!donorData.birthPlace) {
            donorData.birthPlace = donorData.isUnhasStudent 
              ? `Mahasiswa UNHAS - ${donorData.faculty || ""}`
              : donorData.address || "";
          }

          if (
            !donorData.name ||
            !donorData.bloodType ||
            !validBloodTypes.includes(donorData.bloodType) ||
            isNaN(donorData.age) ||
            isNaN(donorData.weight) ||
            !donorData.phone
          ) {
            errorCount++;
            continue;
          }

          newDonors.push({
            id: `DON-${Date.now()}-${i}`,
            name: donorData.name,
            bloodType: donorData.bloodType,
            age: donorData.age,
            weight: donorData.weight,
            phone: donorData.phone,
            birthPlace: donorData.birthPlace || "",
            birthDate: donorData.birthDate || "",
            lastDonation: donorData.lastDonation || undefined,
          });
        }

        if (newDonors.length === 0) {
          toast.error("Gagal mengimpor data! Pastikan format kolom sesuai template.");
          return;
        }

        newDonors.forEach(d => addDonor(d));

        if (errorCount > 0) {
          toast.warning("Impor selesai dengan catatan!", {
            description: `Berhasil mengimpor ${newDonors.length} pendonor. Terjadi kesalahan pada ${errorCount} baris data.`,
            duration: 5000,
          });
        } else {
          toast.success("Impor berhasil!", {
            description: `Berhasil mengimpor ${newDonors.length} pendonor ke sistem.`,
            duration: 4000,
          });
        }
      } catch (err) {
        toast.error("Gagal membaca file CSV. Pastikan file tidak rusak.");
      }
      
      if (e.target) {
        e.target.value = "";
      }
    };

    reader.readAsText(file);
  };
  
  // Load filter from localStorage or URL param
  const [filter, setFilter] = useState<BloodType | "ALL">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEYS.DONOR_FILTER);
      return (saved as BloodType | "ALL") || bloodType || "ALL";
    }
    return bloodType || "ALL";
  });
  
  // Load query from localStorage
  const [query, setQuery] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.DONOR_QUERY) || "";
    }
    return "";
  });
  
  const [detail, setDetail] = useState<Donor | null>(null);
  const [editing, setEditing] = useState<Donor | null>(null);
  const [historyOf, setHistoryOf] = useState<Donor | null>(null);
  const [historyDate, setHistoryDate] = useState("");
  
  // Load current index from localStorage on mount
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEYS.DONOR_CURRENT_INDEX);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // Scroll to results after reload/mount
  useEffect(() => {
    // Only scroll if we have a filter active or current index > 0
    if (resultsRef.current && (filter !== "ALL" || currentIndex > 0)) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "start" 
        });
      }, 100);
    }
  }, []); // Run only on mount

  // Handle bloodType from URL parameter
  useEffect(() => {
    if (bloodType && bloodType !== filter) {
      // Set filter from URL parameter
      setFilter(bloodType);
      localStorage.setItem(STORAGE_KEYS.DONOR_FILTER, bloodType);
      // Reset to first item
      setCurrentIndex(0);
      localStorage.setItem(STORAGE_KEYS.DONOR_CURRENT_INDEX, "0");
      // Clear query
      setQuery("");
      localStorage.setItem(STORAGE_KEYS.DONOR_QUERY, "");
      
      // Scroll to results after filter is applied
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "start" 
        });
      }, 200);
    }
  }, [bloodType]);

  // Save filter to localStorage when it changes
  const handleFilterChange = (newFilter: BloodType | "ALL") => {
    setFilter(newFilter);
    localStorage.setItem(STORAGE_KEYS.DONOR_FILTER, newFilter);
    setCurrentIndex(0);
    localStorage.setItem(STORAGE_KEYS.DONOR_CURRENT_INDEX, "0");
  };

  // Save query to localStorage when it changes
  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    localStorage.setItem(STORAGE_KEYS.DONOR_QUERY, newQuery);
    setCurrentIndex(0);
    localStorage.setItem(STORAGE_KEYS.DONOR_CURRENT_INDEX, "0");
  };

  const filtered = donors
    .filter((d) => {
      const matchType = filter === "ALL" || d.bloodType === filter;
      const matchQuery =
        !query || d.name.toLowerCase().includes(query.toLowerCase()) || d.phone.includes(query);
      return matchType && matchQuery;
    })
    .sort((a, b) => {
      // Priority 1: Eligible donors first (bisa donor)
      const aElig = eligibility(a).eligible;
      const bElig = eligibility(b).eligible;
      
      if (aElig && !bElig) return -1;
      if (!aElig && bElig) return 1;
      
      // Priority 2: Among eligible donors, prioritize those not contacted yet
      if (aElig && bElig) {
        const aContacted = !!a.lastContacted;
        const bContacted = !!b.lastContacted;
        
        if (!aContacted && bContacted) return -1;
        if (aContacted && !bContacted) return 1;
        
        // Priority 3: If both contacted or both not contacted, sort by last donation date
        // Those who donated longer ago come first (more ready to donate again)
        if (a.lastDonation && b.lastDonation) {
          return new Date(a.lastDonation).getTime() - new Date(b.lastDonation).getTime();
        }
        if (!a.lastDonation && b.lastDonation) return -1; // Never donated = highest priority
        if (a.lastDonation && !b.lastDonation) return 1;
      }
      
      // Priority 4: Among ineligible donors, sort by days until eligible (closest first)
      if (!aElig && !bElig) {
        const aDays = eligibility(a).days;
        const bDays = eligibility(b).days;
        return aDays - bDays;
      }
      
      return 0;
    });

  // Reset index when filter or query changes
  const prevFilterRef = useState(filter);
  const prevQueryRef = useState(query);
  if (prevFilterRef[0] !== filter || prevQueryRef[0] !== query) {
    prevFilterRef[1](filter);
    prevQueryRef[1](query);
  }

  const currentDonor = filtered[currentIndex];
  const totalDonors = filtered.length;
  
  // Determine if we should show grid view (for "ALL" filter) or single view
  const showGridView = filter === "ALL";
  const itemsPerPage = ITEMS_PER_PAGE_DONORS; // 12 cards per page (4 rows x 3 columns)
  
  // For grid view, calculate pagination
  const totalPages = Math.ceil(totalDonors / itemsPerPage);
  const currentPage = Math.floor(currentIndex / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalDonors);
  const currentPageDonors = filtered.slice(startIndex, endIndex);

  function goToNext() {
    if (showGridView) {
      // Grid view: go to next page
      if (currentPage < totalPages - 1) {
        const nextPageStart = (currentPage + 1) * itemsPerPage;
        setCurrentIndex(nextPageStart);
        localStorage.setItem(STORAGE_KEYS.DONOR_CURRENT_INDEX, nextPageStart.toString());
        window.location.reload();
      }
    } else {
      // Single view: go to next donor
      if (currentIndex < totalDonors - 1) {
        const nextIndex = currentIndex + 1;
        localStorage.setItem(STORAGE_KEYS.DONOR_CURRENT_INDEX, nextIndex.toString());
        window.location.reload();
      }
    }
  }

  function goToPrevious() {
    if (showGridView) {
      // Grid view: go to previous page
      if (currentPage > 0) {
        const prevPageStart = (currentPage - 1) * itemsPerPage;
        setCurrentIndex(prevPageStart);
        localStorage.setItem(STORAGE_KEYS.DONOR_CURRENT_INDEX, prevPageStart.toString());
        window.location.reload();
      }
    } else {
      // Single view: go to previous donor
      if (currentIndex > 0) {
        const prevIndex = currentIndex - 1;
        localStorage.setItem(STORAGE_KEYS.DONOR_CURRENT_INDEX, prevIndex.toString());
        window.location.reload();
      }
    }
  }

  function openWhatsApp(phone: string, name: string, donorId: string, bloodType: string, lastContacted?: string) {
    // Peringatan jika sudah pernah dihubungi
    if (lastContacted) {
      // Hitung selisih hari
      const lastContactedDate = parseIndonesianDate(lastContacted);
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
        `Pendonor ${name} sudah dihubungi ${dayText} pada ${lastContacted}.\n\n` +
        `Apakah Anda yakin ingin menghubungi lagi?`
      );
      if (!confirm) return;
    }
    
    const msg = encodeURIComponent(
      `Permisi, kami dari Badan PDDK - KSR PMI UNHAS sedang membutuhkan pendonor darah ${bloodType}, apakah Anda bersedia?`,
    );
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
    
    // Update lastContacted timestamp
    const timestamp = getCurrentIndonesianTimestamp();
    
    updateDonor(donorId, { lastContacted: timestamp });
    toast.success("Kontak tersimpan!", {
      description: `Waktu kontak dengan ${name} telah dicatat`,
      duration: 2000,
    });
  }

  // Helper function to parse Indonesian date format
  function parseIndonesianDate(dateStr: string): Date {
    return parseIndonesianDate(dateStr);
  }

  function remove(id: string) {
    if (!confirm("Hapus pendonor ini?")) return;
    removeDonor(id);
    toast.success("Pendonor berhasil dihapus!", {
      description: "Data pendonor telah dihapus dari sistem",
      duration: 3000,
    });
  }

  function saveHistory() {
    if (!historyOf || !historyDate) return;
    updateDonor(historyOf.id, { lastDonation: historyDate });
    toast.success("Riwayat donor berhasil disimpan!", {
      description: `Tanggal donor terakhir: ${historyDate}`,
      duration: 3000,
    });
    setHistoryOf(null);
    setHistoryDate("");
  }

  function saveEdit(updated: Donor) {
    if (updated.id) {
      updateDonor(updated.id, updated);
      toast.success("Data pendonor berhasil diperbarui!", {
        description: "Perubahan telah disimpan",
        duration: 3000,
      });
      setDetail(updated);
    } else {
      const newDonor: Donor = {
        ...updated,
        id: `DON-${Date.now()}`,
      };
      addDonor(newDonor);
      toast.success("Pendonor baru berhasil ditambahkan!", {
        description: "Data pendonor telah disimpan ke sistem",
        duration: 3000,
      });
    }
    setEditing(null);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary">
            Manajemen Pencarian Darah
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">Pencarian Pendonor</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Filter berdasarkan golongan darah, hubungi langsung lewat WhatsApp.
          </p>
        </div>
        <div className="relative" ref={addMenuRef}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-background hover:bg-primary transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Tambah Pendonor
          </button>
          
          {showAddMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card p-1.5 shadow-md z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                onClick={() => {
                  setEditing(emptyDonor);
                  setShowAddMenu(false);
                }}
                className="w-full text-left rounded-md px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Tambah Manual
              </button>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAddMenu(false);
                }}
                className="w-full text-left rounded-md px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Impor dari CSV
              </button>
              <button
                onClick={() => {
                  downloadTemplateCSV();
                  setShowAddMenu(false);
                }}
                className="w-full text-left rounded-md px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Download Template CSV
              </button>
            </div>
          )}
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleImportCSV}
            className="hidden"
          />
        </div>
      </header>

      <div className="space-y-4">
        <div className="relative max-w-xl mx-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Cari nama atau nomor..."
            className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-3 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-sm"
          />
        </div>
        
        {/* Filter Golongan Darah - 2 baris, centered */}
        <div className="flex flex-col items-center gap-2">
          {/* Baris pertama: ALL, A+, A-, B+, B- */}
          <div className="flex flex-wrap justify-center gap-2">
            {BLOOD_TYPES.slice(0, 5).map((b) => (
              <button
                key={b}
                onClick={() => handleFilterChange(b)}
                className={[
                  "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]",
                  filter === b
                    ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "border-border bg-card text-foreground/80 hover:border-primary/40 hover:text-primary hover:bg-primary/5 hover:shadow-sm",
                ].join(" ")}
              >
                {b === "ALL" ? "Semua" : b}
              </button>
            ))}
          </div>
          
          {/* Baris kedua: AB+, AB-, O+, O- */}
          <div className="flex flex-wrap justify-center gap-2">
            {BLOOD_TYPES.slice(5).map((b) => (
              <button
                key={b}
                onClick={() => handleFilterChange(b)}
                className={[
                  "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]",
                  filter === b
                    ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "border-border bg-card text-foreground/80 hover:border-primary/40 hover:text-primary hover:bg-primary/5 hover:shadow-sm",
                ].join(" ")}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Donor display - Grid view for "ALL", Single view for specific blood type */}
      <div ref={resultsRef}>
        {totalDonors === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
            Tidak ada pendonor untuk filter ini.
          </div>
        ) : showGridView ? (
          /* Grid View - for "ALL" filter */
          <div className="space-y-4">
          {/* Counter */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Halaman <span className="font-semibold text-foreground">{currentPage + 1}</span> dari{" "}
              <span className="font-semibold text-foreground">{totalPages}</span> · 
              Menampilkan {startIndex + 1}-{endIndex} dari {totalDonors} pendonor
            </p>
          </div>

          {/* Grid Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentPageDonors.map((d) => {
              const elig = eligibility(d);
              return (
                <div key={d.id} className="flex flex-col h-full rounded-xl border border-border bg-card p-3.5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base text-foreground leading-tight truncate mb-0.5">{d.name}</p>
                      <p className="text-xs text-muted-foreground font-medium tracking-wide truncate">{d.phone}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <BloodBadge type={d.bloodType} />
                      <span
                        className={[
                          "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                          elig.eligible
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-50"
                            : "border-amber-200 bg-amber-50 text-amber-700 shadow-amber-50",
                        ].join(" ")}
                      >
                        {elig.eligible ? "Bisa" : `${elig.days} hari`}
                      </span>
                    </div>
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 text-xs border-b border-border/50 pb-3">
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Usia</dt>
                      <dd className="font-semibold text-foreground text-sm">{d.age}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">BB</dt>
                      <dd className="font-semibold text-foreground text-sm">{d.weight} kg</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Donor</dt>
                      <dd className="font-semibold text-foreground text-xs truncate leading-[20px]">{d.lastDonation ?? "—"}</dd>
                    </div>
                  </dl>

                  {d.lastContacted && (
                    <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50/50 px-2 py-1 text-xs text-blue-700 font-medium">
                      <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                      <span className="truncate">Dihubungi: {d.lastContacted}</span>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          if (confirm(`Hapus pendonor ${d.name}?`)) {
                            remove(d.id);
                          }
                        }}
                        title="Hapus"
                        className="grid h-8 w-8 place-items-center rounded-md border border-red-200 bg-red-50 text-red-700 transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-red-100/80"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setHistoryOf(d);
                          setHistoryDate(d.lastDonation ?? "");
                        }}
                        title="Riwayat"
                        className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background text-foreground/70 transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-muted"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDetail(d)}
                        title="Detail"
                        className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background text-foreground/70 transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-muted"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => openWhatsApp(d.phone, d.name, d.id, d.bloodType, d.lastContacted)}
                      title="WhatsApp"
                      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] hover:shadow-sm ${
                        d.lastContacted
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-100 hover:shadow-emerald-200'
                      }`}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={goToPrevious}
              disabled={currentPage === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Sebelumnya
            </button>
            <button
              onClick={goToNext}
              disabled={currentPage >= totalPages - 1}
              className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] hover:bg-primary/95 hover:shadow-sm hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Berikutnya
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      ) : currentDonor ? (
        /* Single View - for specific blood type filter */
        <div className="space-y-4">
          {/* Counter */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Pendonor <span className="font-semibold text-foreground">{currentIndex + 1}</span> dari{" "}
              <span className="font-semibold text-foreground">{totalDonors}</span>
            </p>
          </div>

          {/* Donor Card */}
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-foreground">{currentDonor.name}</p>
                <p className="mt-1 text-sm text-muted-foreground font-medium">{currentDonor.phone}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <BloodBadge type={currentDonor.bloodType} />
                <span
                  className={[
                    "inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm",
                    eligibility(currentDonor).eligible
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-50"
                      : "border-amber-200 bg-amber-50 text-amber-700 shadow-amber-50",
                  ].join(" ")}
                >
                  {eligibility(currentDonor).eligible ? "Bisa Donor" : `Tunggu ${eligibility(currentDonor).days} hari`}
                </span>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 border-b border-border/50 pb-5">
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">Usia</dt>
                <dd className="mt-1 text-lg font-bold text-foreground">{currentDonor.age} tahun</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">Berat Badan</dt>
                <dd className="mt-1 text-lg font-bold text-foreground">{currentDonor.weight} kg</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">Donor Terakhir</dt>
                <dd className="mt-1 text-sm font-bold text-foreground">{currentDonor.lastDonation ?? "Belum pernah"}</dd>
              </div>
            </dl>

            {currentDonor.lastContacted && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm text-blue-700 font-medium">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span>Dihubungi: {currentDonor.lastContacted}</span>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setDetail(currentDonor)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-muted"
              >
                <Eye className="h-4 w-4" />
                Detail
              </button>
              <button
                onClick={() => {
                  setHistoryOf(currentDonor);
                  setHistoryDate(currentDonor.lastDonation ?? "");
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
                Riwayat
              </button>
              <button
                onClick={() => {
                  if (confirm(`Hapus pendonor ${currentDonor.name}?`)) {
                    remove(currentDonor.id);
                    if (currentIndex >= totalDonors - 1) {
                      setCurrentIndex(Math.max(0, currentIndex - 1));
                    }
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-red-100/80"
              >
                <Trash2 className="h-4 w-4" />
                Hapus
              </button>
            </div>

            {/* Tombol WhatsApp - Paling Bawah */}
            <div className="mt-3">
              <button
                onClick={() => openWhatsApp(currentDonor.phone, currentDonor.name, currentDonor.id, currentDonor.bloodType, currentDonor.lastContacted)}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm ${
                  currentDonor.lastContacted
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-100 hover:shadow-emerald-200'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                Hubungi WhatsApp
              </button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Sebelumnya
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex >= totalDonors - 1}
              className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] hover:bg-primary/95 hover:shadow-sm hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Berikutnya
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
      </div>

      {/* Detail Modal */}
      {detail && !editing && (
        <Modal title="Biodata Pendonor" onClose={() => setDetail(null)}>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <DL k="Nama" v={detail.name} />
            <DL k="Golongan Darah" v={detail.bloodType} />
            <DL k="Tempat Lahir" v={detail.birthPlace} />
            <DL k="Tanggal Lahir" v={detail.birthDate} />
            <DL k="Usia" v={`${detail.age} tahun`} />
            <DL k="Berat Badan" v={`${detail.weight} kg`} />
            <DL k="Nomor HP" v={detail.phone} />
            <DL k="Donor Terakhir" v={detail.lastDonation ?? "—"} />
          </dl>
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setDetail(null)}
              className="rounded-lg px-4 py-2.5 text-sm hover:bg-muted"
            >
              Tutup
            </button>
            <button
              onClick={() => setEditing(detail)}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-background hover:bg-primary"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Biodata
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editing && <EditDonor donor={editing} onClose={() => setEditing(null)} onSave={saveEdit} />}

      {/* History Modal */}
      {historyOf && (
        <Modal title="Update Riwayat Donor" onClose={() => setHistoryOf(null)}>
          <p className="text-sm text-muted-foreground">
            Tambahkan catatan tanggal donor terakhir untuk{" "}
            <span className="font-medium text-foreground">{historyOf.name}</span>.
          </p>
          <label className="mt-5 block text-xs font-medium uppercase tracking-wider text-foreground/70">
            Tanggal Donor Terakhir
          </label>
          <input
            type="date"
            value={historyDate}
            onChange={(e) => setHistoryDate(e.target.value)}
            className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setHistoryOf(null)}
              className="rounded-lg px-4 py-2.5 text-sm hover:bg-muted"
            >
              Batal
            </button>
            <button
              onClick={saveHistory}
              disabled={!historyDate}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function IconAction({
  children,
  title,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  variant?: "success" | "danger";
}) {
  const styles =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : variant === "danger"
        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
        : "border-border bg-background text-foreground/70 hover:bg-muted";
  return (
    <button
      onClick={onClick}
      title={title}
      className={["grid h-8 w-8 place-items-center rounded-md border", styles].join(" ")}
    >
      {children}
    </button>
  );
}

function DL({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd className="mt-1 font-medium text-foreground">{v}</dd>
    </div>
  );
}

function EditDonor({
  donor,
  onSave,
  onClose,
}: {
  donor: Donor;
  onSave: (d: Donor) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(donor);
  const upd = (k: keyof Donor, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal title={donor.id ? "Edit Biodata" : "Tambah Pendonor"} onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField label="Nama">
            <Input
              value={form.name}
              onChange={(e) => upd("name", e.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Golongan Darah">
          <Select
            value={form.bloodType}
            onChange={(e) => upd("bloodType", e.target.value as BloodType)}
          >
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Tempat Lahir">
          <Input
            value={form.birthPlace}
            onChange={(e) => upd("birthPlace", e.target.value)}
          />
        </FormField>
        <FormField label="Tanggal Lahir">
          <Input
            type="date"
            value={form.birthDate}
            onChange={(e) => upd("birthDate", e.target.value)}
          />
        </FormField>
        <FormField label="Usia">
          <Input
            type="number"
            value={form.age}
            onChange={(e) => upd("age", +e.target.value)}
          />
        </FormField>
        <FormField label="Berat Badan (kg)">
          <Input
            type="number"
            value={form.weight}
            onChange={(e) => upd("weight", +e.target.value)}
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Nomor HP">
            <Input
              value={form.phone}
              onChange={(e) => upd("phone", e.target.value)}
            />
          </FormField>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm hover:bg-muted">
          Batal
        </button>
        <button
          onClick={() => onSave(form)}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Simpan
        </button>
      </div>
    </Modal>
  );
}
