import { getAllMultiResultNames, deleteMultiResult } from '../../helpers/prisma-results-multi'
import { BacktestError, ErrorCode } from '../../helpers/error'

export async function deleteMultiResults(resultsName: string) {
  if (!resultsName) {
    throw new BacktestError('Results name is required', ErrorCode.MissingInput)
  }

  const allResultsReturn = await getAllMultiResultNames()
  if (allResultsReturn.error) return allResultsReturn

  const allResults = allResultsReturn.data
  if (!allResults.includes(resultsName)) {
    throw new BacktestError(`Results ${resultsName} not found`, ErrorCode.NotFound)
  }

  return deleteMultiResult(resultsName)
}
