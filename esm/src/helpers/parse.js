"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSharpeRatio = exports.parseMultiResults = exports.removeIndexFromTable = exports.generatePermutations = exports.parseRunResultsStatsMulti = exports.parseRunResultsStats = exports.parseRunResults = exports.getDiffInDaysPercentage = exports.getDiffInDays = exports.findCandleIndex = exports.removeUnusedCandles = exports.parseHistoricalData = exports.parseCandles = exports.round = exports.roundTo = void 0;
const prisma_historical_data_1 = require("./prisma-historical-data");
const { Console } = require("console");
const { Transform } = require("stream");
function roundTo(number = 0, decimal = 2) {
    const factor = Math.pow(10, decimal);
    return Math.round((number + Number.EPSILON) * factor) / factor;
}
exports.roundTo = roundTo;
function round(numberToConvert) {
    if (Math.abs(numberToConvert) >= 1) {
        return +numberToConvert.toFixed(2);
    }
    else {
        let strNum = numberToConvert.toFixed(20);
        let i = 0;
        while (strNum[i + 2] === "0") {
            i++;
        }
        let rounded = parseFloat(strNum.slice(0, i + 2 + 3 + 1));
        const strRounded = rounded.toString();
        return +strRounded.slice(0, i + 2 + 3);
    }
}
exports.round = round;
async function parseCandles(candles) {
    candles.pop();
    const candleObjects = candles.map((item) => ({
        openTime: item[0],
        open: +item[1],
        high: +item[2],
        low: +item[3],
        close: +item[4],
        volume: +item[5],
        closeTime: item[6],
        assetVolume: +item[7],
        numberOfTrades: item[8],
    }));
    return candleObjects;
}
exports.parseCandles = parseCandles;
async function parseHistoricalData(metaDatas) {
    let parsedMetaCandles = [];
    for (let i = 0; i < metaDatas.length; i++) {
        const metaDataResults = await (0, prisma_historical_data_1.getCandleMetaData)(metaDatas[i]);
        if (typeof metaDataResults.data !== "string") {
            const metaData = metaDataResults.data;
            let item = "";
            if (metaData.symbol.length === 4)
                item = `|    ${metaData.symbol}    `;
            if (metaData.symbol.length === 5)
                item = `|   ${metaData.symbol}    `;
            if (metaData.symbol.length === 6)
                item = `|   ${metaData.symbol}   `;
            if (metaData.symbol.length === 7)
                item = `|   ${metaData.symbol}  `;
            if (metaData.symbol.length === 8)
                item = `|  ${metaData.symbol}  `;
            if (metaData.symbol.length === 9)
                item = `|  ${metaData.symbol} `;
            if (metaData.symbol.length === 10)
                item = `| ${metaData.symbol} `;
            if (metaData.interval.length === 2)
                item += `|   ${metaData.interval}   `;
            if (metaData.interval.length === 3)
                item += `|   ${metaData.interval}  `;
            if (new Date(metaData.startTime).toLocaleString().length === 19)
                item += `|   ${new Date(metaData.startTime).toLocaleString()}    `;
            if (new Date(metaData.startTime).toLocaleString().length === 20)
                item += `|   ${new Date(metaData.startTime).toLocaleString()}   `;
            if (new Date(metaData.startTime).toLocaleString().length === 21)
                item += `|   ${new Date(metaData.startTime).toLocaleString()}  `;
            if (new Date(metaData.startTime).toLocaleString().length === 22)
                item += `|  ${new Date(metaData.startTime).toLocaleString()}  `;
            if (new Date(metaData.endTime).toLocaleString().length === 19)
                item += `|    ${new Date(metaData.endTime).toLocaleString()}   |`;
            if (new Date(metaData.endTime).toLocaleString().length === 20)
                item += `|   ${new Date(metaData.endTime).toLocaleString()}   |`;
            if (new Date(metaData.endTime).toLocaleString().length === 21)
                item += `|   ${new Date(metaData.endTime).toLocaleString()}  |`;
            if (new Date(metaData.endTime).toLocaleString().length === 22)
                item += `|  ${new Date(metaData.endTime).toLocaleString()}  |`;
            parsedMetaCandles.push(item);
        }
    }
    return parsedMetaCandles;
}
exports.parseHistoricalData = parseHistoricalData;
async function removeUnusedCandles(candles, requiredTime) {
    for (let i = 0; i < candles.length; i++) {
        if (candles[i][6] > requiredTime)
            return candles.splice(i);
    }
}
exports.removeUnusedCandles = removeUnusedCandles;
async function findCandleIndex(candles, startTime, endTime) {
    let gotStartIndex = false;
    let indexes = { startIndex: 0, endIndex: 0 };
    for (let i = 0; i < candles.length; i++) {
        if (!gotStartIndex && candles[i].closeTime >= startTime) {
            gotStartIndex = true;
            indexes.startIndex = i;
        }
        if (candles[i].closeTime >= endTime) {
            indexes.endIndex = i;
            return indexes;
        }
    }
    if (indexes.startIndex === 0)
        indexes.startIndex = startTime;
    if (indexes.endIndex === 0)
        indexes.endIndex = endTime;
    return indexes;
}
exports.findCandleIndex = findCandleIndex;
function getDiffInDays(startDate, endDate) {
    const startTime = new Date(startDate);
    const endTime = new Date(endDate);
    const timeDiff = Math.abs(endTime.getTime() - startTime.getTime());
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
    const seconds = Math.floor((timeDiff / 1000) % 60);
    return `${days} days ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
}
exports.getDiffInDays = getDiffInDays;
function getDiffInDaysPercentage(startDate, endDate, percentage) {
    const startTime = new Date(startDate);
    const endTime = new Date(endDate);
    const timeDiff = Math.abs(endTime.getTime() - startTime.getTime());
    const timeDiffReduced = timeDiff * percentage;
    const days = Math.floor(timeDiffReduced / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiffReduced / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeDiffReduced / (1000 * 60)) % 60);
    const seconds = Math.floor((timeDiffReduced / 1000) % 60);
    return `${days} days ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
}
exports.getDiffInDaysPercentage = getDiffInDaysPercentage;
function parseRunResults(runResults) {
    const parsedRunResults = {
        winningTradeAmount: 0,
        losingTradeAmount: 0,
        averageWinAmount: 0,
        averageLossAmount: 0,
        buyAmount: 0,
        sellAmount: 0,
        averageBuyAmount: 0,
        averageSellAmount: 0,
        highestTradeWin: 0,
        highestTradeWinDate: "",
        highestTradeLoss: 0,
        highestTradeLossDate: "",
        highestBuyAmount: 0,
        highestBuyAmountDate: "",
        highestSellAmount: 0,
        highestSellAmountDate: "",
        lowestBuyAmount: 0,
        lowestBuyAmountDate: "",
        lowestSellAmount: 0,
        lowestSellAmountDate: "",
        averageTradePercent: 0,
        winRatePercent: 0,
        lossRatePercent: 0,
        averageWinPercent: 0,
        averageLossPercent: 0,
        highestTradeWinPercentage: 0,
        highestTradeWinPercentageDate: "",
        highestTradeLossPercentage: 0,
        highestTradeLossPercentageDate: "",
    };
    for (let i = 0; i < runResults.length; i++) {
        if (runResults[i].profitAmount > 0) {
            parsedRunResults.winningTradeAmount++;
            parsedRunResults.averageWinAmount += runResults[i].profitAmount;
            parsedRunResults.averageWinPercent += runResults[i].profitPercent;
            if (runResults[i].profitPercent > parsedRunResults.highestTradeWinPercentage) {
                parsedRunResults.highestTradeWinPercentage = runResults[i].profitPercent;
                parsedRunResults.highestTradeWinPercentageDate = new Date(runResults[i].time).toLocaleString();
            }
        }
        if (runResults[i].profitAmount < 0) {
            parsedRunResults.losingTradeAmount++;
            parsedRunResults.averageLossAmount += runResults[i].profitAmount;
            parsedRunResults.averageLossPercent += runResults[i].profitPercent;
            if (parsedRunResults.highestTradeLossPercentage === 0) {
                parsedRunResults.highestTradeLossPercentage = runResults[i].profitPercent;
                parsedRunResults.highestTradeLossPercentageDate = new Date(runResults[i].time).toLocaleString();
            }
            if (parsedRunResults.highestTradeLossPercentage !== 0 &&
                runResults[i].profitPercent < parsedRunResults.highestTradeLossPercentage) {
                parsedRunResults.highestTradeLossPercentage = runResults[i].profitPercent;
                parsedRunResults.highestTradeLossPercentageDate = new Date(runResults[i].time).toLocaleString();
            }
        }
        if (runResults[i].type === "buy") {
            parsedRunResults.buyAmount++;
            parsedRunResults.averageBuyAmount += runResults[i].amount;
        }
        if (runResults[i].type === "sell") {
            parsedRunResults.sellAmount++;
            parsedRunResults.averageSellAmount += runResults[i].amount;
        }
        if (runResults[i].profitAmount > parsedRunResults.highestTradeWin) {
            parsedRunResults.highestTradeWin = runResults[i].profitAmount;
            parsedRunResults.highestTradeWinDate = new Date(runResults[i].time).toLocaleString();
        }
        if (parsedRunResults.highestTradeLoss === 0 && runResults[i].profitAmount < 0) {
            parsedRunResults.highestTradeLoss = runResults[i].profitAmount;
            parsedRunResults.highestTradeLossDate = new Date(runResults[i].time).toLocaleString();
        }
        if (parsedRunResults.highestTradeLoss !== 0 && runResults[i].profitAmount < parsedRunResults.highestTradeLoss) {
            parsedRunResults.highestTradeLoss = runResults[i].profitAmount;
            parsedRunResults.highestTradeLossDate = new Date(runResults[i].time).toLocaleString();
        }
        if (runResults[i].type === "buy" && runResults[i].amount > parsedRunResults.highestBuyAmount) {
            parsedRunResults.highestBuyAmount = runResults[i].amount;
            parsedRunResults.highestBuyAmountDate = new Date(runResults[i].time).toLocaleString();
        }
        if (runResults[i].type === "sell" && runResults[i].amount > parsedRunResults.highestSellAmount) {
            parsedRunResults.highestSellAmount = runResults[i].amount;
            parsedRunResults.highestSellAmountDate = new Date(runResults[i].time).toLocaleString();
        }
        if (parsedRunResults.lowestBuyAmount === 0 && runResults[i].type === "buy" && runResults[i].amount !== 0) {
            parsedRunResults.lowestBuyAmount = runResults[i].amount;
            parsedRunResults.lowestBuyAmountDate = new Date(runResults[i].time).toLocaleString();
        }
        if (parsedRunResults.lowestBuyAmount !== 0 &&
            runResults[i].type === "buy" &&
            runResults[i].amount < parsedRunResults.lowestBuyAmount) {
            parsedRunResults.lowestBuyAmount = runResults[i].amount;
            parsedRunResults.lowestBuyAmountDate = new Date(runResults[i].time).toLocaleString();
        }
        if (parsedRunResults.lowestSellAmount === 0 && runResults[i].type === "sell" && runResults[i].amount !== 0) {
            parsedRunResults.lowestSellAmount = runResults[i].amount;
            parsedRunResults.lowestSellAmountDate = new Date(runResults[i].time).toLocaleString();
        }
        if (parsedRunResults.lowestSellAmount !== 0 &&
            runResults[i].type === "sell" &&
            runResults[i].amount < parsedRunResults.lowestSellAmount) {
            parsedRunResults.lowestSellAmount = runResults[i].amount;
            parsedRunResults.lowestSellAmountDate = new Date(runResults[i].time).toLocaleString();
        }
    }
    parsedRunResults.averageWinAmount /= parsedRunResults.winningTradeAmount;
    parsedRunResults.averageLossAmount /= parsedRunResults.losingTradeAmount;
    parsedRunResults.averageBuyAmount /= parsedRunResults.buyAmount;
    parsedRunResults.averageSellAmount /= parsedRunResults.sellAmount;
    parsedRunResults.averageTradePercent = +(((parsedRunResults.winningTradeAmount + parsedRunResults.losingTradeAmount) /
        (parsedRunResults.averageWinPercent + parsedRunResults.averageLossAmount)) *
        100).toFixed(2);
    parsedRunResults.winRatePercent = +((parsedRunResults.winningTradeAmount / (parsedRunResults.winningTradeAmount + parsedRunResults.losingTradeAmount)) *
        100).toFixed(2);
    parsedRunResults.lossRatePercent = +((parsedRunResults.losingTradeAmount / (parsedRunResults.winningTradeAmount + parsedRunResults.losingTradeAmount)) *
        100).toFixed(2);
    parsedRunResults.averageWinPercent /= parsedRunResults.winningTradeAmount;
    parsedRunResults.averageLossPercent /= parsedRunResults.losingTradeAmount;
    return parsedRunResults;
}
exports.parseRunResults = parseRunResults;
async function parseRunResultsStats(runResultsParams) {
    const runResultStats = parseRunResults(runResultsParams.allOrders);
    const startingDate = new Date(runResultsParams.startTime).toLocaleString();
    const endingDate = new Date(runResultsParams.endTime).toLocaleString();
    const metaDataResults = await (0, prisma_historical_data_1.getCandleMetaData)(runResultsParams.historicalDataName);
    let historicalMetaData;
    if (metaDataResults.error)
        return { error: true, data: "Failed to get candle metaData check that the candle still exists" };
    if (typeof metaDataResults.data !== "string") {
        historicalMetaData = metaDataResults.data;
    }
    else
        return { error: true, data: "Failed to get candle metaData check that the candle still exists" };
    const diffInDaysCandlesInvestedPercentage = (runResultsParams.runMetaData.numberOfCandlesInvested / runResultsParams.runMetaData.numberOfCandles) * 100;
    const diffInDaysCandlesInvested = getDiffInDaysPercentage(runResultsParams.startTime, runResultsParams.endTime, diffInDaysCandlesInvestedPercentage / 100);
    const totals = [
        {
            name: `Start ${historicalMetaData.quote} Amount`,
            amount: runResultsParams.startingAmount,
            percent: "-",
            date: startingDate,
        },
        {
            name: `End ${historicalMetaData.quote} Amount`,
            amount: runResultsParams.allOrders[runResultsParams.allOrders.length - 1].worth,
            percent: `${+((runResultsParams.allOrders[runResultsParams.allOrders.length - 1].worth / runResultsParams.startingAmount) *
                100).toFixed(2)}%`,
            date: endingDate,
        },
        {
            name: `${runResultsParams.startingAmount < runResultsParams.allOrders[runResultsParams.allOrders.length - 1].worth
                ? "Won"
                : "Loss"} ${historicalMetaData.quote} Amount`,
            amount: runResultsParams.startingAmount < runResultsParams.allOrders[runResultsParams.allOrders.length - 1].worth
                ? round(runResultsParams.allOrders[runResultsParams.allOrders.length - 1].worth - runResultsParams.startingAmount)
                : round(runResultsParams.startingAmount - runResultsParams.allOrders[runResultsParams.allOrders.length - 1].worth),
            percent: `${-(((runResultsParams.startingAmount - runResultsParams.allOrders[runResultsParams.allOrders.length - 1].worth) /
                runResultsParams.startingAmount) *
                100).toFixed(2)}%`,
            date: `Duration: ${getDiffInDays(runResultsParams.startTime, runResultsParams.endTime)}`,
        },
        {
            name: "Sharpe Ratio",
            amount: runResultsParams.runMetaData.sharpeRatio === 10000
                ? "Need > 1 Year"
                : roundTo(runResultsParams.runMetaData.sharpeRatio, 6),
            percent: "-",
            date: `Duration: ${getDiffInDays(runResultsParams.startTime, runResultsParams.endTime)}`,
        },
        {
            name: `Highest ${historicalMetaData.quote} Amount`,
            amount: runResultsParams.runMetaData.highestAmount,
            percent: `${-(((runResultsParams.startingAmount - runResultsParams.runMetaData.highestAmount) /
                runResultsParams.startingAmount) *
                100).toFixed(2)}%`,
            date: new Date(runResultsParams.runMetaData.highestAmountDate).toLocaleString(),
        },
        {
            name: `Lowest ${historicalMetaData.quote} Amount`,
            amount: runResultsParams.runMetaData.lowestAmount,
            percent: `${-(((runResultsParams.startingAmount - runResultsParams.runMetaData.lowestAmount) /
                runResultsParams.startingAmount) *
                100).toFixed(2)}%`,
            date: new Date(runResultsParams.runMetaData.lowestAmountDate).toLocaleString(),
        },
        {
            name: "Max Drawdown Amount",
            amount: runResultsParams.runMetaData.maxDrawdownAmount,
            percent: "-",
            date: runResultsParams.runMetaData.maxDrawdownAmountDates,
        },
        {
            name: "Max Drawdown %",
            amount: "-",
            percent: `${+-runResultsParams.runMetaData.maxDrawdownPercent}%`,
            date: runResultsParams.runMetaData.maxDrawdownPercentDates,
        },
        {
            name: "Number Of Candles",
            amount: runResultsParams.runMetaData.numberOfCandles,
            percent: "-",
            date: `Duration: ${getDiffInDays(runResultsParams.startTime, runResultsParams.endTime)}`,
        },
        {
            name: "Number Of Candles Invested",
            amount: runResultsParams.runMetaData.numberOfCandlesInvested,
            percent: `${diffInDaysCandlesInvestedPercentage.toFixed(2)}%`,
            date: `Duration: ${diffInDaysCandlesInvested}`,
        },
    ];
    const trades = [
        {
            name: "Amount Of Winning Trades",
            amount: runResultStats.winningTradeAmount,
            percent: `${runResultStats.winRatePercent}%`,
            date: "-",
        },
        {
            name: "Amount Of Losing Trades",
            amount: runResultStats.losingTradeAmount,
            percent: `${runResultStats.lossRatePercent}%`,
            date: "-",
        },
        {
            name: "Average Wins",
            amount: round(runResultStats.averageWinAmount),
            percent: `${runResultStats.averageWinPercent.toFixed(2)}%`,
            date: "-",
        },
        {
            name: "Average Losses",
            amount: round(runResultStats.averageLossAmount),
            percent: `${runResultStats.averageLossPercent.toFixed(2)}%`,
            date: "-",
        },
        {
            name: "Highest Trade Win Amount",
            amount: runResultStats.highestTradeWin,
            percent: "-",
            date: runResultStats.highestTradeWinDate,
        },
        {
            name: "Highest Trade Win %",
            amount: "-",
            percent: `${runResultStats.highestTradeWinPercentage}%`,
            date: runResultStats.highestTradeWinPercentageDate,
        },
        {
            name: "Highest Trade Loss Amount",
            amount: runResultStats.highestTradeLoss,
            percent: "-",
            date: runResultStats.highestTradeLossDate,
        },
        {
            name: "Highest Trade Loss %",
            amount: "-",
            percent: `${runResultStats.highestTradeLossPercentage}%`,
            date: runResultStats.highestTradeLossPercentageDate,
        },
        {
            name: "Average Trade Result %",
            amount: "-",
            percent: `${runResultStats.averageTradePercent.toFixed(2)}%`,
            date: "-",
        },
    ];
    const tradeBuySellAmounts = [
        { name: "Amount Of Buys", amount: runResultStats.buyAmount, date: "-" },
        { name: "Amount Of Sells", amount: runResultStats.sellAmount, date: "-" },
        { name: "Average Buy Amount", amount: round(runResultStats.averageBuyAmount), date: "-" },
        { name: "Average Sell Amount", amount: round(runResultStats.averageSellAmount), date: "-" },
        { name: "Highest Buy Amount", amount: runResultStats.highestBuyAmount, date: runResultStats.highestBuyAmountDate },
        {
            name: "Highest Sell Amount",
            amount: runResultStats.highestSellAmount,
            date: runResultStats.highestSellAmountDate,
        },
        { name: "Lowest Buy Amount", amount: runResultStats.lowestBuyAmount, date: runResultStats.lowestBuyAmountDate },
        { name: "Lowest Sell Amount", amount: runResultStats.lowestSellAmount, date: runResultStats.lowestSellAmountDate },
    ];
    const assetAmountsPercentages = [
        {
            name: `Start ${historicalMetaData.base} Amount`,
            amount: runResultsParams.runMetaData.startingAssetAmount,
            percent: "-",
            date: new Date(runResultsParams.runMetaData.startingAssetAmountDate).toLocaleString(),
        },
        {
            name: `End ${historicalMetaData.base} Amount`,
            amount: runResultsParams.runMetaData.endingAssetAmount,
            percent: "-",
            date: new Date(runResultsParams.runMetaData.endingAssetAmountDate).toLocaleString(),
        },
        {
            name: `${historicalMetaData.base} ${runResultsParams.runMetaData.startingAssetAmount < runResultsParams.runMetaData.endingAssetAmount
                ? "Went Up"
                : "Went Down"}`,
            amount: runResultsParams.runMetaData.startingAssetAmount < runResultsParams.runMetaData.endingAssetAmount
                ? round(runResultsParams.runMetaData.endingAssetAmount - runResultsParams.runMetaData.startingAssetAmount)
                : round(runResultsParams.runMetaData.startingAssetAmount - runResultsParams.runMetaData.endingAssetAmount),
            percent: `${-(((runResultsParams.runMetaData.startingAssetAmount - runResultsParams.runMetaData.endingAssetAmount) /
                runResultsParams.runMetaData.startingAssetAmount) *
                100).toFixed(2)}%`,
            date: `Duration: ${getDiffInDays(runResultsParams.runMetaData.startingAssetAmountDate, runResultsParams.runMetaData.endingAssetAmountDate)}`,
        },
        {
            name: `${historicalMetaData.base} Highest`,
            amount: runResultsParams.runMetaData.highestAssetAmount,
            percent: `${-(((runResultsParams.runMetaData.startingAssetAmount - runResultsParams.runMetaData.highestAssetAmount) /
                runResultsParams.runMetaData.startingAssetAmount) *
                100).toFixed(2)}%`,
            date: new Date(runResultsParams.runMetaData.highestAssetAmountDate).toLocaleString(),
        },
        {
            name: `${historicalMetaData.base} Lowest`,
            amount: runResultsParams.runMetaData.lowestAssetAmount,
            percent: `${-(((runResultsParams.runMetaData.startingAssetAmount - runResultsParams.runMetaData.lowestAssetAmount) /
                runResultsParams.runMetaData.startingAssetAmount) *
                100).toFixed(2)}%`,
            date: new Date(runResultsParams.runMetaData.lowestAssetAmountDate).toLocaleString(),
        },
        {
            name: `${historicalMetaData.base} Lowest To Highest`,
            amount: runResultsParams.runMetaData.highestAssetAmount - runResultsParams.runMetaData.lowestAssetAmount,
            percent: `${-(((runResultsParams.runMetaData.lowestAssetAmount - runResultsParams.runMetaData.highestAssetAmount) /
                runResultsParams.runMetaData.lowestAssetAmount) *
                100).toFixed(2)}%`,
            date: `Duration: ${getDiffInDays(runResultsParams.runMetaData.highestAssetAmountDate < runResultsParams.runMetaData.lowestAssetAmountDate
                ? runResultsParams.runMetaData.highestAssetAmountDate
                : runResultsParams.runMetaData.lowestAssetAmountDate, runResultsParams.runMetaData.highestAssetAmountDate < runResultsParams.runMetaData.lowestAssetAmountDate
                ? runResultsParams.runMetaData.lowestAssetAmountDate
                : runResultsParams.runMetaData.highestAssetAmountDate)}`,
        },
    ];
    let paramsArray = Object.entries(runResultsParams.params).map(([key, value]) => ({
        name: `Parameter - ${key}`,
        value: value,
    }));
    const generalData = [
        { name: "Strategy Name", value: runResultsParams.strategyName },
        { name: "Symbol", value: historicalMetaData.symbol },
        { name: "Symbol Base", value: historicalMetaData.base },
        { name: "Quote", value: historicalMetaData.quote },
        { name: "Interval", value: historicalMetaData.interval },
        { name: "Tax Fee (%)", value: runResultsParams.txFee },
        { name: "Slippage (%)", value: runResultsParams.slippage },
        { name: "Exported", value: new Date().toLocaleString() },
    ];
    generalData.splice(1, 0, ...paramsArray);
    return { error: false, data: { totals, assetAmountsPercentages, trades, tradeBuySellAmounts, generalData } };
}
exports.parseRunResultsStats = parseRunResultsStats;
async function parseRunResultsStatsMulti(runResultsParams) {
    const metaDataResults = await (0, prisma_historical_data_1.getCandleMetaData)(runResultsParams.symbols[0]);
    let historicalMetaData;
    if (metaDataResults.error)
        return { error: true, data: "Failed to get candle metaData check that the candle still exists" };
    if (typeof metaDataResults.data !== "string") {
        historicalMetaData = metaDataResults.data;
    }
    else
        return { error: true, data: "Failed to get candle metaData check that the candle still exists" };
    const multiSymbol = runResultsParams.isMultiSymbol;
    const quoteName = multiSymbol ? "" : historicalMetaData.quote;
    const assetAmounts = runResultsParams.multiResults[0].assetAmounts;
    const totalDuration = `Duration: ${getDiffInDays(runResultsParams.startTime, runResultsParams.endTime)}`;
    const highestDrawdownAmount = Math.max(...runResultsParams.multiResults.map((obj) => obj.maxDrawdownAmount));
    const highestDrawdownPercent = Math.max(...runResultsParams.multiResults.map((obj) => obj.maxDrawdownPercent));
    const lowestDrawdownAmount = Math.min(...runResultsParams.multiResults.map((obj) => obj.maxDrawdownAmount));
    const lowestDrawdownPercent = Math.min(...runResultsParams.multiResults.map((obj) => obj.maxDrawdownPercent));
    const totalDrawdownAmount = runResultsParams.multiResults.reduce((acc, obj) => acc + obj.maxDrawdownAmount, 0);
    const averageDrawdownAmount = (totalDrawdownAmount / runResultsParams.multiResults.length).toFixed(2);
    const totalDrawdownPercent = runResultsParams.multiResults.reduce((acc, obj) => acc + obj.maxDrawdownPercent, 0);
    const averageDrawdownPercent = (totalDrawdownPercent / runResultsParams.multiResults.length).toFixed(2);
    const totalEndAmount = runResultsParams.multiResults.reduce((acc, obj) => acc + obj.endAmount, 0);
    const averageEndAmount = +(totalEndAmount / runResultsParams.multiResults.length).toFixed(2);
    const highestEndAmount = Math.max(...runResultsParams.multiResults.map((obj) => obj.endAmount));
    const lowestEndAmount = Math.min(...runResultsParams.multiResults.map((obj) => obj.endAmount));
    const totals = [
        {
            name: `Start ${quoteName} Amount`,
            amount: runResultsParams.startingAmount,
            percent: "-",
            date: multiSymbol ? "-" : new Date(runResultsParams.startTime).toLocaleString(),
        },
        {
            name: "Number Of Candles",
            amount: multiSymbol ? "-" : assetAmounts.numberOfCandles,
            percent: "-",
            date: multiSymbol ? "-" : totalDuration,
        },
        {
            name: `Average Ending ${quoteName} Amount`,
            amount: averageEndAmount,
            percent: `${-(((runResultsParams.startingAmount - averageEndAmount) / runResultsParams.startingAmount) *
                100).toFixed(2)}%`,
            date: multiSymbol ? "-" : totalDuration,
        },
        {
            name: `Highest Ending ${quoteName} Amount`,
            amount: highestEndAmount,
            percent: `${-(((runResultsParams.startingAmount - highestEndAmount) / runResultsParams.startingAmount) *
                100).toFixed(2)}%`,
            date: multiSymbol ? "-" : totalDuration,
        },
        {
            name: `Lowest Ending ${quoteName} Amount`,
            amount: lowestEndAmount,
            percent: `${-(((runResultsParams.startingAmount - lowestEndAmount) / runResultsParams.startingAmount) *
                100).toFixed(2)}%`,
            date: multiSymbol ? "-" : totalDuration,
        },
        {
            name: "Average Drawdown",
            amount: averageDrawdownAmount,
            percent: `${averageDrawdownPercent}%`,
            date: multiSymbol ? "-" : totalDuration,
        },
        {
            name: "Highest Drawdown",
            amount: highestDrawdownAmount,
            percent: `${highestDrawdownPercent}%`,
            date: multiSymbol ? "-" : totalDuration,
        },
        {
            name: "Lowest Drawdown",
            amount: lowestDrawdownAmount,
            percent: `${lowestDrawdownPercent.toFixed(2)}%`,
            date: multiSymbol ? "-" : totalDuration,
        },
    ];
    const assetAmountsPercentages = [
        {
            name: `Start ${historicalMetaData.base} Amount`,
            amount: assetAmounts.startingAssetAmount,
            percent: "-",
            date: new Date(runResultsParams.startTime).toLocaleString(),
        },
        {
            name: `End ${historicalMetaData.base} Amount`,
            amount: assetAmounts.endingAssetAmount,
            percent: "-",
            date: new Date(runResultsParams.endTime).toLocaleString(),
        },
        {
            name: `${historicalMetaData.base} ${assetAmounts.startingAssetAmount < assetAmounts.endingAssetAmount ? "Went Up" : "Went Down"}`,
            amount: assetAmounts.startingAssetAmount < assetAmounts.endingAssetAmount
                ? round(assetAmounts.endingAssetAmount - assetAmounts.startingAssetAmount)
                : round(assetAmounts.startingAssetAmount - assetAmounts.endingAssetAmount),
            percent: `${-(((assetAmounts.startingAssetAmount - assetAmounts.endingAssetAmount) / assetAmounts.startingAssetAmount) *
                100).toFixed(2)}%`,
            date: totalDuration,
        },
        {
            name: `${historicalMetaData.base} Highest`,
            amount: assetAmounts.highestAssetAmount,
            percent: `${-(((assetAmounts.startingAssetAmount - assetAmounts.highestAssetAmount) / assetAmounts.startingAssetAmount) *
                100).toFixed(2)}%`,
            date: new Date(assetAmounts.highestAssetAmountDate).toLocaleString(),
        },
        {
            name: `${historicalMetaData.base} Lowest`,
            amount: assetAmounts.lowestAssetAmount,
            percent: `${-(((assetAmounts.startingAssetAmount - assetAmounts.lowestAssetAmount) / assetAmounts.startingAssetAmount) *
                100).toFixed(2)}%`,
            date: new Date(assetAmounts.lowestAssetAmountDate).toLocaleString(),
        },
        {
            name: `${historicalMetaData.base} Lowest To Highest`,
            amount: assetAmounts.highestAssetAmount - assetAmounts.lowestAssetAmount,
            percent: `${-(((assetAmounts.lowestAssetAmount - assetAmounts.highestAssetAmount) / assetAmounts.lowestAssetAmount) *
                100).toFixed(2)}%`,
            date: `Duration: ${getDiffInDays(assetAmounts.highestAssetAmountDate < assetAmounts.lowestAssetAmountDate
                ? assetAmounts.highestAssetAmountDate
                : assetAmounts.lowestAssetAmountDate, assetAmounts.highestAssetAmountDate < assetAmounts.lowestAssetAmountDate
                ? assetAmounts.lowestAssetAmountDate
                : assetAmounts.highestAssetAmountDate)}`,
        },
    ];
    let paramsArray = Object.entries(runResultsParams.params).map(([key, value]) => ({
        name: `Parameter - ${key}`,
        value: value,
    }));
    let generalData;
    if (multiSymbol) {
        generalData = [
            { name: "Strategy Name", value: runResultsParams.strategyName },
            { name: "Permutation Count", value: runResultsParams.permutationCount },
            { name: "Symbols", value: runResultsParams.symbols },
            { name: "Interval", value: historicalMetaData.interval },
            { name: "TX Fee", value: runResultsParams.txFee },
            { name: "Slippage", value: runResultsParams.slippage },
        ];
    }
    else {
        generalData = [
            { name: "Strategy Name", value: runResultsParams.strategyName },
            { name: "Permutation Count", value: runResultsParams.permutationCount },
            { name: "Symbol", value: historicalMetaData.symbol },
            { name: "Base", value: historicalMetaData.base },
            { name: "Quote", value: historicalMetaData.quote },
            { name: "Interval", value: historicalMetaData.interval },
            { name: "TX Fee", value: runResultsParams.txFee },
            { name: "Slippage", value: runResultsParams.slippage },
        ];
    }
    generalData.splice(1, 0, ...paramsArray);
    return { error: false, data: { totals, assetAmountsPercentages, generalData } };
}
exports.parseRunResultsStatsMulti = parseRunResultsStatsMulti;
function generatePermutations(params) {
    const processedParams = {};
    for (const key in params) {
        processedParams[key] = `${params[key]}`.split(",").map(Number);
    }
    function* cartesianProduct(arrays, index = 0) {
        if (index === arrays.length) {
            yield [];
            return;
        }
        for (const value of arrays[index]) {
            for (const rest of cartesianProduct(arrays, index + 1)) {
                yield [value, ...rest];
            }
        }
    }
    const keys = Object.keys(processedParams);
    const values = Object.values(processedParams);
    const permutations = [];
    for (const combination of cartesianProduct(values)) {
        const permutation = {};
        keys.forEach((key, idx) => {
            permutation[key] = combination[idx];
        });
        permutations.push(permutation);
    }
    return permutations;
}
exports.generatePermutations = generatePermutations;
function removeIndexFromTable(data) {
    const ts = new Transform({
        transform(chunk, enc, cb) {
            cb(null, chunk);
        },
    });
    const logger = new Console({ stdout: ts });
    logger.table(data);
    const table = (ts.read() || "").toString();
    let result = "";
    for (let row of table.split(/[\r\n]+/)) {
        let r = row.replace(/[^┬]*┬/, "┌");
        r = r.replace(/^├─*┼/, "├");
        r = r.replace(/│[^│]*/, "");
        r = r.replace(/^└─*┴/, "└");
        r = r.replace(/'/g, " ");
        result += `${r}\n`;
    }
    console.log(result);
}
exports.removeIndexFromTable = removeIndexFromTable;
function parseMultiResults(data, numberOfCandles, startingAmount, multiSymbol) {
    data.sort((a, b) => b.endAmount - a.endAmount);
    data = data.map((item) => {
        const { maxDrawdownAmount, maxDrawdownPercent, numberOfCandlesInvested, endAmount, assetAmounts, sharpeRatio, symbol, interval, ...rest } = item;
        const maxDrawdown = `${maxDrawdownPercent}% : ${maxDrawdownAmount}`;
        const endAmountUpdated = `${((item.endAmount / startingAmount) * 100).toFixed(2)}% : ${item.endAmount}`;
        const numberOfCandlesInvestedUpdated = `${((item.numberOfCandlesInvested / numberOfCandles) * 100).toFixed(2)}% : ${item.numberOfCandlesInvested} out of ${numberOfCandles}`;
        const sharpeRatioUpdated = sharpeRatio === 10000 ? "Need > 1 Year" : sharpeRatio;
        const returnData = {
            ...rest,
            endAmountUpdated,
            sharpeRatioUpdated,
            maxDrawdown,
            numberOfCandlesInvested: numberOfCandlesInvestedUpdated,
        };
        return multiSymbol ? { symbol, interval, ...returnData } : returnData;
    });
    return data;
}
exports.parseMultiResults = parseMultiResults;
function calculateSharpeRatio(entries, riskFreeRateAnnual = 0.02) {
    if (entries.length < 2) {
        return 10000;
    }
    const intervalMs = new Date(entries[1].time).getTime() - new Date(entries[0].time).getTime();
    const intervalDays = intervalMs / (24 * 60 * 60 * 1000);
    const intervalsPerYear = 365.25 / intervalDays;
    const startTime = new Date(entries[0].time).getTime();
    const endTime = new Date(entries[entries.length - 1].time).getTime();
    if (endTime - startTime < 365.25 * 24 * 60 * 60 * 1000) {
        return 10000;
    }
    let returns = [];
    for (let i = 1; i < entries.length; i++) {
        const returnVal = (entries[i].close - entries[i - 1].close) / entries[i - 1].close;
        returns.push(returnVal);
    }
    const riskFreeRateInterval = Math.pow(1 + riskFreeRateAnnual, intervalDays / 365.25) - 1;
    let excessReturns = returns.map((r) => r - riskFreeRateInterval);
    const averageExcessReturn = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;
    const stdDevExcessReturn = Math.sqrt(excessReturns.reduce((sum, r) => sum + Math.pow(r - averageExcessReturn, 2), 0) / (excessReturns.length - 1));
    return (averageExcessReturn / stdDevExcessReturn) * Math.sqrt(intervalsPerYear);
}
exports.calculateSharpeRatio = calculateSharpeRatio;
//# sourceMappingURL=parse.js.map