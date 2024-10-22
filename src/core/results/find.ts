import { getAllStrategyResultNames, getAllStrategyResults } from '../../helpers/prisma-results'
import { GetStrategyResult } from '../../helpers/interfaces'

export async function findResultNames(): Promise<string[]> {
  return getAllStrategyResultNames()
}

export async function findResults(): Promise<GetStrategyResult[]> {
  return getAllStrategyResults()
}
