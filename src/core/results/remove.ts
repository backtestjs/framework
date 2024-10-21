import { getAllStrategyResultNames, deleteStrategyResult } from '../../helpers/prisma-results'
import { BacktestError, ErrorCode } from '../../helpers/error'

export async function deleteResults(resultsName: string) {
  if (!resultsName) {
    throw new BacktestError('Results name is required', ErrorCode.MissingInput)
  }

  const allResultsReturn = await getAllStrategyResultNames()
  if (allResultsReturn.error) return allResultsReturn

  const allResults = allResultsReturn.data
  if (!allResults.includes(resultsName)) {
    throw new BacktestError(`Results ${resultsName} not found`, ErrorCode.NotFound)
  }

  return deleteStrategyResult(resultsName)
}
