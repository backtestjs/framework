import { insertResult, getAllStrategyResultNames, deleteStrategyResult } from "../../helpers/prisma-results";
import { StrategyResult } from "../../../types/global";

export async function saveResults(resultsName: string, results: StrategyResult, override: boolean = false) {
  if (!resultsName) {
    return { error: true, data: "Results name is required" };
  }

  results.name = resultsName;

  // Check if results already exist
  const allResultsReturn = await getAllStrategyResultNames();
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
      const deleteResults = await deleteStrategyResult(results.name);
      if (deleteResults.error) return deleteResults;
    }
  }

  // Save the results to the dB
  const saveResultsRes = await insertResult(results);
  if (saveResultsRes.error) return saveResultsRes;
  return { error: false, data: `Successfully saved trading results for ${results.name}` };
}
