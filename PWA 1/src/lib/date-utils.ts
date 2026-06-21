import { INDONESIAN_MONTHS, INDONESIAN_DAYS } from "./constants";

/**
 * Format date string with Indonesian month name
 * @param dateStr - Date string in format "YYYY-MM-DD HH:mm" or "DD-MM-YYYY HH:mm"
 * @returns Formatted string like "20 Juni 2026 14:30"
 */
export function formatIndonesianDate(dateStr: string): string {
  try {
    const [datePart, timePart] = dateStr.split(" ");

    if (!datePart || !timePart) return dateStr;

    const parts = datePart.split("-");

    // Normalize time format (replace . with :)
    const normalizedTime = timePart.replace(/\./g, ":");

    let day: string, month: string, year: string;

    // Check if format is DD-MM-YYYY or YYYY-MM-DD
    if (parts[0].length === 4) {
      // Format: YYYY-MM-DD
      [year, month, day] = parts;
    } else {
      // Format: DD-MM-YYYY (from toLocaleString)
      [day, month, year] = parts;
    }

    const monthIndex = parseInt(month) - 1;
    if (monthIndex < 0 || monthIndex > 11) return dateStr;

    return `${parseInt(day)} ${INDONESIAN_MONTHS[monthIndex]} ${year} ${normalizedTime}`;
  } catch (error) {
    console.error("Error formatting date:", dateStr, error);
    return dateStr;
  }
}

/**
 * Parse Indonesian date format to Date object
 * @param dateStr - Date string like "20 Juni 2026 14:30"
 * @returns Date object
 */
export function parseIndonesianDate(dateStr: string): Date {
  const bulanMap: Record<string, number> = {
    Januari: 0,
    Februari: 1,
    Maret: 2,
    April: 3,
    Mei: 4,
    Juni: 5,
    Juli: 6,
    Agustus: 7,
    September: 8,
    Oktober: 9,
    November: 10,
    Desember: 11,
  };

  const parts = dateStr.split(" ");
  const day = parseInt(parts[0]);
  const month = bulanMap[parts[1]];
  const year = parseInt(parts[2]);
  const timeParts = parts[3].split(":");
  const hour = parseInt(timeParts[0]);
  const minute = parseInt(timeParts[1]);

  return new Date(year, month, day, hour, minute);
}

/**
 * Get time difference text in Indonesian
 * @param dateStr - Date string to compare with current time
 * @returns Human-readable time difference like "2 jam yang lalu"
 */
export function getTimeDifference(dateStr: string): string {
  try {
    if (!dateStr) return "—";

    let requestDate: Date;

    // Handle different date formats
    if (dateStr.includes("-")) {
      const [datePart, timePart] = dateStr.split(" ");

      if (!datePart || !timePart) {
        return "—";
      }

      const parts = datePart.split("-");
      // Handle both : and . as time separator
      const timeParts = timePart.split(/[:.]/);

      // Check if format is DD-MM-YYYY or YYYY-MM-DD
      if (parts[0].length === 4) {
        // Format: YYYY-MM-DD HH:mm
        const [year, month, day] = parts;
        requestDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(timeParts[0]) || 0,
          parseInt(timeParts[1]) || 0,
        );
      } else {
        // Format: DD-MM-YYYY HH:mm (from form submission)
        const [day, month, year] = parts;
        requestDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(timeParts[0]) || 0,
          parseInt(timeParts[1]) || 0,
        );
      }
    } else {
      // Try parsing other formats
      requestDate = new Date(dateStr);
    }

    // Check if date is valid
    if (isNaN(requestDate.getTime())) {
      console.warn("Invalid date format:", dateStr);
      return "—";
    }

    const now = new Date();

    const diffMs = now.getTime() - requestDate.getTime();

    // If date is in the future, return special message
    if (diffMs < 0) {
      return "Waktu tidak valid";
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Check if it's the same day
    const isSameDay =
      requestDate.getDate() === now.getDate() &&
      requestDate.getMonth() === now.getMonth() &&
      requestDate.getFullYear() === now.getFullYear();

    if (diffMinutes < 1) {
      return "Baru saja";
    } else if (diffMinutes < 60) {
      return `${diffMinutes} menit yang lalu`;
    } else if (isSameDay && diffHours < 24) {
      // If same day, show hours
      return `${diffHours} jam yang lalu`;
    } else if (diffDays === 1) {
      return "1 hari yang lalu";
    } else if (diffDays > 1) {
      return `${diffDays} hari yang lalu`;
    } else {
      return "—";
    }
  } catch (error) {
    console.error("Error parsing date:", dateStr, error);
    return "—";
  }
}

/**
 * Get current timestamp in Indonesian format
 * @returns Formatted timestamp like "20 Juni 2026 14:30"
 */
export function getCurrentIndonesianTimestamp(): string {
  const now = new Date();

  const tanggal = now.getDate();
  const namaBulan = INDONESIAN_MONTHS[now.getMonth()];
  const tahun = now.getFullYear();
  const jam = String(now.getHours()).padStart(2, "0");
  const menit = String(now.getMinutes()).padStart(2, "0");

  return `${tanggal} ${namaBulan} ${tahun} ${jam}:${menit}`;
}

/**
 * Get current date and time info in Indonesian
 * @returns Object with day name, date, month, year, hours, minutes, seconds
 */
export function getCurrentDateTimeInfo() {
  const now = new Date();

  return {
    dayName: INDONESIAN_DAYS[now.getDay()],
    date: now.getDate(),
    monthName: INDONESIAN_MONTHS[now.getMonth()],
    year: now.getFullYear(),
    hours: String(now.getHours()).padStart(2, "0"),
    minutes: String(now.getMinutes()).padStart(2, "0"),
    seconds: String(now.getSeconds()).padStart(2, "0"),
  };
}
