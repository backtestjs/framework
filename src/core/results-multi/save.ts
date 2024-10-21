import { insertMultiResult, getAllMultiResultNames, deleteMultiResult } from '../../helpers/prisma-results-multi'
import { StrategyResultMulti } from '../../../types/global'
import { BacktestError, ErrorCode } from '../../helpers/error'

export async function saveMultiResults(resultsName: string, results: StrategyResultMulti, override: boolean = false) {
  if (!resultsName) {
    throw new BacktestError('Results name is required', ErrorCode.MissingInput)
  }

  results.name = resultsName

  // Check if results already exist
  const allResultsReturn = await getAllMultiResultNames()
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
    const deleteResults = await deleteMultiResult(results.name)
    if (deleteResults.error) return deleteResults
  }

  // Save the results to the dB
  const saveResultsRes = await insertMultiResult(results)
  if (saveResultsRes.error) return saveResultsRes
  return { error: false, data: `Successfully saved trading results for ${results.name}` }
}
