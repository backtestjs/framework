"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveResults = void 0;
const prisma_results_1 = require("../../helpers/prisma-results");
async function saveResults(resultsName, results, override = false) {
    if (!resultsName) {
        return { error: true, data: "Results name is required" };
    }
    results.name = resultsName;
    const allResultsReturn = await (0, prisma_results_1.getAllStrategyResultNames)();
    if (allResultsReturn.error)
        return allResultsReturn;
    const allResults = allResultsReturn.data;
    if (allResults.includes(results.name)) {
        if (!override) {
            return {
                error: true,
                data: `Results ${results.name} has saved results already. Use override option to rewrite them.`,
            };
        }
        else {
            const deleteResults = await (0, prisma_results_1.deleteStrategyResult)(results.name);
            if (deleteResults.error)
                return deleteResults;
        }
    }
    const saveResultsRes = await (0, prisma_results_1.insertResult)(results);
    if (saveResultsRes.error)
        return saveResultsRes;
    return { error: false, data: `Successfully saved trading results for ${results.name}` };
}
exports.saveResults = saveResults;
//# sourceMappingURL=save.js.map