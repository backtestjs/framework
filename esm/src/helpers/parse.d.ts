import { Candle, Order, LooseObject, StrategyResult, StrategyResultMulti } from "../../types/global";
export declare function roundTo(number?: number | undefined, decimal?: number): number;
export declare function round(numberToConvert: number): number;
export declare function parseCandles(candles: Candle[]): Promise<Candle[]>;
export declare function parseHistoricalData(metaDatas: string[]): Promise<string[]>;
export declare function removeUnusedCandles(candles: number[][], requiredTime: number): Promise<number[][] | undefined>;
export declare function findCandleIndex(candles: Candle[], startTime: number, endTime: number): Promise<{
    startIndex: number;
    endIndex: number;
}>;
export declare function getDiffInDays(startDate: number, endDate: number): string;
export declare function getDiffInDaysPercentage(startDate: number, endDate: number, percentage: number): string;
export declare function parseRunResults(runResults: Order[]): {
    winningTradeAmount: number;
    losingTradeAmount: number;
    averageWinAmount: number;
    averageLossAmount: number;
    buyAmount: number;
    sellAmount: number;
    averageBuyAmount: number;
    averageSellAmount: number;
    highestTradeWin: number;
    highestTradeWinDate: string;
    highestTradeLoss: number;
    highestTradeLossDate: string;
    highestBuyAmount: number;
    highestBuyAmountDate: string;
    highestSellAmount: number;
    highestSellAmountDate: string;
    lowestBuyAmount: number;
    lowestBuyAmountDate: string;
    lowestSellAmount: number;
    lowestSellAmountDate: string;
    averageTradePercent: number;
    winRatePercent: number;
    lossRatePercent: number;
    averageWinPercent: number;
    averageLossPercent: number;
    highestTradeWinPercentage: number;
    highestTradeWinPercentageDate: string;
    highestTradeLossPercentage: number;
    highestTradeLossPercentageDate: string;
};
export declare function parseRunResultsStats(runResultsParams: StrategyResult): Promise<{
    error: boolean;
    data: string;
} | {
    error: boolean;
    data: {
        totals: {
            name: string;
            amount: string | number;
            percent: string;
            date: string;
        }[];
        assetAmountsPercentages: {
            name: string;
            amount: number;
            percent: string;
            date: string;
        }[];
        trades: ({
            name: string;
            amount: number;
            percent: string;
            date: string;
        } | {
            name: string;
            amount: string;
            percent: string;
            date: string;
        })[];
        tradeBuySellAmounts: {
            name: string;
            amount: number;
            date: string;
        }[];
        generalData: ({
            name: string;
            value: string;
        } | {
            name: string;
            value: number;
        })[];
    };
}>;
export declare function parseRunResultsStatsMulti(runResultsParams: StrategyResultMulti): Promise<{
    error: boolean;
    data: string;
} | {
    error: boolean;
    data: {
        totals: {
            name: string;
            amount: any;
            percent: string;
            date: string;
        }[];
        assetAmountsPercentages: {
            name: string;
            amount: any;
            percent: string;
            date: string;
        }[];
        generalData: any;
    };
}>;
export declare function generatePermutations(params: LooseObject): any[];
export declare function removeIndexFromTable(data: LooseObject[]): void;
export declare function parseMultiResults(data: LooseObject[], numberOfCandles: number, startingAmount: number, multiSymbol: boolean): LooseObject[];
export declare function calculateSharpeRatio(entries: LooseObject, riskFreeRateAnnual?: number): number;
