"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findResults = exports.findResultNames = void 0;
const prisma_results_1 = require("../../helpers/prisma-results");
async function findResultNames() {
    const allResultsReturn = await (0, prisma_results_1.getAllStrategyResultNames)();
    if (allResultsReturn.error)
        return allResultsReturn;
    const resultNames = typeof allResultsReturn.data === "string" ? null : allResultsReturn.data;
    return resultNames;
}
exports.findResultNames = findResultNames;
async function findResults() {
    const allResultsReturn = await (0, prisma_results_1.getAllStrategyResults)();
    if (allResultsReturn.error)
        return allResultsReturn;
    const resultNames = typeof allResultsReturn.data === "string" ? null : allResultsReturn.data;
    return resultNames;
}
exports.findResults = findResults;
//# sourceMappingURL=find.js.map