import { ImportCSV, Candle } from "../../types/global";
export declare function importCSV(importCSVParams: ImportCSV): Promise<{
    error: boolean;
    data: any;
}>;
export declare function exportCSV(name: string, rootPath?: string): Promise<{
    error: boolean;
    data: string | {
        metaCandles: import("../../types/global").MetaCandle[];
        candles: Candle[];
    };
}>;
