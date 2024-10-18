"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStrategy = exports.deleteStrategy = exports.updateLastRunTime = exports.getStrategy = exports.getAllStrategies = exports.insertStrategy = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || "file:./db/backtestjs.db",
        },
    },
});
async function insertStrategy(strategy) {
    try {
        await prisma.strategy.create({
            data: {
                ...strategy,
                params: JSON.stringify(strategy.params),
                creationTime: BigInt(strategy.creationTime),
                lastRunTime: BigInt(strategy.lastRunTime),
            },
        });
        return {
            error: false,
            data: `Successfully inserted strategy: ${strategy.name}`,
        };
    }
    catch (error) {
        return {
            error: true,
            data: `Problem inserting strategy with error: ${error}`,
        };
    }
}
exports.insertStrategy = insertStrategy;
async function getAllStrategies() {
    try {
        const strategies = await prisma.strategy.findMany();
        const strategyMetas = strategies.map((strategy) => ({
            ...strategy,
            params: JSON.parse(strategy.params),
            creationTime: Number(strategy.creationTime),
            lastRunTime: Number(strategy.lastRunTime),
        }));
        return { error: false, data: strategyMetas };
    }
    catch (error) {
        return {
            error: true,
            data: `Problem getting all strategies with error: ${error}`,
        };
    }
}
exports.getAllStrategies = getAllStrategies;
async function getStrategy(name) {
    try {
        const strategy = await prisma.strategy.findUnique({ where: { name } });
        if (!strategy) {
            return { error: true, data: `Strategy with name: ${name} not found` };
        }
        const strategyMeta = {
            ...strategy,
            params: JSON.parse(strategy.params),
            creationTime: Number(strategy.creationTime),
            lastRunTime: Number(strategy.lastRunTime),
        };
        return { error: false, data: strategyMeta };
    }
    catch (error) {
        return {
            error: true,
            data: `Problem getting strategy with error: ${error}`,
        };
    }
}
exports.getStrategy = getStrategy;
async function updateLastRunTime(name, lastRunTime) {
    try {
        const strategy = await prisma.strategy.update({
            where: { name },
            data: { lastRunTime: BigInt(lastRunTime) },
        });
        return {
            error: false,
            data: `Successfully updated lastRunTime for strategy: ${strategy.name}`,
        };
    }
    catch (error) {
        return {
            error: true,
            data: `Problem updating lastRunTime with error: ${error}`,
        };
    }
}
exports.updateLastRunTime = updateLastRunTime;
async function deleteStrategy(name) {
    try {
        await prisma.strategy.delete({ where: { name } });
        return { error: false, data: `Successfully deleted strategy: ${name}` };
    }
    catch (error) {
        return {
            error: true,
            data: `Problem deleting strategy with error: ${error}`,
        };
    }
}
exports.deleteStrategy = deleteStrategy;
async function updateStrategy(strategy) {
    try {
        await prisma.strategy.update({
            where: { name: strategy.name },
            data: {
                ...strategy,
                params: JSON.stringify(strategy.params),
                creationTime: BigInt(strategy.creationTime),
                lastRunTime: BigInt(strategy.lastRunTime),
            },
        });
        return {
            error: false,
            data: `Successfully updated strategy: ${strategy.name}`,
        };
    }
    catch (error) {
        return {
            error: true,
            data: `Problem updating strategy with error: ${error}`,
        };
    }
}
exports.updateStrategy = updateStrategy;
//# sourceMappingURL=prisma-strategies.js.map