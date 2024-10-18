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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCSV = exports.importCSV = void 0;
const prisma_historical_data_1 = require("./prisma-historical-data");
const csvtojson_1 = __importDefault(require("csvtojson"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function getNormalizedField(json, possibleFields) {
    const normalizedFields = Object.keys(json).reduce((acc, key) => {
        acc[key.toLowerCase()] = key;
        return acc;
    }, {});
    for (const field of possibleFields) {
        if (normalizedFields[field.toLowerCase()]) {
            return normalizedFields[field.toLowerCase()];
        }
    }
    return null;
}
function getFieldKeys(json, fields) {
    const fieldKeys = {};
    for (const [key, possibleFields] of Object.entries(fields)) {
        const fieldKey = getNormalizedField(json, possibleFields);
        if (fieldKey) {
            fieldKeys[key] = fieldKey;
        }
        else {
            throw new Error(`CSV does not have a valid ${possibleFields.join(", ")} field`);
        }
    }
    return fieldKeys;
}
function getOptionalFieldKeys(json, fields) {
    const optionalFields = {};
    for (const [key, possibleFields] of Object.entries(fields)) {
        const fieldKey = getNormalizedField(json, possibleFields);
        if (fieldKey) {
            optionalFields[key] = fieldKey;
        }
    }
    return optionalFields;
}
async function importCSV(importCSVParams) {
    let jsonCSV;
    try {
        jsonCSV = await (0, csvtojson_1.default)().fromFile(importCSVParams.path);
    }
    catch (error) {
        return { error: true, data: `Path ${importCSVParams.path} does not exist or is incorrect` };
    }
    const json = jsonCSV[0];
    const requiredFields = {
        closeTime: ["closeTime", "date"],
        open: ["open"],
        close: ["close"],
        low: ["low"],
        high: ["high"],
    };
    const optionalFields = {
        openTime: ["openTime"],
        volume: ["volume"],
        assetVolume: ["assetVolume"],
        numberOfTrades: ["numberOfTrades"],
    };
    try {
        const fieldKeys = getFieldKeys(json, requiredFields);
        const optionalFileds = getOptionalFieldKeys(json, optionalFields);
        const jsonParsedCandles = jsonCSV.map((entry) => ({
            openTime: optionalFileds.openTime ? new Date(+entry[optionalFileds.openTime]).getTime() : 0,
            open: +entry[fieldKeys.open],
            high: +entry[fieldKeys.high],
            low: +entry[fieldKeys.low],
            close: +entry[fieldKeys.close],
            volume: optionalFileds.volume ? +entry[optionalFileds.volume] : 0,
            closeTime: new Date(+entry[fieldKeys.closeTime]).getTime(),
            assetVolume: optionalFileds.assetVolume ? +entry[optionalFileds.assetVolume] : 0,
            numberOfTrades: optionalFileds.numberOfTrades ? +entry[optionalFileds.numberOfTrades] : 0,
        }));
        const meta = {
            name: `${importCSVParams.base + importCSVParams.quote}-${importCSVParams.interval}`,
            symbol: importCSVParams.base + importCSVParams.quote,
            interval: importCSVParams.interval,
            base: importCSVParams.base,
            quote: importCSVParams.quote,
            startTime: jsonParsedCandles[0].closeTime,
            endTime: jsonParsedCandles[jsonParsedCandles.length - 1].closeTime,
            importedFromCSV: true,
            creationTime: new Date().getTime(),
            lastUpdatedTime: new Date().getTime(),
        };
        const insertedCandles = await (0, prisma_historical_data_1.insertCandles)(meta, jsonParsedCandles);
        if (insertedCandles.error)
            return insertedCandles;
        return {
            error: false,
            data: `Successfully imported ${importCSVParams.base + importCSVParams.quote} from ${new Date(meta.startTime).toLocaleString()} to ${new Date(meta.endTime).toLocaleString()}`,
        };
    }
    catch (error) {
        return { error: true, data: (error === null || error === void 0 ? void 0 : error.message) || "Generic error !?" };
    }
}
exports.importCSV = importCSV;
async function exportCSV(name, rootPath = "./csv") {
    const candlesRequest = await (0, prisma_historical_data_1.getCandles)(name);
    if (candlesRequest.error)
        return candlesRequest;
    const candles = typeof candlesRequest.data !== "string" ? candlesRequest.data : null;
    if (!candles) {
        return {
            error: true,
            data: `No candles found for name ${name}`,
        };
    }
    const keys = Object.keys(candles.candles[0]);
    const headerRow = keys.join(",") + "\n";
    const dataRows = candles.candles
        .map((obj) => {
        const values = keys.map((key) => {
            const value = obj[key];
            return typeof value === "string" ? `"${value}"` : value;
        });
        return values.join(",");
    })
        .join("\n");
    const dir = rootPath || "./csv";
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    const filePath = path.join(dir, `${name}.csv`);
    fs.writeFileSync(filePath, headerRow + dataRows);
    return { error: false, data: `Successfully exported data to ./csv folder with name ${name}.csv` };
}
exports.exportCSV = exportCSV;
//# sourceMappingURL=csv.js.map