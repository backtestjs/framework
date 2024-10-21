import { Candle, MetaCandle } from '../../types/global'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./db/backtestjs.db'
    }
  }
})

export async function insertCandles(
  metaCandle: MetaCandle,
  candles: Candle[]
): Promise<{ error: boolean; data: string }> {
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
    return { error: true, data: `Problem inserting ${metaCandle.name} into the database with error ${error}` }
  }
  return { error: false, data: `Successfully inserted ${metaCandle.name}` }
}

export async function getAllCandleMetaData(): Promise<{ error: boolean; data: MetaCandle[] | string }> {
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
    return { error: false, data: metaCandlesNumber }
  } catch (error) {
    return { error: true, data: `Problem getting all the candle metaData with error ${error}` }
  }
}

export async function getCandleMetaData(name: string): Promise<{ error: boolean; data: MetaCandle | string }> {
  try {
    // Get just the candle metaData without the candles
    const metaCandles = await prisma.metaCandle.findMany({
      where: {
        name: name
      }
    })

    if (!metaCandles?.length) {
      return { error: true, data: `No historical data found for ${name}` }
    }

    const metaCandle = metaCandles[0]
    const { id, ...rest } = metaCandle
    return {
      error: false,
      data: {
        ...rest,
        startTime: Number(rest.startTime),
        endTime: Number(rest.endTime),
        creationTime: Number(rest.creationTime),
        lastUpdatedTime: Number(rest.lastUpdatedTime)
      }
    }
  } catch (error) {
    return { error: true, data: `Problem getting the ${name} metaData with error ${error}` }
  }
}

export async function getCandles(
  name: string
): Promise<{ error: boolean; data: { metaCandles: MetaCandle[]; candles: Candle[] } | string }> {
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
      return { error: true, data: `No entries were found for ${name}` }
    }

    let candles: Candle[] = []
    let metaCandlesNumber: MetaCandle[] = []
    for (let metaCandle of metaCandles) {
      const retrievedCandles = metaCandle.candles.map((candle) => {
        // Convert bigInts to numbers and remove ids
        const { id, metaCandleId, ...rest } = candle
        return {
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

    return { error: false, data: { metaCandles: metaCandlesNumber, candles } }
  } catch (error) {
    return { error: true, data: `Problem getting the ${name} metaData with error ${error}` }
  }
}

export async function updateCandlesAndMetaCandle(
  name: string,
  newCandles: Candle[]
): Promise<{ error: boolean; data: string }> {
  try {
    console.log(`Updating candles for ${name}`)

    // Get existing metaCandle from database
    const existingMetaCandle = await prisma.metaCandle.findUnique({
      where: {
        name: name
      }
    })

    if (!existingMetaCandle) {
      console.log(`No existing MetaCandle found for ${name}`)
      return { error: true, data: `No existing MetaCandle found for ${name}` }
    }

    console.log(`Found existing MetaCandle: ${existingMetaCandle.id}`)

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

    console.log(`Prepared MetaCandle update for id ${existingMetaCandle.id}`)

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

    return { error: false, data: `${newCandles.length} candles updated successfully for ${name}` }
  } catch (error) {
    console.error(`Problem updating ${name} candles:`, error)
    process.exit
    return { error: true, data: `Problem updating ${name} candles with error ${error}` }
  }
}

export async function deleteCandles(name: string): Promise<{ error: boolean; data: string }> {
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
      return { error: true, data: `MetaCandle and Candles for ${name} dont exist` }
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

    return { error: false, data: `Successfully deleted ${name} candles` }
  } catch (error) {
    return { error: true, data: `Error deleting MetaCandle and Candles for ${name}. Error: ${error}` }
  }
}
