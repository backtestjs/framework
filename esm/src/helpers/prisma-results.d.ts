import { StrategyResult, GetStrategyResult } from "../../types/global";
export declare function insertResult(result: StrategyResult): Promise<{
    error: boolean;
    data: string;
}>;
export declare function getAllStrategyResults(): Promise<{
    error: boolean;
    data: string | GetStrategyResult[];
}>;
export declare function getAllStrategyResultNames(): Promise<{
    error: boolean;
    data: string | string[];
}>;
export declare function getResult(name: string): Promise<{
    error: boolean;
    data: GetStrategyResult | string;
}>;
export declare function deleteStrategyResult(name: string): Promise<{
    error: boolean;
    data: string;
}>;
