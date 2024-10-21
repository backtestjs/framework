import {
  LooseObject,
  RunStrategyResult,
  RunStrategyResultMulti,
  MetaCandle,
  StrategyMeta,
  RunStrategy
} from '../../../types/global'
import { getAllStrategies, getStrategy, updateLastRunTime } from '../../helpers/prisma-strategies'
import { getAllCandleMetaData, getCandleMetaData } from '../../helpers/prisma-historical-data'
import { run } from '../../helpers/run-strategy'
import { BacktestError, ErrorCode } from '../../helpers/error'

export async function runStrategy(options: RunStrategy) {
  if (!options) {
    throw new BacktestError('No options specified', ErrorCode.MissingInput)
  }
  if (!options.strategyName) {
    throw new BacktestError('Strategy name must be specified', ErrorCode.MissingInput)
  }
  if (!options.historicalMetaData?.length) {
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
    historicalMetaData: [],
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

  historicalDataSets = historicalDataSets.filter((data: MetaCandle) => options.historicalMetaData.includes(data.name))
  if (historicalDataSets.length !== options.historicalMetaData.length) {
    throw new BacktestError('Some historical data sets are missing', ErrorCode.NotFound)
  }

  const names: string[] = historicalDataSets.map((data: MetaCandle) => data.name)
  runParams.historicalMetaData.push(...names)

  // Define if running with multiple symbols
  const isMultiSymbol = runParams.historicalMetaData.length > 1

  // Get candle metaData
  const historicalMetaData = await getCandleMetaData(runParams.historicalMetaData[0])
  if (!historicalMetaData) {
    throw new BacktestError('Historical data not found', ErrorCode.NotFound)
  }

  // Get stragegy
  const metaDataStrategy = await getStrategy(runParams.strategyName)
  if (!metaDataStrategy) {
    throw new BacktestError('Strategy not found', ErrorCode.StrategyNotFound)
  }

  let paramsCache: LooseObject = {}

  for (const param of Object.keys(data.params)) {
    if (!metaDataStrategy.params.find((param: any) => param.name == param)) {
      throw new BacktestError(`Param ${param} does not exist`, ErrorCode.InvalidInput)
    }

    let value = data.params[param]
    if (value === undefined || value === '') value = 0
    paramsCache[param] = isNaN(+value) ? value : +value
  }
  runParams.params = paramsCache

  if (!isMultiSymbol) {
    runParams.startTime = new Date(data.startTime || historicalMetaData.startTime).getTime()
    runParams.endTime = new Date(data.endTime || historicalMetaData.endTime).getTime()

    if (runParams.startTime < historicalMetaData.startTime || runParams.startTime > historicalMetaData.endTime) {
      throw new BacktestError(
        `Start date must be between ${new Date(historicalMetaData.startTime).toLocaleString()} and ${new Date(
          historicalMetaData.endTime
        ).toLocaleString()}`,
        ErrorCode.InvalidInput
      )
    }

    if (runParams.endTime > historicalMetaData.endTime || runParams.endTime <= runParams.startTime) {
      throw new BacktestError(
        `End date must be between ${new Date(runParams.startTime).toLocaleString()} and ${new Date(
          historicalMetaData.endTime
        ).toLocaleString()}`,
        ErrorCode.InvalidInput
      )
    }
  } else {
    runParams.startTime = historicalMetaData.startTime
    runParams.endTime = historicalMetaData.endTime
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
      name: `${runParams.strategyName}-${historicalMetaData.name}-Multi`,
      strategyName: runParams.strategyName,
      symbols: runParams.historicalMetaData,
      permutationCount: permutations.length,
      params: paramsCache,
      startTime: runParams.startTime,
      endTime: runParams.endTime,
      txFee: runParams.percentFee,
      slippage: runParams.percentSlippage,
      startingAmount: runParams.startingAmount,
      multiResults: permutations,
      isMultiValue: permutations !== undefined,
      isMultiSymbol
    }
  }

  if (!strageyResults.allOrders?.length) {
    throw new BacktestError(
      'Strategy did not perform any trades over the given time period',
      ErrorCode.TradeNotProcessed
    )
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
    allWorths: strageyResults.allWorths
  }
}
