import { GetCandles } from "../../types/global";
export declare function getCandleStartDate(symbol: string): Promise<{
    error: boolean;
    data: any;
}>;
export declare function getBaseQuote(symbol: string): Promise<{
    error: boolean;
    data: any;
}>;
export declare function getCandles(getCandlesParams: GetCandles): Promise<{
    error: boolean;
    data: any;
}>;
