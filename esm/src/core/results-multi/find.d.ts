import { StrategyResultMulti } from "../../../types/global";
export declare function findMultiResultNames(): Promise<string[] | {
    error: boolean;
    data: string | string[];
} | null>;
export declare function findMultiResults(): Promise<StrategyResultMulti[] | {
    error: boolean;
    data: string | StrategyResultMulti[];
} | null>;
