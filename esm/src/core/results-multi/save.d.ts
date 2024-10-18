import { StrategyResultMulti } from "../../../types/global";
export declare function saveMultiResults(resultsName: string, results: StrategyResultMulti, override?: boolean): Promise<{
    error: boolean;
    data: string | string[];
}>;
