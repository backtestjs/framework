import axios from "axios";

export interface FXMacroDataCalendarEvent {
  announcement_datetime_utc?: string;
  announcement_datetime_local?: string;
  release?: string;
  name?: string;
  market_tier?: number;
  top_tier_for_currency?: boolean;
  actual?: number | string | null;
  previous?: number | string | null;
  consensus?: number | string | null;
  [key: string]: unknown;
}

export interface FXMacroDataCalendarOptions {
  currency?: string;
  startDate?: string;
  endDate?: string;
  apiKey?: string;
  baseUrl?: string;
  topTierOnly?: boolean;
}

export async function fetchFXMacroDataCalendar(
  options: FXMacroDataCalendarOptions = {}
): Promise<FXMacroDataCalendarEvent[]> {
  const {
    currency = "usd",
    startDate,
    endDate,
    apiKey = process.env.FXMD_API_KEY,
    baseUrl = "https://api.fxmacrodata.com/v1",
    topTierOnly = false,
  } = options;

  const response = await axios.get(`${baseUrl.replace(/\/$/, "")}/calendar/${currency.toLowerCase()}`, {
    headers: { Accept: "application/json", ...(apiKey ? { "X-API-Key": apiKey } : {}) },
    params: {
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    },
    timeout: 30000,
  });

  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  if (!topTierOnly) return rows;
  return rows.filter((row: FXMacroDataCalendarEvent) => row.top_tier_for_currency || row.market_tier === 1);
}

export function hasFXMacroDataEventNear(
  events: FXMacroDataCalendarEvent[],
  timestamp: Date,
  beforeMs = 4 * 60 * 60 * 1000,
  afterMs = 2 * 60 * 60 * 1000
): boolean {
  const ts = timestamp.getTime();
  return events.some((event) => {
    const value = event.announcement_datetime_utc || event.announcement_datetime_local;
    if (!value) return false;
    const eventTs = new Date(value).getTime();
    return eventTs - beforeMs <= ts && ts <= eventTs + afterMs;
  });
}

