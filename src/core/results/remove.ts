import { getAllStrategyResultNames, deleteStrategyResult } from '../../helpers/prisma-results'
import { BacktestError, ErrorCode } from '../../helpers/error'

export async function deleteResult(resultsName: string): Promise<boolean> {
  if (!resultsName) {
    throw new BacktestError('Results name is required', ErrorCode.MissingInput)
  }

  const allResults: string[] = await getAllStrategyResultNames()
  if (!allResults.includes(resultsName)) {
    throw new BacktestError(`Results ${resultsName} not found`, ErrorCode.NotFound)
  }

  return deleteStrategyResult(resultsName)
}
