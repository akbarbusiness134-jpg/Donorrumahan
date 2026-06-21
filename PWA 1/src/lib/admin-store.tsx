import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getSupabaseClient } from "./supabase";
import {
  initialRequests,
  initialDonors,
  initialAnnouncements,
  initialArticles,
  type BloodRequest,
  type Donor,
  type Announcement,
  type Article,
} from "./admin-data";
import { STORAGE_KEYS, MAX_ACTIVE_ANNOUNCEMENTS } from "./constants";

// ─── CMS Types ───────────────────────────────────────────────────────────────

export type NavItem = { id: string; label: string; href: string };

export type CMSHeader = {
  orgName: string;
  tagline: string;
  nav: NavItem[];
  logo?: string;
};

export type CMSHero = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  cta2Label: string;
  cta2Link: string;
  bgImage?: string;
  badgeText?: string;
};

export type CMSAbout = {
  title: string;
  paragraphs: string[];
  photoCaption: string;
  photoPosition: "left" | "center" | "right";
  photo?: string;
  contentHtml?: string;
};

export type CMSFooter = {
  copyright: string;
  tagline: string;
  description: string;
  responsePhone: string;
  partnershipPhone: string;
  email: string;
  address: string;
  addressUrl: string;
  pdpkLogo?: string;
  ig: string;
  fb: string;
  twitter?: string;
  thread?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
};

export type CMSArticles = {
  showDescription: boolean;
  sectionTag?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  availableTags?: string[];
};

export type CMSGallery = {
  showTitle: boolean;
  showDescription: boolean;
  sectionTag?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
};

export type GalleryItem = {
  id: string;
  src: string;
  caption: string;
};

export type FormFieldType = 'text' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date';

export type FormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[]; // for select, radio, checkbox
};

export type DynamicForm = {
  id: string; // URL slug, e.g. "daftar-pendonor"
  title: string;
  description?: string;
  descriptionAlign?: "left" | "center" | "justify";
  imageUrl?: string;
  imagePosition?: "top" | "below-title" | "below-desc" | "bottom";
  imageSize?: "small" | "medium" | "large" | "full";
  imageUrl2?: string;
  imagePosition2?: "top" | "below-title" | "below-desc" | "bottom";
  imageSize2?: "small" | "medium" | "large" | "full";
  imageUrl3?: string;
  imagePosition3?: "top" | "below-title" | "below-desc" | "bottom";
  imageSize3?: "small" | "medium" | "large" | "full";
  googleScriptUrl: string;
  submitLabel: string;
  successMessage: string;
  successImageUrl?: string;
  fields: FormField[];
};

export type CMSDatabase = {
  supabaseUrl: string;
  supabaseKey: string;
};

export type CMSState = {
  header: CMSHeader;
  hero: CMSHero;
  about: CMSAbout;
  footer: CMSFooter;
  articles?: CMSArticles;
  gallery?: CMSGallery;
  forms?: DynamicForm[];
  database?: CMSDatabase;
};

// ─── Store State ─────────────────────────────────────────────────────────────

type StoreState = {
  announcements: Announcement[];
  articles: Article[];
  requests: BloodRequest[];
  donors: Donor[];
  gallery: GalleryItem[];
  cms: CMSState;
};

// ─── Defaults ────────────────────────────────────────────────────────────────

const defaultCMS: CMSState = {
  database: {
    supabaseUrl: "",
    supabaseKey: "",
  },
  header: {
    orgName: "KSR PMI UNHAS",
    tagline: "Respon Cepat Donor",
    nav: [
      { id: "1", label: "Beranda", href: "#beranda" },
      { id: "3", label: "Edukasi", href: "#edukasi" },
      { id: "4", label: "Galeri", href: "#galeri" },
      { id: "5", label: "Kontak", href: "#kontak" },
    ],
  },
  hero: {
    title: "Setiap tetes darah, kehidupan yang terselamatkan.",
    subtitle: "Donor darah setulusnya untuk sesama.",
    ctaLabel: "Daftar Jadi Pendonor",
    ctaLink: "/daftar-pendonor",
    cta2Label: "Bantuan Cari Pendonor",
    cta2Link: "/cari-pendonor",
    badgeText: "Setetes darah, sejuta harapan",
  },
  about: {
    title: "Jaringan kemanusiaan, dibangun sejak 2008.",
    paragraphs: [
      "KSR PMI UNHAS lahir dari satu malam di tahun 2008 ketika sebuah keluarga kesulitan mencari darah O- untuk anak mereka. Sejak itu, kami membangun jaringan pendonor sukarela yang dapat diaktifkan dalam hitungan menit, kapan pun darurat datang.",
      "Hari ini, lebih dari 12.000 pendonor terdaftar tersebar di 34 kota. Kami bekerja sama dengan UTD PMI, rumah sakit, dan komunitas lokal untuk memastikan setiap permintaan darah mendapat respon yang cepat, transparan, dan manusiawi.",
      "Di setiap kegiatan, kami mengutamakan keamanan dan kenyamanan pendonor: pendaftaran yang mudah, pemeriksaan sesuai standar, hingga tindak lanjut setelah donor selesai. Kami juga mendorong kampanye berbagi pengetahuan agar lebih banyak orang berani menjadi pendonor.",
      "Sejak 2008, kami telah menyelesaikan lebih dari 3.000 kasus donor darurat dan menggalakkan donor rutin setiap bulan. Setiap tahun, lebih dari 50.000 permintaan darah ditangani melalui jaringan kami yang terus berkembang.",
    ],
    photoCaption: "Relawan dan pendonor KSR PMI UNHAS di sesi donor darah",
    photoPosition: "center",
  },
  footer: {
    copyright: "© 2026 KSR PMI UNHAS. Seluruh hak cipta dilindungi.",
    tagline: "Dibuat dengan empati di Indonesia.",
    description:
      "Setiap nyawa berhak diberi kesempatan kedua. Bergabunglah bersama jaringan respon cepat donor darah terbesar di Indonesia.",
    responsePhone: "0800-1234-567",
    partnershipPhone: "+62 21 1234 5678",
    email: "halo@sahabatdarah.id",
    address: "",
    addressUrl: "",
    pdpkLogo: "",
    ig: "https://instagram.com/sahabatdarah",
    fb: "https://facebook.com/sahabatdarah",
    twitter: "https://twitter.com/sahabatdarah",
    thread: "https://threads.net/sahabatdarah",
    tiktok: "https://tiktok.com/@sahabatdarah",
    youtube: "https://youtube.com/@sahabatdarah",
    whatsapp: "https://wa.me/628123456789",
  },
  articles: {
    showDescription: true,
    sectionTag: "Publikasi & Dokumentasi",
    sectionTitle: "Edukasi & Informasi",
    sectionSubtitle: "Temukan informasi terbaru, tips kesehatan, dan artikel menarik seputar kegiatan kemanusiaan donor darah.",
    availableTags: ["Edukasi", "Kesehatan", "Cerita", "Mitos", "Panduan"],
  },
  gallery: {
    showTitle: true,
    showDescription: true,
    sectionTag: "Galeri",
    sectionTitle: "Momen Kegiatan & Aksi Sosial",
    sectionSubtitle: "Dokumentasi nyata dedikasi para relawan, pendonor, dan tim medis dalam menyelamatkan nyawa sesama.",
  },
  forms: [],
};

const defaultState: StoreState = {
  announcements: initialAnnouncements,
  articles: initialArticles,
  requests: initialRequests,
  donors: initialDonors,
  gallery: [],
  cms: defaultCMS,
};

// ─── Context ─────────────────────────────────────────────────────────────────

type StoreActions = {
  // Announcements
  setAnnouncements: (items: Announcement[]) => void;
  addAnnouncement: (item: Announcement) => void;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => void;
  removeAnnouncement: (id: string) => void;
  toggleAnnouncementActive: (id: string) => boolean;

  // Articles
  setArticles: (items: Article[]) => void;
  addArticle: (item: Article) => void;
  updateArticle: (id: string, data: Partial<Article>) => void;
  removeArticle: (id: string) => void;

  // Requests
  setRequests: (items: BloodRequest[]) => void;
  updateRequest: (id: string, data: Partial<BloodRequest>) => void;
  removeRequest: (id: string) => void;

  // Donors
  setDonors: (items: Donor[]) => void;
  addDonor: (item: Donor) => void;
  updateDonor: (id: string, data: Partial<Donor>) => void;
  removeDonor: (id: string) => void;

  // Gallery
  setGallery: (items: GalleryItem[]) => void;
  addGalleryItem: (item: GalleryItem) => void;
  updateGalleryItem: (id: string, data: Partial<GalleryItem>) => void;
  removeGalleryItem: (id: string) => void;

  // CMS
  updateCMSHeader: (data: Partial<CMSHeader>) => void;
  updateCMSHero: (data: Partial<CMSHero>) => void;
  updateCMSAbout: (data: Partial<CMSAbout>) => void;
  updateCMSFooter: (data: Partial<CMSFooter>) => void;
  updateCMSArticles: (data: Partial<CMSArticles>) => void;
  updateCMSGallery: (data: Partial<CMSGallery>) => void;
  updateCMSForms: (data: DynamicForm[]) => void;
  updateCMSDatabase: (data: Partial<CMSDatabase>) => void;

  // Reset
  resetAll: () => void;
};

type StoreCtx = StoreState & StoreActions & { isLoaded: boolean };

const Ctx = createContext<StoreCtx | null>(null);

// ─── Persistence helpers ─────────────────────────────────────────────────────

function loadState(): StoreState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.ADMIN_STORE);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle missing fields from older versions
    return {
      announcements: parsed.announcements ?? defaultState.announcements,
      articles: parsed.articles ?? defaultState.articles,
      requests: parsed.requests ?? defaultState.requests,
      donors: parsed.donors ?? defaultState.donors,
      gallery: parsed.gallery ?? defaultState.gallery,
      cms: {
        ...defaultState.cms,
        ...parsed.cms,
        database: { ...defaultState.cms.database, ...parsed.cms?.database },
        header: { ...defaultState.cms.header, ...parsed.cms?.header },
        hero: { ...defaultState.cms.hero, ...parsed.cms?.hero },
        about: { ...defaultState.cms.about, ...parsed.cms?.about },
        footer: { ...defaultState.cms.footer, ...parsed.cms?.footer },
        articles: { ...defaultState.cms.articles, ...parsed.cms?.articles },
        gallery: { ...defaultState.cms.gallery, ...parsed.cms?.gallery },
        forms: parsed.cms?.forms ?? defaultState.cms.forms,
      },
    };
  } catch {
    return defaultState;
  }
}

function saveState(state: StoreState) {
  if (typeof window === "undefined") return;
  try {
    const jsonString = JSON.stringify(state);
    window.localStorage.setItem(STORAGE_KEYS.ADMIN_STORE, jsonString);
    // Only log in development
    if (import.meta.env.DEV) {
      console.log(`✅ Data tersimpan (${(jsonString.length / 1024).toFixed(2)} KB)`);
    }
  } catch (err) {
    console.error("❌ Gagal menyimpan ke localStorage:", err);
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      console.error("LocalStorage penuh! Ukuran data terlalu besar.");
    }
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  // Start with defaultState to prevent hydration mismatches
  const [state, setState] = useState<StoreState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoadedRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Debounced save to localStorage - only save after 500ms of no changes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from localStorage on mount and then from Supabase
  useEffect(() => {
    try {
      const loaded = loadState();
      setState(loaded);
    } catch (err) {
      console.error("Gagal memuat state dari localStorage:", err);
    }

    const fetchSupabaseState = async () => {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('app_state').select('state').eq('id', 1).single();
          if (data && data.state) {
            const parsed = data.state;
            const supabaseState = {
              announcements: parsed.announcements ?? defaultState.announcements,
              articles: parsed.articles ?? defaultState.articles,
              requests: parsed.requests ?? defaultState.requests,
              donors: parsed.donors ?? defaultState.donors,
              gallery: parsed.gallery ?? defaultState.gallery,
              cms: {
                ...defaultState.cms,
                ...parsed.cms,
                database: { ...defaultState.cms.database, ...parsed.cms?.database },
                header: { ...defaultState.cms.header, ...parsed.cms?.header },
                hero: { ...defaultState.cms.hero, ...parsed.cms?.hero },
                about: { ...defaultState.cms.about, ...parsed.cms?.about },
                footer: { ...defaultState.cms.footer, ...parsed.cms?.footer },
                articles: { ...defaultState.cms.articles, ...parsed.cms?.articles },
                gallery: { ...defaultState.cms.gallery, ...parsed.cms?.gallery },
                forms: parsed.cms?.forms ?? defaultState.cms.forms,
              },
            };
            setState(supabaseState);
            // Sync the fresh cloud state to local storage
            saveState(supabaseState);
          }
        } catch (e) {
          console.error("Gagal menarik data dari Supabase:", e);
        }
      }
      setIsLoaded(true);
      isLoadedRef.current = true;
    };

    fetchSupabaseState();
  }, []);

  useEffect(() => {
    // Avoid overwriting localStorage with defaultState before initial load completes
    if (!isLoadedRef.current) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for saving
    saveTimeoutRef.current = setTimeout(async () => {
      saveState(state);
      
      // Push to Supabase if available
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          // Prepare state for DB, avoid storing the database credentials in the cloud state to prevent leaks
          const stateToSave = { ...state };
          if (stateToSave.cms && stateToSave.cms.database) {
            stateToSave.cms = { ...stateToSave.cms, database: { supabaseUrl: "", supabaseKey: "" } };
          }
          await supabase.from('app_state').upsert({ id: 1, state: stateToSave });
        } catch (e) {
          console.error("Gagal mendorong state ke Supabase:", e);
        }
      }
    }, 500); // 500ms debounce

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state]);

  // Helper: update state immutably
  const update = useCallback((fn: (prev: StoreState) => StoreState) => {
    setState((prev) => {
      const next = fn(prev);
      return next;
    });
  }, []);

  // ── Announcement actions ──
  const setAnnouncements = useCallback(
    (items: Announcement[]) => update((s) => ({ ...s, announcements: items })),
    [update],
  );
  const addAnnouncement = useCallback(
    (item: Announcement) => update((s) => ({ ...s, announcements: [item, ...s.announcements] })),
    [update],
  );
  const updateAnnouncement = useCallback(
    (id: string, data: Partial<Announcement>) =>
      update((s) => ({
        ...s,
        announcements: s.announcements.map((a) => (a.id === id ? { ...a, ...data } : a)),
      })),
    [update],
  );
  const removeAnnouncement = useCallback(
    (id: string) =>
      update((s) => ({ ...s, announcements: s.announcements.filter((a) => a.id !== id) })),
    [update],
  );
  const toggleAnnouncementActive = useCallback(
    (id: string): boolean => {
      const s = stateRef.current;
      const target = s.announcements.find((a) => a.id === id);
      if (!target) return false;
      const activeCount = s.announcements.filter((a) => a.active).length;
      if (!target.active && activeCount >= MAX_ACTIVE_ANNOUNCEMENTS) return false;
      update((prev) => ({
        ...prev,
        announcements: prev.announcements.map((a) =>
          a.id === id ? { ...a, active: !a.active } : a,
        ),
      }));
      return true;
    },
    [update],
  );

  // ── Article actions ──
  const setArticles = useCallback(
    (items: Article[]) => update((s) => ({ ...s, articles: items })),
    [update],
  );
  const addArticle = useCallback(
    (item: Article) => update((s) => ({ ...s, articles: [item, ...s.articles] })),
    [update],
  );
  const updateArticle = useCallback(
    (id: string, data: Partial<Article>) =>
      update((s) => ({
        ...s,
        articles: s.articles.map((a) => (a.id === id ? { ...a, ...data } : a)),
      })),
    [update],
  );
  const removeArticle = useCallback(
    (id: string) => update((s) => ({ ...s, articles: s.articles.filter((a) => a.id !== id) })),
    [update],
  );

  // ── Request actions ──
  const setRequests = useCallback(
    (items: BloodRequest[]) => update((s) => ({ ...s, requests: items })),
    [update],
  );
  const updateRequest = useCallback(
    (id: string, data: Partial<BloodRequest>) =>
      update((s) => ({
        ...s,
        requests: s.requests.map((r) => (r.id === id ? { ...r, ...data } : r)),
      })),
    [update],
  );
  const removeRequest = useCallback(
    (id: string) =>
      update((s) => ({ ...s, requests: s.requests.filter((r) => r.id !== id) })),
    [update],
  );

  // ── Donor actions ──
  const setDonors = useCallback(
    (items: Donor[]) => update((s) => ({ ...s, donors: items })),
    [update],
  );
  const addDonor = useCallback(
    (item: Donor) => update((s) => ({ ...s, donors: [item, ...s.donors] })),
    [update],
  );
  const updateDonor = useCallback(
    (id: string, data: Partial<Donor>) =>
      update((s) => ({
        ...s,
        donors: s.donors.map((d) => (d.id === id ? { ...d, ...data } : d)),
      })),
    [update],
  );
  const removeDonor = useCallback(
    (id: string) => update((s) => ({ ...s, donors: s.donors.filter((d) => d.id !== id) })),
    [update],
  );

  // ── Gallery actions ──
  const setGallery = useCallback(
    (items: GalleryItem[]) => update((s) => ({ ...s, gallery: items })),
    [update],
  );
  const addGalleryItem = useCallback(
    (item: GalleryItem) => update((s) => ({ ...s, gallery: [...s.gallery, item] })),
    [update],
  );
  const updateGalleryItem = useCallback(
    (id: string, data: Partial<GalleryItem>) =>
      update((s) => ({
        ...s,
        gallery: s.gallery.map((g) => (g.id === id ? { ...g, ...data } : g)),
      })),
    [update],
  );
  const removeGalleryItem = useCallback(
    (id: string) => update((s) => ({ ...s, gallery: s.gallery.filter((g) => g.id !== id) })),
    [update],
  );

  // ── CMS actions ──
  const updateCMSHeader = useCallback(
    (data: Partial<CMSHeader>) =>
      update((s) => ({ ...s, cms: { ...s.cms, header: { ...s.cms.header, ...data } } })),
    [update],
  );
  const updateCMSHero = useCallback(
    (data: Partial<CMSHero>) =>
      update((s) => ({ ...s, cms: { ...s.cms, hero: { ...s.cms.hero, ...data } } })),
    [update],
  );
  const updateCMSAbout = useCallback(
    (data: Partial<CMSAbout>) =>
      update((s) => ({ ...s, cms: { ...s.cms, about: { ...s.cms.about, ...data } } })),
    [update],
  );
  const updateCMSFooter = useCallback(
    (data: Partial<CMSFooter>) =>
      update((s) => ({ ...s, cms: { ...s.cms, footer: { ...s.cms.footer, ...data } } })),
    [update],
  );
  const updateCMSArticles = useCallback(
    (data: Partial<CMSArticles>) =>
      update((s) => ({ ...s, cms: { ...s.cms, articles: { ...(s.cms.articles || defaultCMS.articles!), ...data } as CMSArticles } })),
    [update],
  );
  const updateCMSGallery = useCallback(
    (data: Partial<CMSGallery>) =>
      update((s) => ({ ...s, cms: { ...s.cms, gallery: { ...(s.cms.gallery || defaultCMS.gallery!), ...data } as CMSGallery } })),
    [update],
  );
  const updateCMSForms = useCallback(
    (data: DynamicForm[]) =>
      update((s) => ({ ...s, cms: { ...s.cms, forms: data } })),
    [update],
  );
  const updateCMSDatabase = useCallback(
    (data: Partial<CMSDatabase>) =>
      update((s) => ({ ...s, cms: { ...s.cms, database: { ...(s.cms.database || defaultCMS.database!), ...data } as CMSDatabase } })),
    [update],
  );

  // ── Reset ──
  const resetAll = useCallback(() => {
    setState(defaultState);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEYS.ADMIN_STORE);
  }, []);

  const value: StoreCtx = {
    ...state,
    isLoaded,
    setAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    removeAnnouncement,
    toggleAnnouncementActive,
    setArticles,
    addArticle,
    updateArticle,
    removeArticle,
    setRequests,
    updateRequest,
    removeRequest,
    setDonors,
    addDonor,
    updateDonor,
    removeDonor,
    setGallery,
    addGalleryItem,
    updateGalleryItem,
    removeGalleryItem,
    updateCMSHeader,
    updateCMSHero,
    updateCMSAbout,
    updateCMSFooter,
    updateCMSArticles,
    updateCMSGallery,
    updateCMSForms,
    updateCMSDatabase,
    resetAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAdminStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminStore must be used within AdminStoreProvider");
  return ctx;
}
