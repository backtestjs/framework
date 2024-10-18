"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStrategyResult = exports.getResult = exports.getAllStrategyResultNames = exports.getAllStrategyResults = exports.insertResult = void 0;
const prisma_historical_data_1 = require("./prisma-historical-data");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || "file:./db/backtestjs.db",
        },
    },
});
async function insertResult(result) {
    try {
        const strategyResult = await prisma.strategyResult.create({
            data: {
                name: result.name,
                historicalDataName: result.historicalDataName,
                strategyName: result.strategyName,
                startTime: BigInt(result.startTime),
                endTime: BigInt(result.endTime),
                txFee: result.txFee,
                slippage: result.slippage,
                startingAmount: result.startingAmount,
                params: JSON.stringify(result.params),
            },
        });
        const runMetaData = await prisma.runMetaData.create({
            data: {
                ...result.runMetaData,
                highestAmountDate: BigInt(result.runMetaData.highestAmountDate),
                lowestAmountDate: BigInt(result.runMetaData.lowestAmountDate),
                startingAssetAmountDate: BigInt(result.runMetaData.startingAssetAmountDate),
                endingAssetAmountDate: BigInt(result.runMetaData.endingAssetAmountDate),
                highestAssetAmountDate: BigInt(result.runMetaData.highestAssetAmountDate),
                lowestAssetAmountDate: BigInt(result.runMetaData.lowestAssetAmountDate),
                StrategyResultId: strategyResult.id,
            },
        });
        const allOrders = result.allOrders.map((order) => ({
            ...order,
            note: order.note || "",
            time: BigInt(order.time),
        }));
        const allWorths = result.allWorths.map((worth) => ({
            ...worth,
            time: BigInt(worth.time),
        }));
        await prisma.strategyResult.update({
            where: { id: strategyResult.id },
            data: {
                runMetaDataId: runMetaData.id,
                allOrders: {
                    create: allOrders,
                },
                allWorths: {
                    create: allWorths,
                },
            },
        });
        return { error: false, data: `Successfully inserted result: ${result.name}` };
    }
    catch (error) {
        return { error: true, data: `Problem inserting result with error: ${error}` };
    }
}
exports.insertResult = insertResult;
async function getAllStrategyResults() {
    try {
        const strategyResults = await prisma.strategyResult.findMany({
            select: { name: true },
        });
        const results = await Promise.all(strategyResults.map(async (result) => { var _a; return (_a = (await getResult(result.name))) === null || _a === void 0 ? void 0 : _a.data; }));
        return { error: false, data: results };
    }
    catch (error) {
        return { error: true, data: `Problem getting results with error: ${error}` };
    }
}
exports.getAllStrategyResults = getAllStrategyResults;
async function getAllStrategyResultNames() {
    try {
        const strategyResults = await prisma.strategyResult.findMany({
            select: { name: true },
        });
        const names = strategyResults.map((result) => result.name);
        return { error: false, data: names };
    }
    catch (error) {
        return { error: true, data: `Problem getting results with error: ${error}` };
    }
}
exports.getAllStrategyResultNames = getAllStrategyResultNames;
async function getResult(name) {
    try {
        const strategyResult = await prisma.strategyResult.findUnique({
            where: { name },
            include: {
                runMetaData: true,
                allOrders: true,
                allWorths: true,
            },
        });
        if (!strategyResult) {
            return { error: true, data: `StrategyResult with name ${name} does not exist.` };
        }
        const candlesResult = await (0, prisma_historical_data_1.getCandles)(strategyResult.historicalDataName);
        if (candlesResult.error || typeof candlesResult.data === "string") {
            return {
                error: true,
                data: `Problem fetching candles with historicalDataName: ${strategyResult.historicalDataName}`,
            };
        }
        let filteredCandles = candlesResult.data.candles.filter((candle) => candle.openTime >= Number(strategyResult.startTime) && candle.closeTime <= Number(strategyResult.endTime));
        const allOrders = strategyResult.allOrders.map((order) => {
            const { id, StrategyResultId, ...rest } = order;
            return {
                ...rest,
                time: Number(rest.time),
            };
        });
        const allWorths = strategyResult.allWorths.map((worth) => {
            const { id, StrategyResultId, ...rest } = worth;
            return {
                ...rest,
                time: Number(rest.time),
            };
        });
        if (strategyResult.runMetaData) {
            const { id, StrategyResultId, ...runMetaDataRest } = strategyResult.runMetaData;
            const runMetaData = {
                ...runMetaDataRest,
                highestAmountDate: Number(runMetaDataRest.highestAmountDate),
                lowestAmountDate: Number(runMetaDataRest.lowestAmountDate),
                highestAssetAmountDate: Number(runMetaDataRest.highestAssetAmountDate),
                lowestAssetAmountDate: Number(runMetaDataRest.lowestAssetAmountDate),
                startingAssetAmountDate: Number(runMetaDataRest.startingAssetAmountDate),
                endingAssetAmountDate: Number(runMetaDataRest.endingAssetAmountDate),
            };
            const { id: strategyResultId, ...strategyResultRest } = strategyResult;
            const getResult = {
                ...strategyResultRest,
                startTime: Number(strategyResultRest.startTime),
                endTime: Number(strategyResultRest.endTime),
                params: JSON.parse(strategyResultRest.params),
                candleMetaData: candlesResult.data.metaCandles[0],
                candles: filteredCandles,
                allOrders,
                allWorths,
                runMetaData,
            };
            return { error: false, data: getResult };
        }
        else {
            return { error: true, data: "runMetaData is null" };
        }
    }
    catch (error) {
        return { error: true, data: `Failed to get result with error ${error}` };
    }
}
exports.getResult = getResult;
async function deleteStrategyResult(name) {
    try {
        const strategyResult = await prisma.strategyResult.findUnique({
            where: { name },
        });
        if (!strategyResult) {
            return { error: false, data: `StrategyResult with name ${name} does not exist.` };
        }
        const strategyResultId = strategyResult.id;
        try {
            await prisma.order.deleteMany({
                where: {
                    StrategyResultId: strategyResultId,
                },
            });
        }
        catch (error) {
            return {
                error: true,
                data: `Failed to delete related Order records for StrategyResult with name: ${name}. Error: ${error}`,
            };
        }
        try {
            await prisma.worth.deleteMany({
                where: {
                    StrategyResultId: strategyResultId,
                },
            });
        }
        catch (error) {
            return {
                error: true,
                data: `Failed to delete related Worth records for StrategyResult with name: ${name}. Error: ${error}`,
            };
        }
        try {
            await prisma.runMetaData.deleteMany({
                where: {
                    StrategyResultId: strategyResultId,
                },
            });
        }
        catch (error) {
            return {
                error: true,
                data: `Failed to delete related RunMetaData records for StrategyResult with name: ${name}. Error: ${error}`,
            };
        }
        await prisma.strategyResult.delete({
            where: { id: strategyResultId },
        });
        return { error: false, data: `Successfully deleted ${name}` };
    }
    catch (error) {
        return { error: true, data: `Failed to delete StrategyResult with name: ${name}. Error: ${error}` };
    }
}
exports.deleteStrategyResult = deleteStrategyResult;
//# sourceMappingURL=prisma-results.js.map