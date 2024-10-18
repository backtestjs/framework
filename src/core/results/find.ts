import { getAllStrategyResultNames, getAllStrategyResults } from "../../helpers/prisma-results";
import { StrategyResult } from "../../../types/global";

export async function findResultNames() {
  const allResultsReturn = await getAllStrategyResultNames();
  if (allResultsReturn.error) return allResultsReturn;

  const resultNames: string[] | null = typeof allResultsReturn.data === "string" ? null : allResultsReturn.data;
  return resultNames;
}

export async function findResults() {
  const allResultsReturn = await getAllStrategyResults();
  if (allResultsReturn.error) return allResultsReturn;

  const resultNames: StrategyResult[] | null = typeof allResultsReturn.data === "string" ? null : allResultsReturn.data;
  return resultNames;
}
