"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteResults = void 0;
const prisma_results_1 = require("../../helpers/prisma-results");
async function deleteResults(resultsName) {
    if (!resultsName) {
        return { error: true, data: "Results name is required" };
    }
    const allResultsReturn = await (0, prisma_results_1.getAllStrategyResultNames)();
    if (allResultsReturn.error)
        return allResultsReturn;
    const allResults = allResultsReturn.data;
    if (!allResults.includes(resultsName)) {
        return { error: true, data: `Results ${resultsName} not found` };
    }
    return (0, prisma_results_1.deleteStrategyResult)(resultsName);
}
exports.deleteResults = deleteResults;
//# sourceMappingURL=remove.js.map