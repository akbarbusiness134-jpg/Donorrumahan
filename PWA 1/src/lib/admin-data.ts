import { DONOR_ELIGIBILITY_DAYS } from "./constants";

export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type BloodRequest = {
  id: string;
  patient: string;
  bloodType: BloodType;
  bags: number;
  hospital: string;
  utd: string;
  kin: string;
  kinPhone: string;
  kinRelation?: string; // Hubungan dengan pasien
  notes?: string; // Catatan tambahan
  urgency?: "normal" | "urgent"; // Tingkat urgensi
  status: "Baru" | "Diproses" | "Selesai";
  pic?: string | string[]; // Support single or multiple PIC
  createdAt: string;
  lastContactedKin?: string; // Timestamp when kin was last contacted
};

export type Donor = {
  id: string;
  name: string;
  bloodType: BloodType;
  age: number;
  weight: number;
  phone: string;
  birthPlace: string;
  birthDate: string;
  lastDonation?: string;
  lastContacted?: string; // Tanggal dan waktu terakhir dihubungi
};

export type Announcement = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  place: string;
  urgent: boolean;
  active: boolean;
};

export type Article = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  tag: string;
  image: string;
  publishedAt: string;
  imagePosition?: "left" | "center" | "right";
  imageCaption?: string;
  isHtml?: boolean;
  author?: string;
};

export const initialRequests: BloodRequest[] = [];
export const initialDonors: Donor[] = [];
export const initialAnnouncements: Announcement[] = [];
export const initialArticles: Article[] = [];

// Eligibility: must wait 12 weeks (84 days) between donations
export function eligibility(donor: Donor) {
  if (!donor.lastDonation) return { eligible: true, days: 0 };
  const last = new Date(donor.lastDonation).getTime();
  const diffDays = Math.floor((Date.now() - last) / 86400000);
  return { eligible: diffDays >= DONOR_ELIGIBILITY_DAYS, days: DONOR_ELIGIBILITY_DAYS - diffDays };
}
