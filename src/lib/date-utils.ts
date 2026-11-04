/**
 * Date and time formatting utilities for YEP Initiative events.
 * Supports events with or without optional time, preventing timezone shifts on date-only events.
 */

/**
 * Returns true if the ISO date string has a specific time set (not midnight UTC / 00:00:00).
 */
export function eventHasTime(isoDate: string | null | undefined): boolean {
  if (!isoDate) return false;

  // Check if string contains T00:00:00 or T00:00 (often with .000Z or Z)
  const match = isoDate.match(/T(\d{2}):(\d{2})/i);
  if (!match || !match[1] || !match[2]) return false;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  // If both hours and minutes are 00, it's a date-only event without time
  return !(hours === 0 && minutes === 0);
}

/**
 * Formats the date portion (e.g. "Nov 20, 2026").
 * For date-only events, constructs local date using YYYY-MM-DD components
 * so the date never shifts to the previous day in western timezones.
 */
export function formatEventDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "";

  try {
    const datePart = isoDate.slice(0, 10);
    const parts = datePart.split("-");
    const yearStr = parts[0];
    const monthStr = parts[1];
    const dayStr = parts[2];

    if (yearStr && monthStr && dayStr) {
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const day = parseInt(dayStr, 10);

      if (!eventHasTime(isoDate)) {
        // Date-only: use local date components directly to prevent timezone shift
        const d = new Date(year, month, day);
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }

      // Event with specific time: parse as full ISO timestamp
      const d = new Date(isoDate);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Formats the time range (e.g. "2:00 PM – 4:30 PM" or "2:00 PM").
 * Returns empty string if the event does not have a time.
 */
export function formatEventTime(
  startDate: string | null | undefined,
  endDate?: string | null | undefined,
): string {
  if (!startDate || !eventHasTime(startDate)) {
    return "";
  }

  try {
    const s = new Date(startDate);
    const startStr = s.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    if (!endDate || !eventHasTime(endDate)) {
      return startStr;
    }

    const e = new Date(endDate);
    const endStr = e.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${startStr} – ${endStr}`;
  } catch {
    return "";
  }
}

/**
 * Formats the full date & time (e.g. "Nov 20, 2026 · 2:00 PM – 4:00 PM", or "Nov 20, 2026" if no time).
 */
export function formatEventDateTime(
  startDate: string | null | undefined,
  endDate?: string | null | undefined,
): string {
  if (!startDate) return "";

  const dateStr = formatEventDate(startDate);
  const timeStr = formatEventTime(startDate, endDate);

  return timeStr ? `${dateStr} · ${timeStr}` : dateStr;
}

/**
 * Splits an ISO timestamp from Supabase into separate date (YYYY-MM-DD) and time (HH:mm) strings.
 * If the event has no time, time returns empty string "".
 */
export function parseIsoDateTime(isoString: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!isoString) return { date: "", time: "" };

  try {
    const datePart = isoString.slice(0, 10);
    const hasTime = eventHasTime(isoString);

    if (!hasTime) {
      return { date: datePart, time: "" };
    }

    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) {
      return { date: datePart, time: "" };
    }

    const pad = (n: number) => n.toString().padStart(2, "0");
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());

    return {
      date: datePart,
      time: `${hours}:${minutes}`,
    };
  } catch {
    return { date: "", time: "" };
  }
}

/**
 * Combines separate date (YYYY-MM-DD) and optional time (HH:mm) inputs into an ISO string for Supabase.
 */
export function combineDateTimeToIso(
  dateStr: string,
  timeStr: string,
): string | null {
  const trimmedDate = dateStr.trim();
  const trimmedTime = timeStr.trim();

  if (!trimmedDate) return null;

  if (!trimmedTime) {
    // Date only: midnight UTC
    return `${trimmedDate}T00:00:00.000Z`;
  }

  // Both date and time provided: parse in local time and convert to ISO string
  const localDate = new Date(`${trimmedDate}T${trimmedTime}:00`);
  if (Number.isNaN(localDate.getTime())) {
    return `${trimmedDate}T${trimmedTime}:00.000Z`;
  }

  return localDate.toISOString();
}

