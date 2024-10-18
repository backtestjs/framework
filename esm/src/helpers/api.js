"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCandles = exports.getBaseQuote = exports.getCandleStartDate = void 0;
const axios_1 = __importDefault(require("axios"));
const binanceUrl = "http://api.binance.com";
const versionAPI = "v3";
const endpointExchangeInfo = "exchangeInfo";
const endpointCandles = "klines";
async function callBinanceAPI(endpoint, query) {
    try {
        const url = `${binanceUrl}/api/${versionAPI}/${endpoint}?${query}`;
        const results = await axios_1.default.get(url);
        return { error: false, data: results.data };
    }
    catch (error) {
        return { error: true, data: `Problem accessing Binance with error ${error}` };
    }
}
async function getCandleStartDate(symbol) {
    const candleStart = await getCandles({ symbol, interval: "1m", limit: 1, startTime: 0 });
    if (!candleStart.error)
        candleStart.data = candleStart.data[0][0];
    return candleStart;
}
exports.getCandleStartDate = getCandleStartDate;
async function getBaseQuote(symbol) {
    let query = `symbol=${symbol}`;
    const baseQuote = await callBinanceAPI(endpointExchangeInfo, query);
    if (!baseQuote.error)
        baseQuote.data = { base: baseQuote.data.symbols[0].baseAsset, quote: baseQuote.data.symbols[0].quoteAsset };
    return baseQuote;
}
exports.getBaseQuote = getBaseQuote;
async function getCandles(getCandlesParams) {
    if (getCandlesParams.limit === undefined)
        getCandlesParams.limit = 1000;
    let query = `symbol=${getCandlesParams.symbol}&interval=${getCandlesParams.interval}&limit=${getCandlesParams.limit}`;
    if (getCandlesParams.startTime !== undefined)
        query += `&startTime=${getCandlesParams.startTime}`;
    if (getCandlesParams.endTime !== undefined)
        query += `&endTime=${getCandlesParams.endTime}`;
    return await callBinanceAPI(endpointCandles, query);
}
exports.getCandles = getCandles;
//# sourceMappingURL=api.js.map