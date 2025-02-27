import { insertResult, getAllStrategyResultNames, deleteStrategyResult } from '../../helpers/prisma-results'
import { StrategyResult } from '../../helpers/interfaces'
import { BacktestError, ErrorCode } from '../../helpers/error'
import * as logger from '../../helpers/logger'

export async function saveResult(
  resultsName: string,
  results: StrategyResult,
  override: boolean = false
): Promise<boolean> {
  if (!resultsName) {
    throw new BacktestError('Results name is required', ErrorCode.MissingInput)
  }

  results.name = resultsName

  // Check if results already exist
  const allResults: string[] = await getAllStrategyResultNames()
  if (allResults.includes(results.name)) {
    if (!override) {
      throw new BacktestError(
        `Results ${results.name} has saved results already. Use override option to rewrite them.`,
        ErrorCode.Conflict
      )
    }

    // Delete already existing entry
    await deleteStrategyResult(results.name)
  }

  // Save the results to the dB
  await insertResult(results)
  logger.info(`Successfully saved trading results for ${results.name}`)
  return true
}
