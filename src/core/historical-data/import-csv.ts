import { getAllCandleMetaData } from "../../helpers/prisma-historical-data";
import { intervals } from "../../helpers/historical-data";
import { importCSV } from "../../helpers/csv";

import { MetaCandle } from "../../interfaces";

export async function importFileCSV(base: string, quote: string, interval: string, path: string) {
  if (!base) {
    return {
      error: true,
      data: "Base name (ex: BTC in BTCUSDT or APPL in APPL/USD) is required",
    };
  }

  if (!quote) {
    return {
      error: true,
      data: "Quote name (ex: USDT in BTCUSDT or USD in APPL/USD) is required",
    };
  }

  if (!interval || !intervals.includes(interval)) {
    return {
      error: true,
      data: `Interval is required. Use one of ${intervals.join(" ")}`,
    };
  }

  if (!path) {
    return {
      error: true,
      data: "Path to CSV file is required",
    };
  }

  // Get historical metadata
  const historicalMetaDatas = await getAllCandleMetaData();
  if (historicalMetaDatas.error) return historicalMetaDatas;

  const historicalDataSets: MetaCandle[] = typeof historicalMetaDatas.data !== "string" ? historicalMetaDatas.data : [];
  const isHistoricalDataPresent = historicalDataSets.some(
    (meta: MetaCandle) => meta.name === `${base + quote}-${interval}`
  );

  // Validate entry does not already exist
  if (isHistoricalDataPresent) {
    return {
      error: true,
      data: `Historical data already found for ${base + quote} with ${interval} interval.`,
    };
  }

  let filePath = path?.trim();

  // Remove path surrounding quotes if they exist
  if ((filePath.startsWith(`"`) && filePath.endsWith(`"`)) || (filePath.startsWith(`'`) && filePath.endsWith(`'`))) {
    filePath = filePath.substring(1, filePath.length - 1);
  }

  // Try to import the CSV
  return importCSV({ interval, base: base.toUpperCase(), quote: quote.toUpperCase(), path: filePath });
}
