import { getAllStrategyResultNames, getAllStrategyResults, getResult } from '../../helpers/prisma-results'
import { GetStrategyResult } from '../../helpers/interfaces'

export async function findResultNames(): Promise<string[]> {
  return (await getAllStrategyResultNames()).sort()
}

export async function findResults(): Promise<GetStrategyResult[]> {
  return getAllStrategyResults()
}

export { getResult }
