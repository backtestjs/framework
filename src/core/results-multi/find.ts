import { getAllMultiResultNames, getAllMultiResults } from "../../helpers/prisma-results-multi";
import { StrategyResultMulti } from "../../../types/global";

export async function findMultiResultNames() {
  const allResultsReturn = await getAllMultiResultNames();
  if (allResultsReturn.error) return allResultsReturn;

  const resultNames: string[] | null = typeof allResultsReturn.data === "string" ? null : allResultsReturn.data;
  return resultNames;
}

export async function findMultiResults() {
  const allResultsReturn = await getAllMultiResults();
  if (allResultsReturn.error) return allResultsReturn;

  const resultNames: StrategyResultMulti[] | null =
    typeof allResultsReturn.data === "string" ? null : allResultsReturn.data;
  return resultNames;
}
