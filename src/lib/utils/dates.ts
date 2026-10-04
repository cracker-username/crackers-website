/**
 * Date and Timezone Utilities
 * All business rules, cutoff times, counter years, and customer countdowns evaluate in Asia/Kolkata (IST: UTC+05:30).
 */

const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Get current 2-digit IST year, e.g. "26" for 2026
 */
export function getIstCurrentYearShort(): string {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    year: "2-digit",
  });
  return formatter.format(new Date());
}

/**
 * Format a Date or ISO string into friendly IST date/time display
 */
export function formatIstDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/**
 * Format a Date or ISO string into IST date only (e.g. "24 Oct 2026")
 */
export function formatIstDateOnly(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Check if a cutoff timestamp in IST has passed
 */
export function isCutoffPassed(cutoffDate: Date | string | null | undefined): boolean {
  if (!cutoffDate) return false;
  const cutoffTime = typeof cutoffDate === "string" ? new Date(cutoffDate).getTime() : cutoffDate.getTime();
  return Date.now() > cutoffTime;
}

/**
 * Calculate countdown components remaining until target timestamp
 */
export function calculateTimeRemaining(targetIso: string): {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const targetTime = new Date(targetIso).getTime();
  const diff = targetTime - Date.now();
  if (isNaN(targetTime) || diff <= 0) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return { totalMs: diff, days, hours, minutes, seconds, isExpired: false };
}
