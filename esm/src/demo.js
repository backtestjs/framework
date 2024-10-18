"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("../main");
const path = require("path");
async function main() {
    const downloaded1 = await (0, main_1.downloadHistoricalData)("BTCEUR", {
        interval: "1h",
        startDate: "2024-01-01",
        endDate: "2024-10-15",
    });
    console.log(downloaded1);
    const downloaded = await (0, main_1.downloadHistoricalData)("BTCEUR", {
        interval: "8h",
        startDate: "2024-01-01",
        endDate: "2024-10-15",
    });
    console.log(downloaded);
    const exported = await (0, main_1.exportFileCSV)("BTCEUR-8h");
    console.log(exported);
    const deleted = await (0, main_1.deleteHistoricalData)("BTCEUR-8h");
    console.log(deleted);
    const allNames = await (0, main_1.findHistoricalDataNames)();
    console.log(allNames);
    const allSets = await (0, main_1.findHistoricalDataSets)();
    console.log(allSets);
    const dataSet = await (0, main_1.findHistoricalData)("BTCEUR-8h");
    console.log(dataSet);
    const imported = await (0, main_1.importFileCSV)("BTC", "EUR", "8h", "./csv/BTCEUR-8h.csv");
    console.log(imported);
    const dataSet2 = await (0, main_1.findHistoricalData)("BTCEUR-8h");
    console.log(dataSet2);
    let isJS = false;
    const extension = path.extname(__filename);
    if (extension === ".js")
        isJS = true;
    const strategyPath = isJS ? `./dist/src/strategies` : `./src/strategies`;
    const scan = await (0, main_1.scanStrategies)(strategyPath);
    console.log(scan);
    const strategies = await (0, main_1.findStrategies)();
    console.log(strategies);
    const strategiesNames = await (0, main_1.findStrategieNames)();
    console.log(strategiesNames);
    const runStrategyResult = await (0, main_1.runStrategy)({
        strategyName: "demo",
        historicalMetaData: ["BTCEUR-8h"],
        params: {},
        startingAmount: 1000,
        startTime: new Date("2024-01-14").getTime(),
        endTime: new Date("2024-10-14").getTime(),
    });
    console.log(runStrategyResult);
    const saved = await (0, main_1.saveResults)("demo-results", runStrategyResult, true);
    console.log(saved);
    const resultsNames = await (0, main_1.findResultNames)();
    console.log(resultsNames);
    const allResults = await (0, main_1.findResults)();
    console.log(allResults);
    const deletedResults = await (0, main_1.deleteResults)("demo-results");
    console.log(deletedResults);
    const runMultiStrategyResult = await (0, main_1.runStrategy)({
        strategyName: "demo",
        historicalMetaData: ["BTCEUR-8h", "BTCEUR-1h"],
        params: {},
        startingAmount: 1000,
        startTime: new Date("2023-01-14").getTime(),
        endTime: new Date("2023-10-14").getTime(),
        percentFee: 0,
        percentSlippage: 0,
        rootPath: strategyPath,
    });
    console.log(runMultiStrategyResult);
    const savedMulti = await (0, main_1.saveMultiResults)("demo-multi-results", runMultiStrategyResult);
    console.log(savedMulti);
    const multiResultsNames = await (0, main_1.findMultiResultNames)();
    console.log(multiResultsNames);
    const allMultiResults = await (0, main_1.findMultiResults)();
    console.log(allMultiResults);
    const deletedMultiResults = await (0, main_1.deleteMultiResults)("demo-multi-results");
    console.log(deletedMultiResults);
    const multiResultsNames2 = await (0, main_1.findMultiResultNames)();
    console.log(multiResultsNames2);
}
main();
//# sourceMappingURL=demo.js.map