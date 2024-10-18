import { StrategyMeta } from "../../types/global";
export declare function insertStrategy(strategy: StrategyMeta): Promise<{
    error: boolean;
    data: string;
}>;
export declare function getAllStrategies(): Promise<{
    error: boolean;
    data: StrategyMeta[] | string;
}>;
export declare function getStrategy(name: string): Promise<{
    error: boolean;
    data: StrategyMeta | string;
}>;
export declare function updateLastRunTime(name: string, lastRunTime: number): Promise<{
    error: boolean;
    data: string;
}>;
export declare function deleteStrategy(name: string): Promise<{
    error: boolean;
    data: string;
}>;
export declare function updateStrategy(strategy: StrategyMeta): Promise<{
    error: boolean;
    data: string;
}>;
