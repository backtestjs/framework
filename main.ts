export {
  getCandles,
  findHistoricalDataNames,
  findHistoricalDataSets,
  findHistoricalData
} from './src/core/historical-data/find'

export { downloadHistoricalData, getCandleStartDate } from './src/core/historical-data/download'
export { deleteHistoricalData } from './src/core/historical-data/remove'
export { importFileCSV } from './src/core/historical-data/import-csv'
export { exportFileCSV } from './src/core/historical-data/export-csv'

export { findResultNames, findResults, getResult } from './src/core/results/find'
export { deleteResult } from './src/core/results/remove'
export { saveResult } from './src/core/results/save'

export { findMultiResultNames, findMultiResults, getMultiResult } from './src/core/results-multi/find'
export { deleteMultiResult } from './src/core/results-multi/remove'
export { saveMultiResult } from './src/core/results-multi/save'

export { findStrategyNames, findStrategies, findStrategy } from './src/core/strategies/find'
export { runStrategy } from './src/core/strategies/run'
export { scanStrategies } from './src/core/strategies/scan'
export { getIntervals, isValidInterval } from './src/core/common'

export { BacktestError, ErrorCode } from './src/helpers/error'
export { parseRunResultsStats } from './src/helpers/parse'

export {
  RunStrategy,
  BuySell,
  BuySellReal,
  GetCandles,
  Candle,
  MetaCandle,
  BTH,
  OrderBook,
  ImportCSV,
  StrategyResult,
  GetStrategyResult,
  StrategyResultMulti,
  Order,
  Worth,
  RunMetaData,
  StrategyMeta,
  LooseObject
} from './src/helpers/interfaces'

const fs = require('fs')
const path = require('path')
import * as logger from './src/helpers/logger'

export function printInfo() {
  const packageJsonPath = path.join(__dirname, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

  logger.info('Package: ' + packageJson?.name)
  logger.info('Version: ' + packageJson?.version)
  logger.info('Description: ' + packageJson?.description)
  logger.info('env.DATABASE_URL: ' + process.env.DATABASE_URL)
  logger.info('Database Url: ' + (process.env.DATABASE_URL || 'file:./db/backtestjs.db'))
}
