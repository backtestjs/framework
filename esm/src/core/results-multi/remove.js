"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMultiResults = void 0;
const prisma_results_multi_1 = require("../../helpers/prisma-results-multi");
async function deleteMultiResults(resultsName) {
    if (!resultsName) {
        return { error: true, data: "Results name is required" };
    }
    const allResultsReturn = await (0, prisma_results_multi_1.getAllMultiResultNames)();
    if (allResultsReturn.error)
        return allResultsReturn;
    const allResults = allResultsReturn.data;
    if (!allResults.includes(resultsName)) {
        return { error: true, data: `Results ${resultsName} not found` };
    }
    return (0, prisma_results_multi_1.deleteMultiResult)(resultsName);
}
exports.deleteMultiResults = deleteMultiResults;
//# sourceMappingURL=remove.js.map