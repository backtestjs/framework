"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStrategy = void 0;
const prisma_strategies_1 = require("../../helpers/prisma-strategies");
const prisma_historical_data_1 = require("../../helpers/prisma-historical-data");
const run_strategy_1 = require("../../helpers/run-strategy");
async function runStrategy(options) {
    var _a, _b;
    if (!options)
        return { error: true, data: "No options specified" };
    if (!options.strategyName)
        return { error: true, data: "Strategy name must be specified" };
    if (!((_a = options.historicalMetaData) === null || _a === void 0 ? void 0 : _a.length))
        return { error: true, data: "Historical data names must be specified" };
    const data = {
        percentFee: 0,
        percentSlippage: 0,
        ...options,
    };
    data.startingAmount = data.startingAmount || 1000;
    const runParams = {
        strategyName: options.strategyName,
        historicalMetaData: [],
        startingAmount: 0,
        startTime: 0,
        endTime: 0,
        params: {},
        percentFee: 0,
        percentSlippage: 0,
        rootPath: options.rootPath,
    };
    const strategyMetaDatas = await (0, prisma_strategies_1.getAllStrategies)();
    if (strategyMetaDatas.error)
        return strategyMetaDatas;
    const strategyToRun = typeof strategyMetaDatas.data !== "string"
        ? strategyMetaDatas.data.find((strategy) => strategy.name == options.strategyName) || null
        : null;
    if (!strategyToRun)
        return { error: true, data: "There are no saved strategies" };
    const historicalMetaDatas = await (0, prisma_historical_data_1.getAllCandleMetaData)();
    if (historicalMetaDatas.error)
        return historicalMetaDatas;
    const historicalDataSets = typeof historicalMetaDatas.data !== "string"
        ? historicalMetaDatas.data.filter((data) => options.historicalMetaData.includes(data.name))
        : [];
    if (!(historicalDataSets === null || historicalDataSets === void 0 ? void 0 : historicalDataSets.length))
        return { error: true, data: "There are no saved historical data" };
    if (historicalDataSets.length !== options.historicalMetaData.length)
        return { error: true, data: "Some historical data sets are missing" };
    const names = historicalDataSets.map((data) => data.name);
    runParams.historicalMetaData.push(...names);
    const isMultiSymbol = runParams.historicalMetaData.length > 1;
    const historicalMetaDataResults = await (0, prisma_historical_data_1.getCandleMetaData)(runParams.historicalMetaData[0]);
    if (historicalMetaDataResults.error)
        return historicalMetaDataResults;
    const historicalMetaData = typeof historicalMetaDataResults.data !== "string" ? historicalMetaDataResults.data : null;
    if (!historicalMetaData) {
        return { error: true, data: "Historical data not found" };
    }
    const metaDataStrategyResults = await (0, prisma_strategies_1.getStrategy)(runParams.strategyName);
    if (metaDataStrategyResults.error)
        return metaDataStrategyResults;
    const metaDataStrategy = typeof metaDataStrategyResults.data !== "string" ? metaDataStrategyResults.data : null;
    if (!metaDataStrategy) {
        return { error: true, data: "Strategy not found" };
    }
    let paramsCache = {};
    for (const param of Object.keys(data.params)) {
        if (!metaDataStrategy.params.find((param) => param.name == param)) {
            return { error: true, data: `Param ${param} does not exist` };
        }
        let value = data.params[param];
        if (value === undefined || value === "")
            value = 0;
        paramsCache[param] = isNaN(+value) ? value : +value;
    }
    runParams.params = paramsCache;
    if (!isMultiSymbol) {
        runParams.startTime = new Date(data.startTime || historicalMetaData.startTime).getTime();
        runParams.endTime = new Date(data.endTime || historicalMetaData.endTime).getTime();
        if (runParams.startTime < historicalMetaData.startTime || runParams.startTime > historicalMetaData.endTime) {
            return {
                error: true,
                data: `Start date must be between ${new Date(historicalMetaData.startTime).toLocaleString()} and ${new Date(historicalMetaData.endTime).toLocaleString()}`,
            };
        }
        if (runParams.endTime > historicalMetaData.endTime || runParams.endTime <= runParams.startTime) {
            return {
                error: true,
                data: `End date must be between ${new Date(runParams.startTime).toLocaleString()} and ${new Date(historicalMetaData.endTime).toLocaleString()}`,
            };
        }
    }
    else {
        runParams.startTime = historicalMetaData.startTime;
        runParams.endTime = historicalMetaData.endTime;
    }
    runParams.startingAmount = +data.startingAmount;
    runParams.percentFee = +data.percentFee;
    runParams.percentSlippage = +data.percentSlippage;
    const runResults = await (0, run_strategy_1.run)(runParams);
    if (runResults.error)
        return runResults;
    const strageyResults = typeof runResults.data !== "string" ? runResults.data : null;
    if (!strageyResults) {
        return { error: true, data: "Strategy results not found" };
    }
    const updateStrategyLastRunTime = await (0, prisma_strategies_1.updateLastRunTime)(runParams.strategyName, new Date().getTime());
    if (updateStrategyLastRunTime.error)
        return updateStrategyLastRunTime;
    if (strageyResults.permutationDataReturn !== undefined || isMultiSymbol) {
        return {
            name: `${runParams.strategyName}-${historicalMetaData.name}-Multi`,
            strategyName: runParams.strategyName,
            symbols: runParams.historicalMetaData,
            permutationCount: strageyResults.permutationDataReturn.length,
            params: paramsCache,
            startTime: runParams.startTime,
            endTime: runParams.endTime,
            txFee: runParams.percentFee,
            slippage: runParams.percentSlippage,
            startingAmount: runParams.startingAmount,
            multiResults: strageyResults.permutationDataReturn,
            isMultiValue: strageyResults.permutationDataReturn !== undefined,
            isMultiSymbol,
        };
    }
    if (!((_b = strageyResults.allOrders) === null || _b === void 0 ? void 0 : _b.length)) {
        return { error: true, data: "Strategy did not perform any trades over the given time period" };
    }
    return {
        name: `${runParams.strategyName}-${historicalMetaData.name}`,
        historicalDataName: historicalMetaData.name,
        candleMetaData: historicalMetaData,
        candles: strageyResults.allCandles,
        strategyName: runParams.strategyName,
        params: runParams.params,
        startTime: runParams.startTime,
        endTime: runParams.endTime,
        txFee: runParams.percentFee,
        slippage: runParams.percentSlippage,
        startingAmount: runParams.startingAmount,
        runMetaData: strageyResults.runMetaData,
        allOrders: strageyResults.allOrders,
        allWorths: strageyResults.allWorths,
    };
}
exports.runStrategy = runStrategy;
//# sourceMappingURL=run.js.map