import * as prismaResults from '../../helpers/prisma-results-multi'
import { BacktestError, ErrorCode } from '../../helpers/error'

export async function deleteMultiResult(resultsName: string): Promise<boolean> {
  if (!resultsName) {
    throw new BacktestError('Results name is required', ErrorCode.MissingInput)
  }

  const allResults: string[] = await prismaResults.getAllMultiResultNames()
  if (!allResults.includes(resultsName)) {
    throw new BacktestError(`Results ${resultsName} not found`, ErrorCode.NotFound)
  }

  return prismaResults.deleteMultiResult(resultsName)
}
