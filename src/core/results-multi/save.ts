import { insertMultiResult, getAllMultiResultNames, deleteMultiResult } from "../../helpers/prisma-results-multi";
import { StrategyResultMulti } from "../../interfaces";

export async function saveMultiResults(resultsName: string, results: StrategyResultMulti, override: boolean = false) {
  if (!resultsName) {
    return { error: true, data: "Results name is required" };
  }

  results.name = resultsName;

  // Check if results already exist
  const allResultsReturn = await getAllMultiResultNames();
  if (allResultsReturn.error) return allResultsReturn;

  const allResults = allResultsReturn.data;
  if (allResults.includes(results.name)) {
    if (!override) {
      return {
        error: true,
        data: `Results ${results.name} has saved results already. Use override option to rewrite them.`,
      };
    } else {
      // Delete already existing entry
      const deleteResults = await deleteMultiResult(results.name);
      if (deleteResults.error) return deleteResults;
    }
  }

  // Save the results to the dB
  const saveResultsRes = await insertMultiResult(results);
  if (saveResultsRes.error) return saveResultsRes;
  return { error: false, data: `Successfully saved trading results for ${results.name}` };
}
