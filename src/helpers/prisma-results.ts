import { StrategyResult, GetStrategyResult, RunMetaData } from '../helpers/interfaces'
import { getCandles } from './prisma-historical-data'
import { PrismaClient } from '@prisma/client'
import { BacktestError, ErrorCode } from './error'
import * as logger from './logger'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./db/backtestjs.db'
    }
  }
})

export async function insertResult(result: StrategyResult): Promise<boolean> {
  try {
    // Create StrategyResult with historicalDataName (without allOrders and allWorths)
    const strategyResult = await prisma.strategyResult.create({
      data: {
        name: result.name,
        historicalDataName: result.historicalDataName,
        strategyName: result.strategyName,
        startTime: BigInt(result.startTime),
        endTime: BigInt(result.endTime),
        txFee: result.txFee,
        slippage: result.slippage,
        startingAmount: result.startingAmount,
        params: JSON.stringify(result.params)
      }
    })

    // Create runMetaData with StrategyResultId
    const runMetaData = await prisma.runMetaData.create({
      data: {
        ...result.runMetaData,
        highestAmountDate: BigInt(result.runMetaData.highestAmountDate),
        lowestAmountDate: BigInt(result.runMetaData.lowestAmountDate),
        startingAssetAmountDate: BigInt(result.runMetaData.startingAssetAmountDate),
        endingAssetAmountDate: BigInt(result.runMetaData.endingAssetAmountDate),
        highestAssetAmountDate: BigInt(result.runMetaData.highestAssetAmountDate),
        lowestAssetAmountDate: BigInt(result.runMetaData.lowestAssetAmountDate),
        StrategyResultId: strategyResult.id
      }
    })

    const allOrders = result.allOrders.map((order) => ({
      ...order,
      note: order.note || '',
      time: BigInt(order.time)
    }))

    const allWorths = result.allWorths.map((worth) => ({
      ...worth,
      time: BigInt(worth.time)
    }))

    // Update StrategyResult with RunMetaDataId, allOrders, and allWorths
    await prisma.strategyResult.update({
      where: { id: strategyResult.id },
      data: {
        runMetaDataId: runMetaData.id,
        allOrders: {
          create: allOrders
        },
        allWorths: {
          create: allWorths
        }
      }
    })
    logger.debug(`Successfully inserted result: ${result.name}`)
    return true
  } catch (error) {
    throw new BacktestError(`Problem inserting result with error: ${error}`, ErrorCode.Insert)
  }
}

export async function getAllStrategyResults(): Promise<GetStrategyResult[]> {
  try {
    // Get all the strategies names
    const strategyResults = await prisma.strategyResult.findMany({
      select: { name: true }
    })

    const results: GetStrategyResult[] = await Promise.all(
      strategyResults.map(async (result) => await getResult(result.name))
    )
    return results
  } catch (error) {
    throw new BacktestError(`Problem getting results with error: ${error}`, ErrorCode.Retrieve)
  }
}

export async function getAllStrategyResultNames(): Promise<string[]> {
  try {
    // Get all the strategies names
    const strategyResults = await prisma.strategyResult.findMany({
      select: { name: true }
    })

    const names = strategyResults.map((result) => result.name)
    return names
  } catch (error) {
    throw new BacktestError(`Problem getting results with error: ${error}`, ErrorCode.Retrieve)
  }
}

export async function getResult(name: string): Promise<GetStrategyResult> {
  try {
    // Get StrategyResult by name
    const strategyResult = await prisma.strategyResult.findUnique({
      where: { name },
      include: {
        runMetaData: true,
        allOrders: true,
        allWorths: true
      }
    })

    if (!strategyResult) {
      throw new BacktestError(`StrategyResult with name ${name} does not exist`, ErrorCode.NotFound)
    }

    // Get Candles using historicalDataName
    const candlesResult = await getCandles(strategyResult.historicalDataName)
    if (!candlesResult) {
      throw new BacktestError(`Candles with name ${strategyResult.historicalDataName} not found`, ErrorCode.NotFound)
    }

    // Filter candles based on StrategyResult's startTime and endTime
    let filteredCandles = candlesResult.candles.filter(
      (candle) =>
        candle.openTime >= Number(strategyResult.startTime) && candle.closeTime <= Number(strategyResult.endTime)
    )

    // Convert BigInt to Number in allOrders and allWorths
    const allOrders = strategyResult.allOrders.map((order) => {
      const { id, StrategyResultId, ...rest } = order
      return {
        ...rest,
        time: Number(rest.time)
      }
    })
    const allWorths = strategyResult.allWorths.map((worth) => {
      const { id, StrategyResultId, ...rest } = worth
      return {
        ...rest,
        time: Number(rest.time)
      }
    })

    // Convert runMetaData
    if (strategyResult.runMetaData) {
      const { id, StrategyResultId, ...runMetaDataRest } = strategyResult.runMetaData
      const runMetaData: RunMetaData = {
        ...runMetaDataRest,
        highestAmountDate: Number(runMetaDataRest.highestAmountDate),
        lowestAmountDate: Number(runMetaDataRest.lowestAmountDate),
        highestAssetAmountDate: Number(runMetaDataRest.highestAssetAmountDate),
        lowestAssetAmountDate: Number(runMetaDataRest.lowestAssetAmountDate),
        startingAssetAmountDate: Number(runMetaDataRest.startingAssetAmountDate),
        endingAssetAmountDate: Number(runMetaDataRest.endingAssetAmountDate)
      }

      // Form the GetStrategyResult object
      const { id: strategyResultId, ...strategyResultRest } = strategyResult
      const getResult: GetStrategyResult = {
        ...strategyResultRest,
        startTime: Number(strategyResultRest.startTime),
        endTime: Number(strategyResultRest.endTime),
        params: JSON.parse(strategyResultRest.params),
        candleMetaData: candlesResult.metaCandles[0],
        candles: filteredCandles,
        allOrders,
        allWorths,
        runMetaData
      }

      return getResult
    } else {
      throw new BacktestError('Impossible to found runMetaData', ErrorCode.Retrieve)
    }
  } catch (error) {
    throw new BacktestError(`Failed to get result with error ${error}`, ErrorCode.Retrieve)
  }
}

export async function deleteStrategyResult(name: string): Promise<boolean> {
  try {
    // Find the strategy result
    const strategyResult = await prisma.strategyResult.findUnique({
      where: { name }
    })

    if (!strategyResult) {
      throw new BacktestError(`StrategyResult with name ${name} does not exist`, ErrorCode.NotFound)
    }

    const strategyResultId = strategyResult.id

    try {
      // Delete related Order records
      await prisma.order.deleteMany({
        where: {
          StrategyResultId: strategyResultId
        }
      })
    } catch (error) {
      throw new BacktestError(
        `Failed to delete related Order records for StrategyResult with name: ${name}. Error: ${error}`,
        ErrorCode.Delete
      )
    }

    try {
      // Delete related Worth records
      await prisma.worth.deleteMany({
        where: {
          StrategyResultId: strategyResultId
        }
      })
    } catch (error) {
      throw new BacktestError(
        `Failed to delete related Worth records for StrategyResult with name: ${name}. Error: ${error}`,
        ErrorCode.Delete
      )
    }

    try {
      // Delete related RunMetaData records
      await prisma.runMetaData.deleteMany({
        where: {
          StrategyResultId: strategyResultId
        }
      })
    } catch (error) {
      throw new BacktestError(
        `Failed to delete related RunMetaData records for StrategyResult with name: ${name}. Error: ${error}`,
        ErrorCode.Delete
      )
    }

    // Delete the strategy result
    await prisma.strategyResult.delete({
      where: { id: strategyResultId }
    })

    // Return successfully deleted
    logger.debug(`Successfully deleted ${name}`)
    return true
  } catch (error) {
    throw new BacktestError(`Failed to delete StrategyResult with name: ${name}. Error: ${error}`, ErrorCode.Delete)
  }
}
