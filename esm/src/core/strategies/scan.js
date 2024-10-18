"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanStrategies = void 0;
const prisma_strategies_1 = require("../../helpers/prisma-strategies");
const path = require("path");
const fs = __importStar(require("fs"));
async function scanStrategies(rootPath) {
    let allStrategies = await (0, prisma_strategies_1.getAllStrategies)();
    if (allStrategies.error)
        return allStrategies;
    let strategies = typeof allStrategies.data === "string" ? null : allStrategies.data;
    if (!(strategies === null || strategies === void 0 ? void 0 : strategies.length)) {
        strategies = [];
    }
    let isJS = false;
    const doneActions = {};
    const extension = path.extname(__filename);
    if (extension === ".js")
        isJS = true;
    const importPath = !!rootPath ? rootPath : isJS ? `./dist/src/strategies` : `./src/strategies`;
    const importResolvedPath = path.resolve(importPath);
    let files = fs.readdirSync(importResolvedPath);
    if (!(files === null || files === void 0 ? void 0 : files.length)) {
        return {
            error: true,
            data: `No files found to scan`,
        };
    }
    files = files.filter((file) => [".js", ".ts"].includes(path.extname(file)) && !file.endsWith(".d.ts"));
    const fileStrategies = files.map((file) => path.basename(file, path.extname(file)));
    for (const [index, strategyName] of fileStrategies.entries()) {
        const registeredStrategy = strategies.find(({ name }) => name === strategyName);
        const strategy = await (_a = path.join(importResolvedPath, files[index]), Promise.resolve().then(() => __importStar(require(_a))));
        const strategyProperties = strategy.properties || {};
        const meta = {
            name: strategyName,
            params: strategyProperties.params || (registeredStrategy === null || registeredStrategy === void 0 ? void 0 : registeredStrategy.params) || [],
            dynamicParams: strategyProperties.dynamicParams || (registeredStrategy === null || registeredStrategy === void 0 ? void 0 : registeredStrategy.dynamicParams) || false,
            creationTime: (registeredStrategy === null || registeredStrategy === void 0 ? void 0 : registeredStrategy.creationTime) || new Date().getTime(),
            lastRunTime: (registeredStrategy === null || registeredStrategy === void 0 ? void 0 : registeredStrategy.lastRunTime) || 0,
        };
        if (!!(registeredStrategy === null || registeredStrategy === void 0 ? void 0 : registeredStrategy.name)) {
            const saveResults = await (0, prisma_strategies_1.updateStrategy)(meta);
            doneActions[strategyName] = { error: saveResults.error, action: "update" };
            const message = saveResults.error ? saveResults.data : undefined;
            message && (doneActions[strategyName].message = message);
        }
        else {
            const saveResults = await (0, prisma_strategies_1.insertStrategy)(meta);
            doneActions[strategyName] = { error: saveResults.error, action: "insert" };
            const message = saveResults.error ? saveResults.data : undefined;
            message && (doneActions[strategyName].message = message);
        }
    }
    for (const { name: strategyName } of strategies) {
        if (!fileStrategies.includes(strategyName)) {
            const saveResults = await (0, prisma_strategies_1.deleteStrategy)(strategyName);
            doneActions[strategyName] = { error: saveResults.error, action: "delete" };
            const message = saveResults.error ? saveResults.data : undefined;
            message && (doneActions[strategyName].message = message);
        }
    }
    return {
        error: false,
        data: doneActions,
    };
}
exports.scanStrategies = scanStrategies;
//# sourceMappingURL=scan.js.map