import {
  MetaCandle,
  RunStrategy,
  RunStrategyResult,
  RunStrategyResultMulti,
  BuySell,
  Candle,
  Worth,
  AssetAmounts
} from '../helpers/interfaces'

import { realBuy, realSell, orderBook, allOrders, clearOrders, getCurrentWorth } from './orders'
import { dateToString, getDiffInDays, round, generatePermutations, calculateSharpeRatio } from './parse'
import { getCandles as getCandlesFromPrisma } from './prisma-historical-data'
import { getStrategy } from './strategies'
import { BacktestError, ErrorCode } from './error'
import { getIntervals } from '../core/common'
import * as logger from './logger'

export async function run(runParams: RunStrategy): Promise<RunStrategyResult | RunStrategyResultMulti[]> {
  if (!runParams) {
    throw new BacktestError('No options specified', ErrorCode.MissingInput)
  }

  if (!runParams.strategyName) {
    throw new BacktestError('Strategy name must be specified', ErrorCode.MissingInput)
  }

  if (!runParams.historicalData?.length) {
    throw new BacktestError('Historical data names must be specified', ErrorCode.MissingInput)
  }

  const strategyFilePath = getStrategy(runParams.strategyName, runParams.rootPath)
  if (!strategyFilePath) {
    throw new BacktestError(`Strategy file ${runParams.strategyName}.ts not found.`, ErrorCode.StrategyNotFound)
  }

  // Delete the cached version of the strategy file so that it is always freshly loaded
  runParams.alwaysFreshLoad && delete require.cache[require.resolve(strategyFilePath)]
  const strategy = await import(strategyFilePath)
  const runStartTime = new Date().getTime()

  if (strategy?.runStrategy === undefined) {
    throw new BacktestError(
      `${runParams.strategyName} file does not have a function with the name of runStrategy.\nIt is mandatory to export a function with this name:\n\nexport async function runStrategy(bth: BTH) {}`,
      ErrorCode.StrategyError
    )
  }

  let returnError = { error: false, data: '' }
  let multiSymbol = runParams.historicalData.length > 1
  let multiParams = false
  let permutations = [{}]
  let permutationReturn: RunStrategyResultMulti[] = []

  // Evaluate if is necessary add permutations
  if (Object.keys(runParams.params).length !== 0) {
    for (const key in runParams.params) {
      const paramsKey = runParams.params[key]
      if (
        (typeof paramsKey === 'string' && paramsKey.includes(',')) ||
        (Array.isArray(paramsKey) && paramsKey.length > 1)
      ) {
        logger.trace(`Found multiple values for ${key}`)
        multiParams = true
        permutations = generatePermutations(runParams.params)
        break
      }
    }
  }

  const supportCandles: Candle[] = []
  const supportCandlesByInterval = {} as any

  const historicalNames = [...new Set(runParams.historicalData)]
  const supportHistoricalNames = [...new Set(runParams.supportHistoricalData)]

  // Preload all support historical data
  let basePair: string | undefined = undefined
  for (let supportCount = 0; supportCount < supportHistoricalNames.length; supportCount++) {
    const candlesRequest = await getCandlesFromPrisma(supportHistoricalNames[supportCount])
    if (!candlesRequest) {
      throw new BacktestError(`Candles for ${supportHistoricalNames[supportCount]} not found`, ErrorCode.NotFound)
    }

    const candles: Candle[] = candlesRequest.candles
    const metaCandle: MetaCandle | null = candlesRequest.metaCandles?.[0] ?? null

    if (!metaCandle) {
      throw new BacktestError(
        `Historical data for ${supportHistoricalNames[supportCount]} not found`,
        ErrorCode.NotFound
      )
    }

    if (!basePair) {
      basePair = metaCandle.symbol
    } else if (metaCandle.symbol !== basePair) {
      throw new BacktestError(
        `All symbols must have the same base pair. ${metaCandle.symbol} does not match ${basePair}`,
        ErrorCode.InvalidInput
      )
    }

    supportCandlesByInterval[metaCandle.interval] = candles
    supportCandles.push(...candles)
  }

  // Loop and evaluate historical names
  for (let symbolCount = 0; symbolCount < historicalNames.length; symbolCount++) {
    const historicalName = historicalNames[symbolCount]

    const candlesRequest = await getCandlesFromPrisma(historicalName)
    if (!candlesRequest) {
      throw new BacktestError(`Candles for ${historicalName} not found`, ErrorCode.NotFound)
    }

    const candles: Candle[] = candlesRequest.candles
    const historicalData: MetaCandle | null = candlesRequest.metaCandles?.[0] ?? null

    if (!historicalData) {
      throw new BacktestError(`Historical data for ${historicalName} not found`, ErrorCode.NotFound)
    }

    if (!!basePair && basePair != historicalData.symbol) {
      throw new BacktestError(
        `All symbols must have the same base pair. ${historicalData.symbol} does not match ${basePair}`,
        ErrorCode.InvalidInput
      )
    }

    const tradingInterval = historicalData.interval

    for (let permutationCount = 0; permutationCount < permutations.length; permutationCount++) {
      if (multiParams) {
        runParams.params = permutations[permutationCount]
      }

      await _resetOrders(runParams)

      const allWorths: Worth[] = []
      const tradableCandles = candles.filter(
        (c: Candle) => c.closeTime >= runParams.startTime && c.closeTime <= runParams.endTime
      )

      const numberOfCandles = tradableCandles.length
      const firstCandle = tradableCandles[0]
      const lastCandle = tradableCandles[numberOfCandles - 1]
      const runMeta = _initializeRunMetaData(runParams, firstCandle, lastCandle, numberOfCandles)

      // Merge and filter by interval
      const allHistoricalData = Object.assign({}, { [historicalData.interval]: candles }, supportCandlesByInterval)
      const allCandles = _filterAndSortCandles(runParams, tradingInterval, candles, supportCandles)

      for (const currentCandle of allCandles) {
        let canBuySell = true
        const tradingCandle = currentCandle.interval === tradingInterval

        async function buy(buyParams?: BuySell) {
          return _buy(runParams, tradingCandle, canBuySell, currentCandle, returnError, buyParams)
        }

        async function sell(buyParams?: BuySell) {
          return _sell(runParams, tradingCandle, canBuySell, currentCandle, returnError, buyParams)
        }

        async function getCandles(type: keyof Candle | 'candle', start: number, end?: number) {
          return _getCandles(allHistoricalData, canBuySell, currentCandle, returnError, type, start, end)
        }

        if (returnError.error) {
          throw new BacktestError(returnError.data as string, ErrorCode.ActionFailed)
        }

        if (tradingCandle) {
          const { open, high, low, close, closeTime } = currentCandle

          if (orderBook.stopLoss > 0) {
            if (orderBook.baseAmount > 0 && low <= orderBook.stopLoss) {
              await sell({ price: orderBook.stopLoss })
            } else if (orderBook.borrowedBaseAmount > 0 && high >= orderBook.stopLoss) {
              await sell({ price: orderBook.stopLoss })
            }
          }

          if (orderBook.takeProfit > 0) {
            if (orderBook.baseAmount > 0 && high >= orderBook.takeProfit) {
              await sell({ price: orderBook.takeProfit })
            } else if (orderBook.borrowedBaseAmount > 0 && low <= orderBook.takeProfit) {
              await sell({ price: orderBook.takeProfit })
            }
          }

          const worth = await getCurrentWorth(close, high, low, open)

          if (worth.low <= 0) {
            throw new BacktestError(
              `Your worth in this candle dropped to zero or below. It's recommended to manage shorts with stop losses. Lowest worth this candle: ${
                worth.low
              }, Date: ${dateToString(closeTime)}`,
              ErrorCode.StrategyError
            )
          }

          allWorths.push({
            close: worth.close,
            high: worth.high,
            low: worth.low,
            open: worth.open,
            time: closeTime
          })

          if (high > runMeta.highestAssetAmount) {
            runMeta.highestAssetAmount = high
            runMeta.highestAssetAmountDate = closeTime
          }

          if (low < runMeta.lowestAssetAmount) {
            runMeta.lowestAssetAmount = low
            runMeta.lowestAssetAmountDate = closeTime
          }

          if (worth.high > runMeta.highestAmount) {
            runMeta.highestAmount = worth.high
            runMeta.highestAmountDate = closeTime
          }

          if (worth.low < runMeta.lowestAmount) {
            runMeta.lowestAmount = worth.low
            runMeta.lowestAmountDate = closeTime

            if (runMeta.highestAmount - worth.low > runMeta.maxDrawdownAmount) {
              runMeta.maxDrawdownAmount = round(runMeta.highestAmount - worth.low)
              runMeta.maxDrawdownAmountDates = `${dateToString(runMeta.highestAmountDate)} - ${dateToString(
                closeTime
              )} : ${getDiffInDays(runMeta.highestAmountDate, closeTime)}`
            }

            const drawdownPercent = ((runMeta.highestAmount - worth.low) / runMeta.highestAmount) * 100
            if (drawdownPercent > runMeta.maxDrawdownPercent) {
              runMeta.maxDrawdownPercent = round(drawdownPercent)
              runMeta.maxDrawdownPercentDates = `${dateToString(runMeta.highestAmountDate)} - ${dateToString(
                closeTime
              )} : ${getDiffInDays(runMeta.highestAmountDate, closeTime)}`
            }
          }
        }

        try {
          await strategy.runStrategy({
            tradingInterval,
            tradingCandle,
            currentCandle,
            params: runParams.params,
            orderBook,
            allOrders,
            buy,
            sell,
            getCandles
          })
        } catch (error) {
          logger.error(error)
          throw new BacktestError(`Ran into an error running the strategy with error ${error}`, ErrorCode.StrategyError)
        }

        if (returnError.error) {
          throw new BacktestError(returnError.data as string, ErrorCode.ActionFailed)
        }

        if (tradingCandle) {
          if (orderBook.bought) {
            runMeta.numberOfCandlesInvested++

            // Force a sell if we are on last tradable candle
            const currentCandles = allHistoricalData[currentCandle.interval]
            const lastCandle = currentCandles?.slice(-1)[0]
            if (lastCandle && lastCandle.closeTime === currentCandle.closeTime) {
              await sell()
            }
          }
        }
      }

      runMeta.sharpeRatio = calculateSharpeRatio(allWorths)
      logger.debug(`Strategy ${runParams.strategyName} completed in ${Date.now() - runStartTime} ms`)

      if (multiParams || multiSymbol) {
        const assetAmounts: AssetAmounts = {} as AssetAmounts
        assetAmounts.startingAssetAmount = runMeta.startingAssetAmount
        assetAmounts.endingAssetAmount = runMeta.endingAssetAmount
        assetAmounts.highestAssetAmount = runMeta.highestAssetAmount
        assetAmounts.highestAssetAmountDate = runMeta.highestAssetAmountDate
        assetAmounts.lowestAssetAmount = runMeta.lowestAssetAmount
        assetAmounts.lowestAssetAmountDate = runMeta.lowestAssetAmountDate
        assetAmounts.numberOfCandles = numberOfCandles

        if (historicalData) {
          permutationReturn.push({
            ...runParams.params,
            symbol: historicalData.symbol,
            interval: historicalData.interval,
            endAmount: allWorths[allWorths.length - 1].close,
            maxDrawdownAmount: runMeta.maxDrawdownAmount,
            maxDrawdownPercent: runMeta.maxDrawdownPercent,
            numberOfCandlesInvested: runMeta.numberOfCandlesInvested,
            sharpeRatio: runMeta.sharpeRatio,
            assetAmounts
          })
        }
      } else {
        return { allOrders, runMetaData: runMeta, allWorths, allCandles: tradableCandles } as RunStrategyResult
      }
    }
  }

  return permutationReturn
}

async function _resetOrders(runParams: RunStrategy) {
  orderBook.bought = false
  orderBook.boughtLong = false
  orderBook.boughtShort = false
  orderBook.baseAmount = 0
  orderBook.quoteAmount = runParams.startingAmount
  orderBook.borrowedBaseAmount = 0
  orderBook.fakeQuoteAmount = runParams.startingAmount
  orderBook.preBoughtQuoteAmount = runParams.startingAmount
  orderBook.stopLoss = 0
  orderBook.takeProfit = 0
  await clearOrders()
}

function _initializeRunMetaData(
  runParams: RunStrategy,
  firstCandle: Candle,
  lastCandle: Candle,
  numberOfCandles: number
) {
  return {
    highestAmount: runParams.startingAmount,
    highestAmountDate: firstCandle.closeTime,
    lowestAmount: runParams.startingAmount,
    lowestAmountDate: firstCandle.closeTime,
    maxDrawdownAmount: 0,
    maxDrawdownAmountDates: '',
    maxDrawdownPercent: 0,
    maxDrawdownPercentDates: '',
    startingAssetAmount: firstCandle.close,
    startingAssetAmountDate: firstCandle.closeTime,
    endingAssetAmount: lastCandle.close,
    endingAssetAmountDate: lastCandle.closeTime,
    highestAssetAmount: firstCandle.high,
    highestAssetAmountDate: firstCandle.closeTime,
    lowestAssetAmount: firstCandle.low,
    lowestAssetAmountDate: firstCandle.closeTime,
    numberOfCandles: numberOfCandles,
    numberOfCandlesInvested: 0,
    sharpeRatio: 0
  }
}

function _filterAndSortCandles(
  runParams: RunStrategy,
  tradingInterval: string,
  candles: Candle[],
  supportCandles: Candle[]
) {
  const allCandles = [...candles, ...supportCandles.filter((c: Candle) => c.interval !== tradingInterval)].filter(
    (c: Candle) => c.closeTime >= runParams.startTime && c.closeTime <= runParams.endTime
  )

  // Sorted by closeTime (from oldest) and then by interval length (from shortest)
  const intervalOrder = getIntervals()
  allCandles.sort((a, b) => {
    const byTime = a.closeTime - b.closeTime
    if (byTime !== 0) return byTime
    return intervalOrder.indexOf(a.interval) - intervalOrder.indexOf(b.interval)
  })

  return allCandles
}

async function _buy(
  runParams: RunStrategy,
  tradingCandle: boolean,
  canBuySell: boolean,
  currentCandle: Candle,
  returnError: any,
  buyParams?: BuySell
) {
  if (!tradingCandle) {
    throw new BacktestError('Cannot buy on a support candle', ErrorCode.ActionFailed)
  }

  if (!canBuySell) {
    logger.trace('Buy blocked until highest needed candles are met')
  } else {
    buyParams = buyParams || {}
    buyParams.price = buyParams.price || currentCandle.close

    const buyParamsReal = {
      currentClose: currentCandle.close,
      percentFee: runParams.percentFee,
      percentSlippage: runParams.percentSlippage,
      date: currentCandle.closeTime,
      ...buyParams
    }

    if (orderBook.borrowedBaseAmount > 0 && orderBook.baseAmount > 0) {
      if (buyParams.stopLoss && buyParams.stopLoss > 0) {
        returnError = { error: true, data: 'Cannot define a stop loss if in a long and a short' }
      }

      if (buyParams.takeProfit && buyParams.takeProfit > 0) {
        returnError = { error: true, data: 'Cannot define a take profit if in a long and a short' }
      }
    }

    if (buyParams.stopLoss && buyParams.stopLoss > 0) orderBook.stopLoss = buyParams.stopLoss
    if (buyParams.takeProfit && buyParams.takeProfit > 0) orderBook.takeProfit = buyParams.takeProfit

    const buyResults = await realBuy(buyParamsReal)

    if (buyResults) {
      logger.trace(`Real buy performed`)
    }
  }
}

async function _sell(
  runParams: RunStrategy,
  tradingCandle: boolean,
  canBuySell: boolean,
  currentCandle: Candle,
  returnError: any,
  sellParams?: BuySell
) {
  if (!tradingCandle) {
    throw new BacktestError('Cannot sell on a support candle', ErrorCode.ActionFailed)
  }
  if (!canBuySell) {
    logger.trace('Sell blocked until highest needed candles are met')
  } else {
    sellParams = sellParams || {}
    sellParams.price = sellParams.price || currentCandle.close

    const sellParamsReal = {
      currentClose: currentCandle.close,
      percentFee: runParams.percentFee,
      percentSlippage: runParams.percentSlippage,
      date: currentCandle.closeTime,
      ...sellParams
    }

    const sellResults = await realSell(sellParamsReal)

    if (sellResults) {
      logger.trace(`Real sell performed`)
    }
  }
}

async function _getCandles(
  allHistoricalData: any,
  canBuySell: boolean,
  currentCandle: Candle,
  returnError: any,
  type: keyof Candle | 'candle',
  start: number,
  end?: number
) {
  const currentCandles = allHistoricalData[currentCandle.interval]
  const currentCandleCount = currentCandles.length
  const isEndNull = end == null

  const fromIndex = currentCandleCount - start
  const toIndex = isEndNull ? fromIndex + 1 : currentCandleCount - end

  if (currentCandleCount === 0 || fromIndex < 0 || toIndex < 0 || fromIndex >= currentCandleCount) {
    canBuySell = false
    returnError = { error: true, data: 'Cannot define a stop loss if in a long and a short' }
    return isEndNull ? 0 : new Array(fromIndex - toIndex).fill(0)
  }

  const slicedCandles = currentCandles.slice(fromIndex, toIndex)
  const filteredCandles = type === 'candle' ? slicedCandles : slicedCandles.map((c: Candle) => c[type])

  return isEndNull ? currentCandles[fromIndex] : filteredCandles
}
