"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importFileCSV = void 0;
const prisma_historical_data_1 = require("../../helpers/prisma-historical-data");
const historical_data_1 = require("../../helpers/historical-data");
const csv_1 = require("../../helpers/csv");
async function importFileCSV(base, quote, interval, path) {
    if (!base) {
        return {
            error: true,
            data: "Base name (ex: BTC in BTCUSDT or APPL in APPL/USD) is required",
        };
    }
    if (!quote) {
        return {
            error: true,
            data: "Quote name (ex: USDT in BTCUSDT or USD in APPL/USD) is required",
        };
    }
    if (!interval || !historical_data_1.intervals.includes(interval)) {
        return {
            error: true,
            data: `Interval is required. Use one of ${historical_data_1.intervals.join(" ")}`,
        };
    }
    if (!path) {
        return {
            error: true,
            data: "Path to CSV file is required",
        };
    }
    const historicalMetaDatas = await (0, prisma_historical_data_1.getAllCandleMetaData)();
    if (historicalMetaDatas.error)
        return historicalMetaDatas;
    const historicalDataSets = typeof historicalMetaDatas.data !== "string" ? historicalMetaDatas.data : [];
    const isHistoricalDataPresent = historicalDataSets.some((meta) => meta.name === `${base + quote}-${interval}`);
    if (isHistoricalDataPresent) {
        return {
            error: true,
            data: `Historical data already found for ${base + quote} with ${interval} interval.`,
        };
    }
    let filePath = path === null || path === void 0 ? void 0 : path.trim();
    if ((filePath.startsWith(`"`) && filePath.endsWith(`"`)) || (filePath.startsWith(`'`) && filePath.endsWith(`'`))) {
        filePath = filePath.substring(1, filePath.length - 1);
    }
    return (0, csv_1.importCSV)({ interval, base: base.toUpperCase(), quote: quote.toUpperCase(), path: filePath });
}
exports.importFileCSV = importFileCSV;
//# sourceMappingURL=import-csv.js.map