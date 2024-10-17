import { saveHistoricalData, intervals } from "../../helpers/historical-data";
import { getAllCandleMetaData } from "../../helpers/prisma-historical-data";
import { getCandleStartDate } from "../../helpers/api";

import { MetaCandle } from "../../interfaces";

export async function downloadHistoricalData(
  symbol: string,
  data: {
    interval: string;
    startDate: number | string | Date;
    endDate: number | string | Date;
  }
) {
  if (!symbol) {
    return { error: true, data: "Symbol is required" };
  }

  if (!data.interval) {
    return { error: true, data: "Interval is required" };
  }

  // Get historical metadata
  const historicalMetaDatas = await getAllCandleMetaData();
  if (historicalMetaDatas.error) return historicalMetaDatas;

  const historicalDataSets: MetaCandle[] = typeof historicalMetaDatas.data !== "string" ? historicalMetaDatas.data : [];

  let symbolStartDate = await getCandleStartDate(symbol);
  if (symbolStartDate.error) {
    // Try to load USDT symbol if symbol is not found
    symbolStartDate = await getCandleStartDate(`${symbol}USDT`);
    if (!symbolStartDate.error) symbol = `${symbol}USDT`;
  }

  if (symbolStartDate.error) {
    return { error: true, data: `Symbol ${symbol} does not exist` };
  }

  const symbolStart = symbolStartDate.data;

  if (!intervals.includes(data.interval)) {
    return { error: true, data: `Interval ${data.interval} does not exist` };
  }

  const isSymbolPresent = historicalDataSets.some((meta: MetaCandle) => meta.name === `${symbol}-${data.interval}`);

  if (isSymbolPresent) {
    return {
      error: true,
      data: `Symbol ${symbol} with interval ${data.interval} already exists.`,
    };
  }

  const now = new Date().getTime();
  const startTime = new Date(data.startDate || symbolStart).getTime();
  const endTime = new Date(data.endDate || now).getTime();

  if (startTime < symbolStart || startTime > now) {
    return {
      error: true,
      data: `Start date must be between ${new Date(symbolStart).toLocaleString()} and ${new Date(
        now
      ).toLocaleString()}`,
    };
  }

  if (endTime > now || endTime <= startTime) {
    return {
      error: true,
      data: `End date must be between ${new Date(startTime).toLocaleString()} and ${new Date(now).toLocaleString()}`,
    };
  }

  const objectGetHistoricalData = {
    symbol: symbol,
    interval: data.interval,
    startTime: startTime,
    endTime: endTime,
  };

  // Get candles
  return saveHistoricalData(objectGetHistoricalData);
}
