import { getAllMultiResultNames, deleteMultiResult } from "../../helpers/prisma-results-multi";

export async function deleteMultiResults(resultsName: string) {
  if (!resultsName) {
    return { error: true, data: "Results name is required" };
  }

  const allResultsReturn = await getAllMultiResultNames();
  if (allResultsReturn.error) return allResultsReturn;

  const allResults = allResultsReturn.data;
  if (!allResults.includes(resultsName)) {
    return { error: true, data: `Results ${resultsName} not found` };
  }

  return deleteMultiResult(resultsName);
}
