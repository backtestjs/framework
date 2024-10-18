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
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStrategy = void 0;
const indicator = __importStar(require("technicalindicators"));
async function runStrategy(bth) {
    const lowSMACandles = await bth.getCandles("close", 0, 3);
    const highSMACandles = await bth.getCandles("close", 0, 45);
    const lowSMAs = indicator.SMA.calculate({ period: 3, values: lowSMACandles });
    const highSMAs = indicator.SMA.calculate({ period: 45, values: highSMACandles });
    const lowSMA = lowSMAs[lowSMAs.length - 1];
    const highSMA = highSMAs[highSMAs.length - 1];
    if (lowSMA > highSMA) {
        await bth.buy();
    }
    else {
        await bth.sell();
    }
}
exports.runStrategy = runStrategy;
//# sourceMappingURL=demo.js.map