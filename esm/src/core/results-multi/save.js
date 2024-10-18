"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveMultiResults = void 0;
const prisma_results_multi_1 = require("../../helpers/prisma-results-multi");
async function saveMultiResults(resultsName, results, override = false) {
    if (!resultsName) {
        return { error: true, data: "Results name is required" };
    }
    results.name = resultsName;
    const allResultsReturn = await (0, prisma_results_multi_1.getAllMultiResultNames)();
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
            const deleteResults = await (0, prisma_results_multi_1.deleteMultiResult)(results.name);
            if (deleteResults.error)
                return deleteResults;
        }
    }
    const saveResultsRes = await (0, prisma_results_multi_1.insertMultiResult)(results);
    if (saveResultsRes.error)
        return saveResultsRes;
    return { error: false, data: `Successfully saved trading results for ${results.name}` };
}
exports.saveMultiResults = saveMultiResults;
//# sourceMappingURL=save.js.map