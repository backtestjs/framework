import { insertResult, getAllStrategyResultNames, deleteStrategyResult } from '../../helpers/prisma-results'
import { StrategyResult } from '../../../types/global'
import { BacktestError, ErrorCode } from '../../helpers/error'

export async function saveResults(resultsName: string, results: StrategyResult, override: boolean = false) {
  if (!resultsName) {
    throw new BacktestError('Results name is required', ErrorCode.MissingInput)
  }

  results.name = resultsName

  // Check if results already exist
  const allResultsReturn = await getAllStrategyResultNames()
  if (allResultsReturn.error) return allResultsReturn

  const allResults = allResultsReturn.data
  if (allResults.includes(results.name)) {
    if (!override) {
      throw new BacktestError(
        `Results ${results.name} has saved results already. Use override option to rewrite them.`,
        ErrorCode.Conflict
      )
    }

    // Delete already existing entry
    const deleteResults = await deleteStrategyResult(results.name)
    if (deleteResults.error) return deleteResults
  }

  // Save the results to the dB
  const saveResultsRes = await insertResult(results)
  if (saveResultsRes.error) return saveResultsRes
  return { error: false, data: `Successfully saved trading results for ${results.name}` }
}
