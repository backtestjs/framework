import { getCandleMetaData, getAllCandleMetaData } from '../../helpers/prisma-historical-data'
import { MetaCandle } from '../../../types/global'

export async function findHistoricalDataNames(): Promise<string[]> {
  const historicalData: MetaCandle[] = await getAllCandleMetaData()
  return historicalData.map((data: MetaCandle) => data.name)
}

export async function findHistoricalDataSets(): Promise<MetaCandle[]> {
  return getAllCandleMetaData()
}

export async function findHistoricalData(name: string): Promise<MetaCandle | null> {
  return getCandleMetaData(name)
}
