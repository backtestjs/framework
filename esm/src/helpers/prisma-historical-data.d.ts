import { Candle, MetaCandle } from "../../types/global";
export declare function insertCandles(metaCandle: MetaCandle, candles: Candle[]): Promise<{
    error: boolean;
    data: string;
}>;
export declare function getAllCandleMetaData(): Promise<{
    error: boolean;
    data: MetaCandle[] | string;
}>;
export declare function getCandleMetaData(name: string): Promise<{
    error: boolean;
    data: MetaCandle | string;
}>;
export declare function getCandles(name: string): Promise<{
    error: boolean;
    data: {
        metaCandles: MetaCandle[];
        candles: Candle[];
    } | string;
}>;
export declare function updateCandlesAndMetaCandle(name: string, newCandles: Candle[]): Promise<{
    error: boolean;
    data: string;
}>;
export declare function deleteCandles(name: string): Promise<{
    error: boolean;
    data: string;
}>;
