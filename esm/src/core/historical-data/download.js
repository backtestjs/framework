"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadHistoricalData = void 0;
const historical_data_1 = require("../../helpers/historical-data");
const prisma_historical_data_1 = require("../../helpers/prisma-historical-data");
const api_1 = require("../../helpers/api");
async function downloadHistoricalData(symbol, data) {
    if (!symbol) {
        return { error: true, data: "Symbol is required" };
    }
    if (!data.interval) {
        return { error: true, data: "Interval is required" };
    }
    const historicalMetaDatas = await (0, prisma_historical_data_1.getAllCandleMetaData)();
    if (historicalMetaDatas.error)
        return historicalMetaDatas;
    const historicalDataSets = typeof historicalMetaDatas.data !== "string" ? historicalMetaDatas.data : [];
    let symbolStartDate = await (0, api_1.getCandleStartDate)(symbol);
    if (symbolStartDate.error) {
        symbolStartDate = await (0, api_1.getCandleStartDate)(`${symbol}USDT`);
        if (!symbolStartDate.error)
            symbol = `${symbol}USDT`;
    }
    if (symbolStartDate.error) {
        return { error: true, data: `Symbol ${symbol} does not exist` };
    }
    const symbolStart = symbolStartDate.data;
    if (!historical_data_1.intervals.includes(data.interval)) {
        return { error: true, data: `Interval ${data.interval} does not exist` };
    }
    const isSymbolPresent = historicalDataSets.some((meta) => meta.name === `${symbol}-${data.interval}`);
    if (isSymbolPresent) {
        return {
            error: true,
            data: `Symbol ${symbol} with interval ${data.interval} already exists.`,
        };
    }
    const now = new Date().getTime();
    const startTime = new Date(data.startDate || symbolStart).getTime();
    const endTime = new Date(data.endDate || now).getTime();
    if (startTime < symbolStart || startTime > now) {
        return {
            error: true,
            data: `Start date must be between ${new Date(symbolStart).toLocaleString()} and ${new Date(now).toLocaleString()}`,
        };
    }
    if (endTime > now || endTime <= startTime) {
        return {
            error: true,
            data: `End date must be between ${new Date(startTime).toLocaleString()} and ${new Date(now).toLocaleString()}`,
        };
    }
    const objectGetHistoricalData = {
        symbol: symbol,
        interval: data.interval,
        startTime: startTime,
        endTime: endTime,
    };
    return (0, historical_data_1.saveHistoricalData)(objectGetHistoricalData);
}
exports.downloadHistoricalData = downloadHistoricalData;
//# sourceMappingURL=download.js.map