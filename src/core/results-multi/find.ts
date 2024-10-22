import { getAllMultiResultNames, getAllMultiResults, getMultiResult } from '../../helpers/prisma-results-multi'
import { StrategyResultMulti } from '../../helpers/interfaces'

export async function findMultiResultNames(): Promise<string[]> {
  return (await getAllMultiResultNames()).sort()
}

export async function findMultiResults(): Promise<StrategyResultMulti[]> {
  return getAllMultiResults()
}

export { getMultiResult }
