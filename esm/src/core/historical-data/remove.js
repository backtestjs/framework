"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHistoricalData = void 0;
const prisma_historical_data_1 = require("../../helpers/prisma-historical-data");
async function deleteHistoricalData(name) {
    if (!name) {
        return { error: false, data: "Name is required" };
    }
    return (0, prisma_historical_data_1.deleteCandles)(name);
}
exports.deleteHistoricalData = deleteHistoricalData;
//# sourceMappingURL=remove.js.map