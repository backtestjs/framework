import {
  LooseObject,
  RunStrategyResult,
  RunStrategyResultMulti,
  MetaCandle,
  StrategyMeta,
  RunStrategy,
  GetStrategyResult,
  StrategyResultMulti
} from '../../helpers/interfaces'

import { getAllStrategies, getStrategy, updateLastRunTime } from '../../helpers/prisma-strategies'
import { getAllCandleMetaData, getCandleMetaData } from '../../helpers/prisma-historical-data'
import { run } from '../../helpers/run-strategy'
import { BacktestError, ErrorCode } from '../../helpers/error'
import { dateToString } from '../../helpers/parse'

export async function runStrategy(options: RunStrategy) {
  if (!options) {
    throw new BacktestError('No options specified', ErrorCode.MissingInput)
  }
  if (!options.strategyName) {
    throw new BacktestError('Strategy name must be specified', ErrorCode.MissingInput)
  }
  if (!options.historicalData?.length) {
    throw new BacktestError('Historical data names must be specified', ErrorCode.MissingInput)
  }

  const data = {
    percentFee: 0,
    percentSlippage: 0,
    ...options
  }

  data.startingAmount = data.startingAmount || 1000

  // Create run params
  const runParams: RunStrategy = {
    strategyName: options.strategyName,
    historicalData: [],
    supportHistoricalData: options.supportHistoricalData || [],
    startingAmount: 0,
    startTime: 0,
    endTime: 0,
    params: {},
    percentFee: 0,
    percentSlippage: 0,
    rootPath: options.rootPath
  }

  // Get all strategies
  const strategyMetaDatas = await getAllStrategies()
  if (!strategyMetaDatas?.length) {
    throw new BacktestError('There are no saved strategies', ErrorCode.StrategyNotFound)
  }

  const strategyToRun: StrategyMeta | undefined = strategyMetaDatas.find(
    (strategy: StrategyMeta) => strategy.name == options.strategyName
  )
  if (!strategyToRun) {
    throw new BacktestError(`Strategy ${options.strategyName} not found`, ErrorCode.StrategyNotFound)
  }

  // Get all historical metaData
  let historicalDataSets: MetaCandle[] = await getAllCandleMetaData()
  if (!historicalDataSets?.length) {
    throw new BacktestError('There are no saved historical data', ErrorCode.NotFound)
  }

  historicalDataSets = historicalDataSets.filter((data: MetaCandle) => options.historicalData.includes(data.name))
  if (historicalDataSets.length !== options.historicalData.length) {
    throw new BacktestError('Some historical data sets are missing or duplicated', ErrorCode.NotFound)
  }

  const names: string[] = historicalDataSets.map((data: MetaCandle) => data.name)
  runParams.historicalData.push(...names)

  // Define if running with multiple symbols
  const isMultiSymbol = runParams.historicalData.length > 1

  // Get candle metaData
  const firstHistoricalData = await getCandleMetaData(runParams.historicalData[0])
  if (!firstHistoricalData) {
    throw new BacktestError('Historical data not found', ErrorCode.NotFound)
  }

  // Get stragegy
  const metaDataStrategy = await getStrategy(runParams.strategyName)
  if (!metaDataStrategy) {
    throw new BacktestError('Strategy not found', ErrorCode.StrategyNotFound)
  }

  let paramsCache: LooseObject = {}
  for (const param of Object.keys(data.params)) {
    if (!metaDataStrategy.params.find((p: string) => param == p)) {
      throw new BacktestError(
        `Input param ${param} does not exist in the strategy's properties`,
        ErrorCode.InvalidInput
      )
    }

    let value = data.params[param]
    if (value === undefined || value === '') value = 0
    paramsCache[param] = isNaN(+value) ? value : +value
  }
  runParams.params = paramsCache

  // Set start and end time
  runParams.startTime = new Date(data.startTime || firstHistoricalData.startTime).getTime()
  runParams.endTime = new Date(data.endTime || firstHistoricalData.endTime).getTime()

  // Check if date is valid for all historical data
  for (const data of historicalDataSets) {
    if (runParams.startTime < data.startTime || runParams.startTime > data.endTime) {
      throw new BacktestError(
        `Start date must be between ${dateToString(data.startTime)} and ${dateToString(data.endTime)}`,
        ErrorCode.InvalidInput
      )
    }

    if (runParams.endTime > data.endTime || runParams.endTime <= runParams.startTime) {
      throw new BacktestError(
        `End date must be between ${dateToString(runParams.startTime)} and ${dateToString(data.endTime)}`,
        ErrorCode.InvalidInput
      )
    }
  }

  runParams.startingAmount = +data.startingAmount
  runParams.percentFee = +data.percentFee
  runParams.percentSlippage = +data.percentSlippage

  // Run strategy
  const strageyResults: RunStrategyResult | RunStrategyResultMulti[] = await run(runParams)
  if (!strageyResults) {
    throw new BacktestError('Strategy results not found', ErrorCode.NotFound)
  }

  // Update last run time
  await updateLastRunTime(runParams.strategyName, new Date().getTime())

  const isRunStrategyResult = !Array.isArray(strageyResults) && typeof strageyResults?.runMetaData === 'object'
  if (!isRunStrategyResult || isMultiSymbol) {
    const permutations = strageyResults as RunStrategyResultMulti[]
    return {
      name: `${runParams.strategyName}-${firstHistoricalData.symbol}-multi`,
      strategyName: runParams.strategyName,
      symbols: runParams.historicalData,
      permutationCount: permutations.length,
      params: paramsCache,
      startTime: runParams.startTime,
      endTime: runParams.endTime,
      txFee: runParams.percentFee,
      slippage: runParams.percentSlippage,
      startingAmount: runParams.startingAmount,
      multiResults: permutations,
      isMultiValue: permutations !== undefined,
      isMultiSymbol: isMultiSymbol
    } as StrategyResultMulti
  }

  if (!strageyResults.allOrders?.length) {
    throw new BacktestError(
      'Strategy did not perform any trades over the given time period',
      ErrorCode.TradeNotProcessed
    )
  }

  return {
    name: `${runParams.strategyName}-${firstHistoricalData.name}`,
    historicalDataName: firstHistoricalData.name,
    candleMetaData: firstHistoricalData,
    candles: strageyResults.allCandles,
    strategyName: runParams.strategyName,
    params: runParams.params,
    startTime: runParams.startTime,
    endTime: runParams.endTime,
    startingAmount: runParams.startingAmount,
    txFee: runParams.percentFee,
    slippage: runParams.percentSlippage,
    runMetaData: strageyResults.runMetaData,
    allOrders: strageyResults.allOrders,
    allWorths: strageyResults.allWorths
  } as GetStrategyResult
}
