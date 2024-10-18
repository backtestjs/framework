export declare function exportFileCSV(name: string, rootPath?: string): Promise<{
    error: boolean;
    data: string | {
        metaCandles: import("../../../main").MetaCandle[];
        candles: import("../../../main").Candle[];
    };
}>;
