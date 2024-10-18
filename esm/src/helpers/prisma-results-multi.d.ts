import { StrategyResultMulti } from "../../types/global";
export declare function insertMultiResult(result: StrategyResultMulti): Promise<{
    error: boolean;
    data: string;
}>;
export declare function getAllMultiResults(): Promise<{
    error: boolean;
    data: string | StrategyResultMulti[];
}>;
export declare function getAllMultiResultNames(): Promise<{
    error: boolean;
    data: string | string[];
}>;
export declare function getMultiResult(name: string): Promise<{
    error: boolean;
    data: string | StrategyResultMulti;
}>;
export declare function deleteMultiResult(name: string): Promise<{
    error: boolean;
    data: string;
}>;
