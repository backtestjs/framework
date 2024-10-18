import { StrategyResult } from "../../../types/global";
export declare function saveResults(resultsName: string, results: StrategyResult, override?: boolean): Promise<{
    error: boolean;
    data: string | string[];
}>;
