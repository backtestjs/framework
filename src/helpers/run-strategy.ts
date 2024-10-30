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
import { findCandleIndex, getDiffInDays, round, generatePermutations, calculateSharpeRatio } from './parse'
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

  let returnAnError: boolean = false
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

  const historicalNames = [...new Set(runParams.historicalData)]
  const supportHistoricalNames = [...new Set(runParams.supportHistoricalData)]

  const allSupportCandles: Candle[] = []
  const supportHistoricalData = {} as any

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

    supportHistoricalData[metaCandle.interval] = candles
    allSupportCandles.push(...candles)
  }

  // allSupportCandles.sort((a, b) => a.closeTime - b.closeTime)

  const intervalOrder = getIntervals()
  allSupportCandles.sort((a, b) => {
    const byTime = a.closeTime - b.closeTime
    if (byTime !== 0) return byTime
    return intervalOrder.indexOf(a.interval) - intervalOrder.indexOf(b.interval)
  })

  // Run evaluation
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
    let numberOfCandles = 0
    let assetAmounts: AssetAmounts = {} as AssetAmounts

    for (let permutationCount = 0; permutationCount < permutations.length; permutationCount++) {
      if (multiParams) {
        runParams.params = permutations[permutationCount]
      }

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

      const allWorths: Worth[] = []

      let candleIndexes = await findCandleIndex(candles, runParams.startTime, runParams.endTime)
      let candleIndex = candleIndexes.startIndex
      const candleIndexEnd = candleIndexes.endIndex
      let allCandles = candles.slice(candleIndex, candleIndexEnd)
      numberOfCandles = candleIndexEnd - candleIndex

      const runMetaData = {
        highestAmount: runParams.startingAmount,
        highestAmountDate: candles[candleIndex].closeTime,
        lowestAmount: runParams.startingAmount,
        lowestAmountDate: candles[candleIndex].closeTime,
        maxDrawdownAmount: 0,
        maxDrawdownAmountDates: '',
        maxDrawdownPercent: 0,
        maxDrawdownPercentDates: '',
        startingAssetAmount: candles[candleIndex].close,
        startingAssetAmountDate: candles[candleIndex].closeTime,
        endingAssetAmount: candles[candleIndexEnd].close,
        endingAssetAmountDate: candles[candleIndexEnd].closeTime,
        highestAssetAmount: candles[candleIndex].high,
        highestAssetAmountDate: candles[candleIndex].closeTime,
        lowestAssetAmount: candles[candleIndex].low,
        lowestAssetAmountDate: candles[candleIndex].closeTime,
        numberOfCandles,
        numberOfCandlesInvested: 0,
        sharpeRatio: 0
      }

      let fromTime = candles[candleIndex - 1].closeTime

      for (candleIndex; candleIndex < candleIndexEnd; candleIndex++) {
        let canBuySell = true
        const currentCandle = candles[candleIndex]

        // Search and run support caandles
        const toTime = currentCandle.closeTime
        const supportCandles = allSupportCandles.filter(
          (c: Candle) => c.closeTime >= fromTime && c.closeTime < toTime && c.interval !== tradingInterval
        )

        if (supportCandles.length > 0) {
          for (const supportCandle of supportCandles) {
            try {
              await strategy.runStrategy({
                tradingInterval,
                tradingCandle: false,
                currentCandle: supportCandle,
                params: runParams.params,
                orderBook,
                allOrders,
                buy: (buyParams?: BuySell) => {
                  throw new BacktestError('Cannot buy on a support candle', ErrorCode.ActionFailed)
                },
                sell: (sellParams?: BuySell) => {
                  throw new BacktestError('Cannot sell on a support candle', ErrorCode.ActionFailed)
                },
                getCandles: (type: keyof Candle | 'all' | 'ohlc' | 'candle', start: number, end?: number) => {
                  const candleList = supportHistoricalData[supportCandle.interval]
                  const getAll = ['all', 'ohlc', 'candle'].includes(type)
                  if (end === undefined)
                    return getAll ? candleList[candleIndex - start] : candleList[candleIndex - start][type]

                  if (getAll) return candleList.slice(candleIndex - end, candleIndex - start)
                  return candleList.slice(candleIndex - end, candleIndex - start).map((candle) => candle[type])
                }
              })
            } catch (error) {
              throw new BacktestError(
                `Ran into an error running the strategy with error ${error}`,
                ErrorCode.StrategyError
              )
            }
          }
        }

        fromTime = currentCandle.closeTime

        // Define buy and sell methods
        async function buy(buyParams?: BuySell) {
          if (!canBuySell) {
            logger.trace('Buy blocked until highest needed candles are met')
          } else {
            if (buyParams === undefined) buyParams = {}
            if (buyParams.price === undefined) buyParams.price = currentCandle.close

            const buyParamsReal = {
              currentClose: currentCandle.close,
              percentFee: runParams.percentFee,
              percentSlippage: runParams.percentSlippage,
              date: currentCandle.closeTime,
              ...buyParams
            }

            if (
              buyParams.stopLoss !== undefined &&
              buyParams.stopLoss > 0 &&
              orderBook.borrowedBaseAmount > 0 &&
              orderBook.baseAmount > 0
            ) {
              returnAnError = true
              returnError = { error: true, data: 'Cannot define a stop loss if in a long and a short' }
            }

            if (
              buyParams.takeProfit !== undefined &&
              buyParams.takeProfit > 0 &&
              orderBook.borrowedBaseAmount > 0 &&
              orderBook.baseAmount > 0
            ) {
              returnAnError = true
              returnError = { error: true, data: 'Cannot define a take profit if in a long and a short' }
            }

            if (buyParams.stopLoss !== undefined && buyParams.stopLoss > 0) orderBook.stopLoss = buyParams.stopLoss
            if (buyParams.takeProfit !== undefined && buyParams.takeProfit > 0)
              orderBook.takeProfit = buyParams.takeProfit

            const buyResults = await realBuy(buyParamsReal)

            if (buyResults) {
              logger.trace(`Real buy performed`)
            }
          }
        }

        async function sell(sellParams?: BuySell) {
          if (!canBuySell) {
            logger.trace('Sell blocked until highest needed candles are met')
          } else {
            if (sellParams === undefined) sellParams = {}
            if (sellParams.price === undefined) sellParams.price = currentCandle.close

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

        async function getCandles(type: keyof Candle | 'all' | 'ohlc' | 'candle', start: number, end?: number) {
          const candleCheck = end === undefined ? start : end

          if (candleIndex - candleCheck < 0) {
            canBuySell = false
            return end === undefined ? 0 : new Array(end - start).fill(0)
          }

          const getAll = ['all', 'ohlc', 'candle'].includes(type)
          canBuySell = true
          if (end === undefined) return getAll ? candles[candleIndex - start] : candles[candleIndex - start][type]

          if (getAll) return candles.slice(candleIndex - end, candleIndex - start)
          return candles.slice(candleIndex - end, candleIndex - start).map((candle) => candle[type])
        }

        if (returnAnError) {
          throw new BacktestError(returnError.data as string, ErrorCode.ActionFailed)
        }

        if (orderBook.stopLoss > 0) {
          if (orderBook.baseAmount > 0) {
            if (currentCandle.low <= orderBook.stopLoss) await sell({ price: orderBook.stopLoss })
          } else if (orderBook.borrowedBaseAmount > 0) {
            if (currentCandle.high >= orderBook.stopLoss) await sell({ price: orderBook.stopLoss })
          }
        }

        if (orderBook.takeProfit > 0) {
          if (orderBook.baseAmount > 0) {
            if (currentCandle.high >= orderBook.takeProfit) await sell({ price: orderBook.takeProfit })
          } else if (orderBook.borrowedBaseAmount > 0) {
            if (currentCandle.low <= orderBook.takeProfit) await sell({ price: orderBook.takeProfit })
          }
        }

        const worth = await getCurrentWorth(
          currentCandle.close,
          currentCandle.high,
          currentCandle.low,
          currentCandle.open
        )

        if (worth.low <= 0) {
          throw new BacktestError(
            `Your worth in this candle went to 0 or less than 0, it is suggested to handle shorts with stop losses, Lowest worth this candle: ${
              worth.low
            }, Date: ${new Date(currentCandle.closeTime).toLocaleString()}`,
            ErrorCode.StrategyError
          )
        }

        allWorths.push({
          close: worth.close,
          high: worth.high,
          low: worth.low,
          open: worth.open,
          time: currentCandle.closeTime
        })

        if (currentCandle.high > runMetaData.highestAssetAmount) {
          runMetaData.highestAssetAmount = currentCandle.high
          runMetaData.highestAssetAmountDate = currentCandle.closeTime
        }
        if (currentCandle.low < runMetaData.lowestAssetAmount) {
          runMetaData.lowestAssetAmount = currentCandle.low
          runMetaData.lowestAssetAmountDate = currentCandle.closeTime
        }

        if (worth.high > runMetaData.highestAmount) {
          runMetaData.highestAmount = worth.high
          runMetaData.highestAmountDate = currentCandle.closeTime
        }
        if (worth.low < runMetaData.lowestAmount) {
          runMetaData.lowestAmount = worth.low
          runMetaData.lowestAmountDate = currentCandle.closeTime

          if (runMetaData.highestAmount - worth.low > runMetaData.maxDrawdownAmount) {
            runMetaData.maxDrawdownAmount = round(runMetaData.highestAmount - worth.low)
            runMetaData.maxDrawdownAmountDates = `${new Date(
              runMetaData.highestAmountDate
            ).toLocaleString()} - ${new Date(currentCandle.closeTime).toLocaleString()} : ${getDiffInDays(
              runMetaData.highestAmountDate,
              currentCandle.closeTime
            )}`
          }

          const drawdownPercent = ((runMetaData.highestAmount - worth.low) / runMetaData.highestAmount) * 100
          if (drawdownPercent > runMetaData.maxDrawdownPercent) {
            runMetaData.maxDrawdownPercent = round(drawdownPercent)
            runMetaData.maxDrawdownPercentDates = `${new Date(
              runMetaData.highestAmountDate
            ).toLocaleString()} - ${new Date(currentCandle.closeTime).toLocaleString()} : ${getDiffInDays(
              runMetaData.highestAmountDate,
              currentCandle.closeTime
            )}`
          }
        }

        try {
          await strategy.runStrategy({
            tradingInterval,
            tradingCandle: true,
            currentCandle,
            params: runParams.params,
            orderBook,
            allOrders,
            buy,
            sell,
            getCandles
          })
        } catch (error) {
          throw new BacktestError(`Ran into an error running the strategy with error ${error}`, ErrorCode.StrategyError)
        }

        if (returnAnError) {
          throw new BacktestError(returnError.data as string, ErrorCode.ActionFailed)
        }

        if (orderBook.bought) runMetaData.numberOfCandlesInvested++

        if (candleIndex === candleIndexEnd - 1 && orderBook.bought) await sell()
      }

      runMetaData.sharpeRatio = calculateSharpeRatio(allWorths)
      logger.debug(`Strategy ${runParams.strategyName} completed in ${Date.now() - runStartTime} ms`)

      if (multiParams || multiSymbol) {
        assetAmounts.startingAssetAmount = runMetaData.startingAssetAmount
        assetAmounts.endingAssetAmount = runMetaData.endingAssetAmount
        assetAmounts.highestAssetAmount = runMetaData.highestAssetAmount
        assetAmounts.highestAssetAmountDate = runMetaData.highestAssetAmountDate
        assetAmounts.lowestAssetAmount = runMetaData.lowestAssetAmount
        assetAmounts.lowestAssetAmountDate = runMetaData.lowestAssetAmountDate
        assetAmounts.numberOfCandles = numberOfCandles

        if (historicalData) {
          permutationReturn.push({
            ...runParams.params,
            symbol: historicalData.symbol,
            interval: historicalData.interval,
            endAmount: allWorths[allWorths.length - 1].close,
            maxDrawdownAmount: runMetaData.maxDrawdownAmount,
            maxDrawdownPercent: runMetaData.maxDrawdownPercent,
            numberOfCandlesInvested: runMetaData.numberOfCandlesInvested,
            sharpeRatio: runMetaData.sharpeRatio,
            assetAmounts
          })
        }
      } else {
        return { allOrders, runMetaData, allWorths, allCandles } as RunStrategyResult
      }
    }
  }

  return permutationReturn
}
