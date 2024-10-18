"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMultiResult = exports.getMultiResult = exports.getAllMultiResultNames = exports.getAllMultiResults = exports.insertMultiResult = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || "file:./db/backtestjs.db",
        },
    },
});
async function insertMultiResult(result) {
    try {
        await prisma.strategyResultMulti.create({
            data: {
                ...result,
                name: result.name || `${result.strategyName}-${new Date().getTime()}`,
                symbols: JSON.stringify(result.symbols),
                params: JSON.stringify(result.params),
                multiResults: JSON.stringify(result.multiResults),
                startTime: BigInt(result.startTime),
                endTime: BigInt(result.endTime),
            },
        });
        return { error: false, data: `Successfully inserted multi value result: ${result.name}` };
    }
    catch (error) {
        return { error: true, data: `Problem inserting result with error: ${error}` };
    }
}
exports.insertMultiResult = insertMultiResult;
async function getAllMultiResults() {
    try {
        const strategyResults = await prisma.strategyResultMulti.findMany({
            select: { name: true },
        });
        const results = await Promise.all(strategyResults.map(async (result) => { var _a; return (_a = (await getMultiResult(result.name))) === null || _a === void 0 ? void 0 : _a.data; }));
        return { error: false, data: results };
    }
    catch (error) {
        return { error: true, data: `Problem getting results with error: ${error}` };
    }
}
exports.getAllMultiResults = getAllMultiResults;
async function getAllMultiResultNames() {
    try {
        const strategyResults = await prisma.strategyResultMulti.findMany({
            select: { name: true },
        });
        const names = strategyResults.map((result) => result.name);
        return { error: false, data: names };
    }
    catch (error) {
        return { error: true, data: `Problem getting results with error: ${error}` };
    }
}
exports.getAllMultiResultNames = getAllMultiResultNames;
async function getMultiResult(name) {
    try {
        const result = await prisma.strategyResultMulti.findUnique({
            where: { name },
        });
        if (!result) {
            return { error: true, data: `Failed to find multi value result named ${name}` };
        }
        const parsedResult = {
            ...result,
            symbols: JSON.parse(result.symbols),
            params: JSON.parse(result.params),
            multiResults: JSON.parse(result.multiResults),
            startTime: Number(result.startTime),
            endTime: Number(result.endTime),
        };
        return { error: false, data: parsedResult };
    }
    catch (error) {
        return { error: true, data: `Failed to get result with error ${error}` };
    }
}
exports.getMultiResult = getMultiResult;
async function deleteMultiResult(name) {
    try {
        await prisma.strategyResultMulti.delete({
            where: { name },
        });
        return { error: false, data: `Successfully deleted ${name}` };
    }
    catch (error) {
        return { error: true, data: `Failed to delete StrategyResult with name: ${name}. Error: ${error}` };
    }
}
exports.deleteMultiResult = deleteMultiResult;
//# sourceMappingURL=prisma-results-multi.js.map