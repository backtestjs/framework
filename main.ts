export { findHistoricalDataNames, findHistoricalDataSets, findHistoricalData } from "./src/core/historical-data/find";
export { downloadHistoricalData } from "./src/core/historical-data/download";
export { importFileCSV } from "./src/core/historical-data/import-csv";
export { exportFileCSV } from "./src/core/historical-data/export-csv";
export { deleteHistoricalData } from "./src/core/historical-data/remove";

export { findResultNames, findResults } from "./src/core/results/find";
export { deleteResults } from "./src/core/results/remove";
export { saveResults } from "./src/core/results/save";

export { findMultiResultNames, findMultiResults } from "./src/core/results-multi/find";
export { deleteMultiResults } from "./src/core/results-multi/remove";
export { saveMultiResults } from "./src/core/results-multi/save";

export { findStrategieNames, findStrategies } from "./src/core/strategies/find";
export { runStrategy } from "./src/core/strategies/run";
export { scanStrategies } from "./src/core/strategies/scan";

export {
  RunStrategy,
  BuySell,
  BuySellReal,
  GetCandles,
  UserQuestions,
  Candle,
  MetaCandle,
  BTH,
  OrderBook,
  ImportCSV,
  DataReturn,
  StrategyResult,
  GetStrategyResult,
  StrategyResultMulti,
  Order,
  Worth,
  RunMetaData,
  StrategyMeta,
  LooseObject,
} from "./types/global";

export function debug() {
  console.log("DATABASE_URL: " + (process.env.DATABASE_URL || "file:./db/backtestjs.db"));
}
