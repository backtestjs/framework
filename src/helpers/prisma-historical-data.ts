import { Candle, MetaCandle } from '../helpers/interfaces'
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

export async function insertCandles(metaCandle: MetaCandle, candles: Candle[]): Promise<boolean> {
  try {
    // Write metaCandle and candles to the DB
    await prisma.metaCandle.create({
      data: {
        ...metaCandle,
        startTime: BigInt(metaCandle.startTime),
        endTime: BigInt(metaCandle.endTime),
        creationTime: BigInt(metaCandle.creationTime),
        lastUpdatedTime: BigInt(metaCandle.lastUpdatedTime),
        candles: {
          create: candles.map((candle: Candle) => ({
            ...candle,
            openTime: BigInt(candle.openTime),
            closeTime: BigInt(candle.closeTime)
          }))
        }
      }
    })
  } catch (error) {
    throw new BacktestError(
      `Problem inserting ${metaCandle.name} into the database with error ${error}`,
      ErrorCode.Insert
    )
  }

  logger.debug(`Successfully inserted ${metaCandle.name}`)
  return true
}

export async function getAllCandleMetaData(): Promise<MetaCandle[]> {
  try {
    // Get all the candles metaData
    const metaCandles = await prisma.metaCandle.findMany()
    const metaCandlesNumber = metaCandles.map((metaCandle: any) => {
      const { id, ...rest } = metaCandle
      return {
        ...rest,
        startTime: Number(rest.startTime),
        endTime: Number(rest.endTime),
        creationTime: Number(rest.creationTime),
        lastUpdatedTime: Number(rest.lastUpdatedTime)
      }
    })
    return metaCandlesNumber
  } catch (error) {
    throw new BacktestError(`Problem getting all the candle metaData with error ${error}`, ErrorCode.Retrieve)
  }
}

export async function getCandleMetaData(name: string): Promise<MetaCandle | null> {
  try {
    // Get just the candle metaData without the candles
    const metaCandles = await prisma.metaCandle.findMany({
      where: {
        name: name
      }
    })

    if (!metaCandles?.length) {
      return null
    }

    const metaCandle = metaCandles[0]
    const { id, ...rest } = metaCandle
    return {
      ...rest,
      startTime: Number(rest.startTime),
      endTime: Number(rest.endTime),
      creationTime: Number(rest.creationTime),
      lastUpdatedTime: Number(rest.lastUpdatedTime)
    } as MetaCandle
  } catch (error) {
    throw new BacktestError(`Problem getting the ${name} metaData with error ${error}`, ErrorCode.Retrieve)
  }
}

export async function getCandles(name: string): Promise<{ metaCandles: MetaCandle[]; candles: Candle[] } | null> {
  try {
    // Get candles and candle metaData
    const metaCandles = await prisma.metaCandle.findMany({
      where: {
        name: name
      },
      include: {
        candles: true
      }
    })

    if (metaCandles.length === 0) {
      return null
    }

    let candles: Candle[] = []
    let metaCandlesNumber: MetaCandle[] = []
    for (let metaCandle of metaCandles) {
      const retrievedCandles = metaCandle.candles.map((candle) => {
        // Convert bigInts to numbers and remove ids
        const { id, metaCandleId, ...rest } = candle
        return {
          symbol: metaCandle.symbol,
          interval: metaCandle.interval,
          ...rest,
          openTime: Number(rest.openTime),
          closeTime: Number(rest.closeTime)
        }
      })
      candles = candles.concat(retrievedCandles)

      const { id, ...restMetaCandle } = metaCandle
      metaCandlesNumber.push({
        ...restMetaCandle,
        startTime: Number(restMetaCandle.startTime),
        endTime: Number(restMetaCandle.endTime),
        creationTime: Number(restMetaCandle.creationTime),
        lastUpdatedTime: Number(restMetaCandle.lastUpdatedTime)
      })
    }

    // Sort candles by closeTime
    candles.sort((a, b) => a.closeTime - b.closeTime)

    return { metaCandles: metaCandlesNumber, candles }
  } catch (error) {
    throw new BacktestError(`Problem getting the ${name} metaData with error ${error}`, ErrorCode.Retrieve)
  }
}

export async function updateCandlesAndMetaCandle(name: string, newCandles: Candle[]): Promise<boolean> {
  try {
    // Get existing metaCandle from database
    const existingMetaCandle = await prisma.metaCandle.findUnique({
      where: {
        name: name
      }
    })

    if (!existingMetaCandle) {
      throw new BacktestError(`No existing MetaCandle found for ${name}`, ErrorCode.NotFound)
    }

    // Compare start and end times between results times and candle times
    const newStartTime = Math.min(Number(existingMetaCandle.startTime), Number(newCandles[0].closeTime))
    const newEndTime = Math.max(Number(existingMetaCandle.endTime), Number(newCandles[newCandles.length - 1].closeTime))

    const updateMetaCandle = prisma.metaCandle.update({
      where: {
        id: existingMetaCandle.id
      },
      data: {
        startTime: BigInt(newStartTime),
        endTime: BigInt(newEndTime),
        lastUpdatedTime: BigInt(Date.now())
      }
    })

    const createCandles = newCandles.map((candle) => {
      return prisma.candle.create({
        data: {
          ...candle,
          openTime: BigInt(candle.openTime),
          closeTime: BigInt(candle.closeTime),
          metaCandleId: existingMetaCandle.id
        }
      })
    })

    await prisma.$transaction([updateMetaCandle, ...createCandles])

    logger.debug(`${newCandles.length} candles updated successfully for ${name}`)
    return true
  } catch (error) {
    throw new BacktestError(`Problem updating ${name} candles with error ${error}`, ErrorCode.Update)
  }
}

export async function deleteCandles(name: string): Promise<boolean> {
  try {
    // Get the MetaCandle ID
    const metaCandle = await prisma.metaCandle.findUnique({
      where: {
        name: name
      },
      select: {
        id: true
      }
    })

    if (!metaCandle) {
      throw new BacktestError(`MetaCandle and Candles for ${name} dont exist`, ErrorCode.NotFound)
    }

    // Delete all the candles
    await prisma.candle.deleteMany({
      where: {
        metaCandleId: metaCandle.id
      }
    })

    // Delete the MetaCandle
    await prisma.metaCandle.delete({
      where: {
        id: metaCandle.id
      }
    })

    logger.debug(`Successfully deleted ${name} candles`)
    return true
  } catch (error) {
    throw new BacktestError(`Error deleting MetaCandle and Candles for ${name}. Error: ${error}`, ErrorCode.Delete)
  }
}
