import { getAllMultiResultNames, getAllMultiResults } from '../../helpers/prisma-results-multi'
import { StrategyResultMulti } from '../../helpers/interfaces'

export async function findMultiResultNames(): Promise<string[]> {
  return getAllMultiResultNames()
}

export async function findMultiResults(): Promise<StrategyResultMulti[]> {
  return getAllMultiResults()
}
