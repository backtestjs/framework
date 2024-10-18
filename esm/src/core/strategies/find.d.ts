import { StrategyMeta } from "../../../types/global";
export declare function findStrategieNames(): Promise<string[] | {
    error: boolean;
    data: string | StrategyMeta[];
}>;
export declare function findStrategies(): Promise<StrategyMeta[] | {
    error: boolean;
    data: string | StrategyMeta[];
}>;
