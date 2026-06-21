// Storage Keys
export const STORAGE_KEYS = {
  ADMIN_USER: "sd_admin_user",
  ADMIN_STORE: "sd_admin_store",
  DONOR_FILTER: "donor_filter",
  DONOR_QUERY: "donor_query",
  DONOR_CURRENT_INDEX: "donor_current_index",
} as const;

// Business Constants
export const DONOR_ELIGIBILITY_DAYS = 84; // Must wait 84 days (12 weeks) between donations
export const MAX_ACTIVE_ANNOUNCEMENTS = 5;
export const ITEMS_PER_PAGE_DONORS = 12; // 4 rows x 3 columns

// Indonesian Month Names
export const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

// Indonesian Day Names
export const INDONESIAN_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;
