"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHistoricalData = exports.saveHistoricalData = exports.intervals = void 0;
const prisma_historical_data_1 = require("./prisma-historical-data");
const parse_1 = require("./parse");
const api_1 = require("./api");
exports.intervals = ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"];
async function getParseSaveCandlesPrivate(runParams, newData) {
    var _a, _b, _c;
    let finishedCandles = false;
    let allCandles = [];
    const metaName = `${runParams.symbol}-${runParams.interval}`;
    async function saveCandlesNew(saveCandles) {
        const baseQuote = await (0, api_1.getBaseQuote)(runParams.symbol);
        if (baseQuote.error)
            return baseQuote;
        const meta = {
            name: metaName,
            symbol: runParams.symbol,
            interval: runParams.interval,
            base: baseQuote.data.base,
            quote: baseQuote.data.quote,
            startTime: saveCandles[0].closeTime,
            endTime: saveCandles[saveCandles.length - 1].closeTime,
            importedFromCSV: false,
            creationTime: new Date().getTime(),
            lastUpdatedTime: new Date().getTime(),
        };
        const insertedCandles = await (0, prisma_historical_data_1.insertCandles)(meta, saveCandles);
        if (insertedCandles.error)
            return insertedCandles;
        return { error: false, data: "" };
    }
    async function saveCandlesUpdate(saveCandles) {
        const insertResults = await (0, prisma_historical_data_1.updateCandlesAndMetaCandle)(metaName, saveCandles);
        if (insertResults.error)
            return insertResults;
        return { error: false, data: "" };
    }
    while (!finishedCandles) {
        const candleRequest = await (0, api_1.getCandles)({
            symbol: runParams.symbol,
            interval: runParams.interval,
            endTime: runParams.endTime,
        });
        runParams.endTime = candleRequest.data[0][6];
        if (candleRequest.error)
            return candleRequest;
        if (((_a = runParams.endTime) !== null && _a !== void 0 ? _a : 0) < ((_b = runParams.startTime) !== null && _b !== void 0 ? _b : 0) || candleRequest.data.length <= 1) {
            if (!(candleRequest.data.length <= 1))
                candleRequest.data = await (0, parse_1.removeUnusedCandles)(candleRequest.data, (_c = runParams.startTime) !== null && _c !== void 0 ? _c : 0);
            finishedCandles = true;
        }
        let candles = await (0, parse_1.parseCandles)(candleRequest.data);
        allCandles = [...candles, ...allCandles];
        if (allCandles.length >= 50000) {
            const saveCandlesResult = newData ? await saveCandlesNew(allCandles) : await saveCandlesUpdate(allCandles);
            if (saveCandlesResult.error)
                return saveCandlesResult;
            newData = false;
            allCandles = [];
        }
    }
    if (allCandles.length > 0) {
        const saveCandlesResult = newData ? await saveCandlesNew(allCandles) : await saveCandlesUpdate(allCandles);
        if (saveCandlesResult.error)
            return saveCandlesResult;
    }
    return { error: false, data: allCandles };
}
async function saveHistoricalData(runParams) {
    const allCandlesResults = await getParseSaveCandlesPrivate(runParams, true);
    if (allCandlesResults.error)
        return allCandlesResults;
    return { error: false, data: `Successfully downloaded ${runParams.symbol} on the ${runParams.interval} interval` };
}
exports.saveHistoricalData = saveHistoricalData;
async function updateHistoricalData(metadata, newTimes) {
    let run = false;
    const metadataCopy = { ...metadata };
    if (newTimes > metadata.endTime) {
        run = true;
        metadataCopy.startTime = metadata.endTime;
        metadataCopy.endTime = newTimes;
    }
    else if (newTimes < metadata.startTime) {
        run = true;
        metadataCopy.startTime = newTimes;
        metadataCopy.endTime = metadata.startTime;
    }
    if (run) {
        const allCandlesResults = await getParseSaveCandlesPrivate(metadataCopy, false);
        if (allCandlesResults.error)
            return allCandlesResults;
    }
    return { error: false, data: `Successfully updated candles for ${metadata.symbol}` };
}
exports.updateHistoricalData = updateHistoricalData;
//# sourceMappingURL=historical-data.js.map