"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findHistoricalData = exports.findHistoricalDataSets = exports.findHistoricalDataNames = void 0;
const prisma_historical_data_1 = require("../../helpers/prisma-historical-data");
async function findHistoricalDataNames() {
    const historicalData = await (0, prisma_historical_data_1.getAllCandleMetaData)();
    if (historicalData.error)
        return historicalData;
    const metaCandleNames = typeof historicalData.data === "string" ? null : historicalData.data.map((data) => data.name);
    return metaCandleNames;
}
exports.findHistoricalDataNames = findHistoricalDataNames;
async function findHistoricalDataSets() {
    const historicalData = await (0, prisma_historical_data_1.getAllCandleMetaData)();
    if (historicalData.error)
        return historicalData;
    const metaCandles = typeof historicalData.data === "string" ? null : historicalData.data;
    return metaCandles;
}
exports.findHistoricalDataSets = findHistoricalDataSets;
async function findHistoricalData(name) {
    const historicalData = await (0, prisma_historical_data_1.getCandleMetaData)(name);
    if (historicalData.error)
        return historicalData;
    const metaCandle = typeof historicalData.data === "string" ? null : historicalData.data;
    return metaCandle;
}
exports.findHistoricalData = findHistoricalData;
//# sourceMappingURL=find.js.map