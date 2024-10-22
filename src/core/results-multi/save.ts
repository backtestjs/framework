import { insertMultiResult, getAllMultiResultNames, deleteMultiResult } from '../../helpers/prisma-results-multi'
import { StrategyResultMulti } from '../../helpers/interfaces'
import { BacktestError, ErrorCode } from '../../helpers/error'
import * as logger from '../../helpers/logger'

export async function saveMultiResults(resultsName: string, results: StrategyResultMulti, override: boolean = false) {
  if (!resultsName) {
    throw new BacktestError('Results name is required', ErrorCode.MissingInput)
  }

  results.name = resultsName

  // Check if results already exist
  const allResults = await getAllMultiResultNames()
  if (allResults.includes(results.name)) {
    if (!override) {
      throw new BacktestError(
        `Results ${results.name} has saved results already. Use override option to rewrite them.`,
        ErrorCode.Conflict
      )
    }

    // Delete already existing entry
    await deleteMultiResult(results.name)
  }

  // Save the results to the dB
  await insertMultiResult(results)
  logger.info(`Successfully saved trading results for ${results.name}`)
  return true
}
