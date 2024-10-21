import { getAllStrategyResultNames, deleteStrategyResult } from '../../helpers/prisma-results'

export async function deleteResults(resultsName: string) {
  if (!resultsName) {
    return { error: true, data: 'Results name is required' }
  }

  const allResultsReturn = await getAllStrategyResultNames()
  if (allResultsReturn.error) return allResultsReturn

  const allResults = allResultsReturn.data
  if (!allResults.includes(resultsName)) {
    return { error: true, data: `Results ${resultsName} not found` }
  }

  return deleteStrategyResult(resultsName)
}
