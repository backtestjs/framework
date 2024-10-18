import { MetaCandle } from "../../../types/global";
export declare function findHistoricalDataNames(): Promise<{
    error: boolean;
    data: string | MetaCandle[];
} | string[] | null>;
export declare function findHistoricalDataSets(): Promise<MetaCandle[] | {
    error: boolean;
    data: string | MetaCandle[];
} | null>;
export declare function findHistoricalData(name: string): Promise<MetaCandle | {
    error: boolean;
    data: string | MetaCandle;
} | null>;
