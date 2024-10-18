"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findStrategies = exports.findStrategieNames = void 0;
const prisma_strategies_1 = require("../../helpers/prisma-strategies");
async function findStrategieNames() {
    const strategies = await findStrategies();
    return Array.isArray(strategies) ? strategies.map((strategy) => strategy.name) : strategies;
}
exports.findStrategieNames = findStrategieNames;
async function findStrategies() {
    let allStrategies = await (0, prisma_strategies_1.getAllStrategies)();
    if (allStrategies.error)
        return allStrategies;
    const strategies = typeof allStrategies.data === "string" ? null : allStrategies.data;
    if (!(strategies === null || strategies === void 0 ? void 0 : strategies.length)) {
        return { error: true, data: `No strategies found` };
    }
    return strategies;
}
exports.findStrategies = findStrategies;
//# sourceMappingURL=find.js.map