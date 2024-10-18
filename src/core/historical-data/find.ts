import { getCandleMetaData, getAllCandleMetaData } from "../../helpers/prisma-historical-data";
import { MetaCandle } from "../../../types/global";

export async function findHistoricalDataNames() {
  const historicalData = await getAllCandleMetaData();
  if (historicalData.error) return historicalData;

  const metaCandleNames: string[] | null =
    typeof historicalData.data === "string" ? null : historicalData.data.map((data: MetaCandle) => data.name);
  return metaCandleNames;
}

export async function findHistoricalDataSets() {
  const historicalData = await getAllCandleMetaData();
  if (historicalData.error) return historicalData;

  const metaCandles: MetaCandle[] | null = typeof historicalData.data === "string" ? null : historicalData.data;
  return metaCandles;
}

export async function findHistoricalData(name: string) {
  const historicalData = await getCandleMetaData(name);
  if (historicalData.error) return historicalData;

  const metaCandle: MetaCandle | null = typeof historicalData.data === "string" ? null : historicalData.data;
  return metaCandle;
}
