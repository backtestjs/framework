import { GetCandles, MetaCandle } from "../../types/global";
export declare const intervals: string[];
export declare function saveHistoricalData(runParams: GetCandles): Promise<{
    error: boolean;
    data: any;
}>;
export declare function updateHistoricalData(metadata: MetaCandle, newTimes: number): Promise<{
    error: boolean;
    data: any;
}>;
