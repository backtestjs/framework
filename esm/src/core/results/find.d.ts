import { StrategyResult } from "../../../types/global";
export declare function findResultNames(): Promise<string[] | {
    error: boolean;
    data: string | string[];
} | null>;
export declare function findResults(): Promise<{
    error: boolean;
    data: string | import("../../../types/global").GetStrategyResult[];
} | StrategyResult[] | null>;
