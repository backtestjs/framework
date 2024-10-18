import { BuySellReal, Order } from "../../types/global";
export declare const orderBook: {
    bought: boolean;
    boughtLong: boolean;
    boughtShort: boolean;
    baseAmount: number;
    quoteAmount: number;
    borrowedBaseAmount: number;
    preBoughtQuoteAmount: number;
    fakeQuoteAmount: number;
    stopLoss: number;
    takeProfit: number;
};
export declare let allOrders: Order[];
export declare function clearOrders(): Promise<void>;
export declare function getCurrentWorth(close: number, high?: number, low?: number, open?: number): Promise<{
    close: number;
    high: number;
    low: number;
    open: number;
}>;
export declare function realBuy(buyParams: BuySellReal): Promise<{
    error: boolean;
    data: string;
} | undefined>;
export declare function realSell(sellParams: BuySellReal): Promise<{
    error: boolean;
    data: string;
} | undefined>;
