import { getCandleMetaData, getAllCandleMetaData, getCandles } from '../../helpers/prisma-historical-data'
import { MetaCandle } from '../../helpers/interfaces'

export async function findHistoricalDataNames(): Promise<string[]> {
  const historicalData: MetaCandle[] = await getAllCandleMetaData()
  return historicalData.map((data: MetaCandle) => data.name).sort()
}

export async function findHistoricalDataSets(): Promise<MetaCandle[]> {
  return getAllCandleMetaData()
}

export async function findHistoricalData(name: string): Promise<MetaCandle | null> {
  return getCandleMetaData(name)
}

export { getCandles }
