"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const orders_1 = require("./orders");
const parse_1 = require("./parse");
const prisma_historical_data_1 = require("./prisma-historical-data");
const path = require("path");
const fs = __importStar(require("fs"));
async function run(runParams) {
    var _a;
    if (!runParams)
        return { error: true, data: "No options specified" };
    if (!runParams.strategyName)
        return { error: true, data: "Strategy name must be specified" };
    if (!((_a = runParams.historicalMetaData) === null || _a === void 0 ? void 0 : _a.length))
        return { error: true, data: "Historical data names must be specified" };
    let isJS = false;
    const extension = path.extname(__filename);
    if (extension === ".js")
        isJS = true;
    const importPath = !!runParams.rootPath ? runParams.rootPath : isJS ? `./dist/src/strategies` : `./src/strategies`;
    const importResolvedPath = path.resolve(importPath);
    let files = fs.readdirSync(importResolvedPath);
    if (!(files === null || files === void 0 ? void 0 : files.length)) {
        return {
            error: true,
            data: `No files found to scan`,
        };
    }
    files = files.filter((file) => path.basename(file, path.extname(file)) === runParams.strategyName &&
        [".js", ".ts"].includes(path.extname(file)) &&
        !file.endsWith(".d.ts"));
    const importFilePath = (files === null || files === void 0 ? void 0 : files.length) != 1 ? null : path.join(importResolvedPath, files[0]);
    if (!importFilePath) {
        return {
            error: true,
            data: `You must create the file ${runParams.strategyName}.ts in the strategies folder ${importResolvedPath}`,
        };
    }
    delete require.cache[require.resolve(importFilePath)];
    const strategy = await (_a = importFilePath, Promise.resolve().then(() => __importStar(require(_a))));
    if ((strategy === null || strategy === void 0 ? void 0 : strategy.runStrategy) === undefined) {
        return {
            error: true,
            data: `${runParams.strategyName} file does not have a function with the name of runStrategy.\nIt is mandatory to export a function with this name:\n\nexport async function runStrategy(bth: BTH) {}`,
        };
    }
    let returnAnError = false;
    let returnError = { error: false, data: "" };
    let multiSymbol = runParams.historicalMetaData.length > 1;
    let multiValue = false;
    let permutations = [{}];
    let permutationDataReturn = [];
    if (Object.keys(runParams.params).length !== 0) {
        for (const key in runParams.params) {
            if (typeof runParams.params[key] === "string" && runParams.params[key].includes(",")) {
                multiValue = true;
                permutations = (0, parse_1.generatePermutations)(runParams.params);
                break;
            }
        }
    }
    for (let symbolCount = 0; symbolCount < runParams.historicalMetaData.length; symbolCount++) {
        const candlesRequest = await (0, prisma_historical_data_1.getCandles)(runParams.historicalMetaData[symbolCount]);
        if (candlesRequest.error)
            return candlesRequest;
        let candles = [];
        if (typeof candlesRequest.data !== "string")
            candles = candlesRequest.data.candles;
        let numberOfCandles = 0;
        let assetAmounts = {};
        for (let permutationCount = 0; permutationCount < permutations.length; permutationCount++) {
            if (multiValue)
                runParams.params = permutations[permutationCount];
            let historicalMetaData;
            if (multiValue || multiSymbol) {
                if (multiSymbol || historicalMetaData === undefined) {
                    const historicalMetaDataResults = await (0, prisma_historical_data_1.getCandleMetaData)(runParams.historicalMetaData[symbolCount]);
                    if (historicalMetaDataResults.error)
                        return historicalMetaDataResults;
                    historicalMetaData = historicalMetaDataResults.data;
                    if (multiSymbol && typeof historicalMetaData !== "string") {
                        runParams.startTime = historicalMetaData.startTime;
                        runParams.endTime = historicalMetaData.endTime;
                    }
                }
            }
            orders_1.orderBook.bought = false;
            orders_1.orderBook.boughtLong = false;
            orders_1.orderBook.boughtShort = false;
            orders_1.orderBook.baseAmount = 0;
            orders_1.orderBook.quoteAmount = runParams.startingAmount;
            orders_1.orderBook.borrowedBaseAmount = 0;
            orders_1.orderBook.fakeQuoteAmount = runParams.startingAmount;
            orders_1.orderBook.preBoughtQuoteAmount = runParams.startingAmount;
            orders_1.orderBook.stopLoss = 0;
            orders_1.orderBook.takeProfit = 0;
            await (0, orders_1.clearOrders)();
            const allWorths = [];
            let candleIndexes = await (0, parse_1.findCandleIndex)(candles, runParams.startTime, runParams.endTime);
            let candleIndex = candleIndexes.startIndex;
            const candleIndexEnd = candleIndexes.endIndex;
            let allCandles = candles.slice(candleIndex, candleIndexEnd);
            numberOfCandles = candleIndexEnd - candleIndex;
            const runMetaData = {
                highestAmount: runParams.startingAmount,
                highestAmountDate: candles[candleIndex].closeTime,
                lowestAmount: runParams.startingAmount,
                lowestAmountDate: candles[candleIndex].closeTime,
                maxDrawdownAmount: 0,
                maxDrawdownAmountDates: "",
                maxDrawdownPercent: 0,
                maxDrawdownPercentDates: "",
                startingAssetAmount: candles[candleIndex].close,
                startingAssetAmountDate: candles[candleIndex].closeTime,
                endingAssetAmount: candles[candleIndexEnd].close,
                endingAssetAmountDate: candles[candleIndexEnd].closeTime,
                highestAssetAmount: candles[candleIndex].high,
                highestAssetAmountDate: candles[candleIndex].closeTime,
                lowestAssetAmount: candles[candleIndex].low,
                lowestAssetAmountDate: candles[candleIndex].closeTime,
                numberOfCandles,
                numberOfCandlesInvested: 0,
                sharpeRatio: 0,
            };
            for (candleIndex; candleIndex < candleIndexEnd; candleIndex++) {
                const currentCandle = candles[candleIndex];
                let canBuySell = true;
                async function buy(buyParams) {
                    if (!canBuySell)
                        return { error: false, data: "Buy blocked until highest needed candles are met" };
                    if (buyParams === undefined)
                        buyParams = {};
                    if (buyParams.price === undefined)
                        buyParams.price = currentCandle.close;
                    const buyParamsReal = {
                        currentClose: currentCandle.close,
                        percentFee: runParams.percentFee,
                        percentSlippage: runParams.percentSlippage,
                        date: currentCandle.closeTime,
                        ...buyParams,
                    };
                    if (buyParams.stopLoss !== undefined &&
                        buyParams.stopLoss > 0 &&
                        orders_1.orderBook.borrowedBaseAmount > 0 &&
                        orders_1.orderBook.baseAmount > 0) {
                        returnAnError = true;
                        returnError = { error: true, data: "Cannot define a stop loss if in a long and a short" };
                    }
                    if (buyParams.takeProfit !== undefined &&
                        buyParams.takeProfit > 0 &&
                        orders_1.orderBook.borrowedBaseAmount > 0 &&
                        orders_1.orderBook.baseAmount > 0) {
                        returnAnError = true;
                        returnError = { error: true, data: "Cannot define a take profit if in a long and a short" };
                    }
                    if (buyParams.stopLoss !== undefined && buyParams.stopLoss > 0)
                        orders_1.orderBook.stopLoss = buyParams.stopLoss;
                    if (buyParams.takeProfit !== undefined && buyParams.takeProfit > 0)
                        orders_1.orderBook.takeProfit = buyParams.takeProfit;
                    const buyResults = await (0, orders_1.realBuy)(buyParamsReal);
                    if (buyResults === null || buyResults === void 0 ? void 0 : buyResults.error) {
                        returnAnError = true;
                        returnError = buyResults;
                    }
                }
                async function sell(sellParams) {
                    if (!canBuySell)
                        return { error: false, data: "Sell blocked until highest needed candles are met" };
                    if (sellParams === undefined)
                        sellParams = {};
                    if (sellParams.price === undefined)
                        sellParams.price = currentCandle.close;
                    const sellParamsReal = {
                        currentClose: currentCandle.close,
                        percentFee: runParams.percentFee,
                        percentSlippage: runParams.percentSlippage,
                        date: currentCandle.closeTime,
                        ...sellParams,
                    };
                    const sellResults = await (0, orders_1.realSell)(sellParamsReal);
                    if (sellResults === null || sellResults === void 0 ? void 0 : sellResults.error) {
                        returnAnError = true;
                        returnError = sellResults;
                    }
                }
                async function getCandles(type, start, end) {
                    const candleCheck = end === undefined ? start : end;
                    if (candleIndex - candleCheck < 0) {
                        canBuySell = false;
                        return end === undefined ? 0 : new Array(end - start).fill(0);
                    }
                    canBuySell = true;
                    if (end === undefined)
                        return type === "all" ? candles[candleIndex - start] : candles[candleIndex - start][type];
                    if (type === "all")
                        return candles.slice(candleIndex - end, candleIndex - start);
                    return candles.slice(candleIndex - end, candleIndex - start).map((candle) => candle[type]);
                }
                if (returnAnError)
                    return returnError;
                if (orders_1.orderBook.stopLoss > 0) {
                    if (orders_1.orderBook.baseAmount > 0) {
                        if (currentCandle.low <= orders_1.orderBook.stopLoss)
                            await sell({ price: orders_1.orderBook.stopLoss });
                    }
                    else if (orders_1.orderBook.borrowedBaseAmount > 0) {
                        if (currentCandle.high >= orders_1.orderBook.stopLoss)
                            await sell({ price: orders_1.orderBook.stopLoss });
                    }
                }
                if (orders_1.orderBook.takeProfit > 0) {
                    if (orders_1.orderBook.baseAmount > 0) {
                        if (currentCandle.high >= orders_1.orderBook.takeProfit)
                            await sell({ price: orders_1.orderBook.takeProfit });
                    }
                    else if (orders_1.orderBook.borrowedBaseAmount > 0) {
                        if (currentCandle.low <= orders_1.orderBook.takeProfit)
                            await sell({ price: orders_1.orderBook.takeProfit });
                    }
                }
                const worth = await (0, orders_1.getCurrentWorth)(currentCandle.close, currentCandle.high, currentCandle.low, currentCandle.open);
                if (worth.low <= 0)
                    return {
                        error: true,
                        data: `Your worth in this candle went to 0 or less than 0, it is suggested to handle shorts with stop losses, Lowest worth this candle: ${worth.low}, Date: ${new Date(currentCandle.closeTime).toLocaleString()}`,
                    };
                allWorths.push({
                    close: worth.close,
                    high: worth.high,
                    low: worth.low,
                    open: worth.open,
                    time: currentCandle.closeTime,
                });
                if (currentCandle.high > runMetaData.highestAssetAmount) {
                    runMetaData.highestAssetAmount = currentCandle.high;
                    runMetaData.highestAssetAmountDate = currentCandle.closeTime;
                }
                if (currentCandle.low < runMetaData.lowestAssetAmount) {
                    runMetaData.lowestAssetAmount = currentCandle.low;
                    runMetaData.lowestAssetAmountDate = currentCandle.closeTime;
                }
                if (worth.high > runMetaData.highestAmount) {
                    runMetaData.highestAmount = worth.high;
                    runMetaData.highestAmountDate = currentCandle.closeTime;
                }
                if (worth.low < runMetaData.lowestAmount) {
                    runMetaData.lowestAmount = worth.low;
                    runMetaData.lowestAmountDate = currentCandle.closeTime;
                    if (runMetaData.highestAmount - worth.low > runMetaData.maxDrawdownAmount) {
                        runMetaData.maxDrawdownAmount = (0, parse_1.round)(runMetaData.highestAmount - worth.low);
                        runMetaData.maxDrawdownAmountDates = `${new Date(runMetaData.highestAmountDate).toLocaleString()} - ${new Date(currentCandle.closeTime).toLocaleString()} : ${(0, parse_1.getDiffInDays)(runMetaData.highestAmountDate, currentCandle.closeTime)}`;
                    }
                    const drawdownPercent = ((runMetaData.highestAmount - worth.low) / runMetaData.highestAmount) * 100;
                    if (drawdownPercent > runMetaData.maxDrawdownPercent) {
                        runMetaData.maxDrawdownPercent = (0, parse_1.round)(drawdownPercent);
                        runMetaData.maxDrawdownPercentDates = `${new Date(runMetaData.highestAmountDate).toLocaleString()} - ${new Date(currentCandle.closeTime).toLocaleString()} : ${(0, parse_1.getDiffInDays)(runMetaData.highestAmountDate, currentCandle.closeTime)}`;
                    }
                }
                try {
                    await strategy.runStrategy({
                        currentCandle,
                        getCandles,
                        params: runParams.params,
                        orderBook: orders_1.orderBook,
                        allOrders: orders_1.allOrders,
                        buy,
                        sell,
                    });
                }
                catch (error) {
                    return { error: true, data: `Ran into an error running the strategy with error ${error}` };
                }
                if (returnAnError)
                    return returnError;
                if (orders_1.orderBook.bought)
                    runMetaData.numberOfCandlesInvested++;
                if (candleIndex === candleIndexEnd - 1 && orders_1.orderBook.bought)
                    await sell();
            }
            runMetaData.sharpeRatio = (0, parse_1.calculateSharpeRatio)(allWorths);
            if (multiValue || multiSymbol) {
                assetAmounts.startingAssetAmount = runMetaData.startingAssetAmount;
                assetAmounts.endingAssetAmount = runMetaData.endingAssetAmount;
                assetAmounts.highestAssetAmount = runMetaData.highestAssetAmount;
                assetAmounts.highestAssetAmountDate = runMetaData.highestAssetAmountDate;
                assetAmounts.lowestAssetAmount = runMetaData.lowestAssetAmount;
                assetAmounts.lowestAssetAmountDate = runMetaData.lowestAssetAmountDate;
                assetAmounts.numberOfCandles = numberOfCandles;
                if (historicalMetaData !== undefined && typeof historicalMetaData !== "string") {
                    permutationDataReturn.push({
                        ...runParams.params,
                        symbol: historicalMetaData.symbol,
                        interval: historicalMetaData.interval,
                        endAmount: allWorths[allWorths.length - 1].close,
                        maxDrawdownAmount: runMetaData.maxDrawdownAmount,
                        maxDrawdownPercent: runMetaData.maxDrawdownPercent,
                        numberOfCandlesInvested: runMetaData.numberOfCandlesInvested,
                        sharpeRatio: runMetaData.sharpeRatio,
                        assetAmounts,
                    });
                }
            }
            else {
                return { error: false, data: { allOrders: orders_1.allOrders, runMetaData, allWorths, allCandles } };
            }
        }
    }
    return { error: false, data: { permutationDataReturn } };
}
exports.run = run;
//# sourceMappingURL=run-strategy.js.map