"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMultiResults = exports.findMultiResultNames = void 0;
const prisma_results_multi_1 = require("../../helpers/prisma-results-multi");
async function findMultiResultNames() {
    const allResultsReturn = await (0, prisma_results_multi_1.getAllMultiResultNames)();
    if (allResultsReturn.error)
        return allResultsReturn;
    const resultNames = typeof allResultsReturn.data === "string" ? null : allResultsReturn.data;
    return resultNames;
}
exports.findMultiResultNames = findMultiResultNames;
async function findMultiResults() {
    const allResultsReturn = await (0, prisma_results_multi_1.getAllMultiResults)();
    if (allResultsReturn.error)
        return allResultsReturn;
    const resultNames = typeof allResultsReturn.data === "string" ? null : allResultsReturn.data;
    return resultNames;
}
exports.findMultiResults = findMultiResults;
//# sourceMappingURL=find.js.map