import { StrategyResultMulti } from '../../types/global'
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

export async function insertMultiResult(result: StrategyResultMulti): Promise<boolean> {
  try {
    await prisma.strategyResultMulti.create({
      data: {
        ...result,
        name: result.name || `${result.strategyName}-${new Date().getTime()}`,
        symbols: JSON.stringify(result.symbols),
        params: JSON.stringify(result.params),
        multiResults: JSON.stringify(result.multiResults),
        startTime: BigInt(result.startTime),
        endTime: BigInt(result.endTime)
      }
    })
    logger.info(`Successfully inserted multi value result: ${result.name}`)
    return true
  } catch (error) {
    throw new BacktestError(`Problem inserting result with error: ${error}`, ErrorCode.Insert)
  }
}

export async function getAllMultiResults(): Promise<StrategyResultMulti[]> {
  try {
    // Get all the strategies names
    const strategyResults = await prisma.strategyResultMulti.findMany({
      select: { name: true }
    })

    const results: StrategyResultMulti[] = await Promise.all(
      strategyResults.map(async (result) => await getMultiResult(result.name))
    )
    return results
  } catch (error) {
    throw new BacktestError(`Problem getting results with error: ${error}`, ErrorCode.Retrieve)
  }
}

export async function getAllMultiResultNames(): Promise<string[]> {
  try {
    // Get all the strategies names
    const strategyResults = await prisma.strategyResultMulti.findMany({
      select: { name: true }
    })

    const names = strategyResults.map((result) => result.name)
    return names
  } catch (error) {
    throw new BacktestError(`Problem getting results with error: ${error}`, ErrorCode.Retrieve)
  }
}

async function _getMultiResult(name: string): Promise<StrategyResultMulti> {
  try {
    const result = await prisma.strategyResultMulti.findUnique({
      where: { name }
    })

    if (!result) {
      throw new BacktestError(`Failed to find multi value result named ${name}`, ErrorCode.NotFound)
    }

    // Parse the JSON strings back into objects
    const parsedResult: StrategyResultMulti = {
      ...result,
      symbols: JSON.parse(result.symbols),
      params: JSON.parse(result.params),
      multiResults: JSON.parse(result.multiResults),
      startTime: Number(result.startTime),
      endTime: Number(result.endTime)
    }

    return parsedResult
  } catch (error) {
    throw new BacktestError(`Failed to get result with error ${error}`, ErrorCode.Retrieve)
  }
}

export async function deleteMultiResult(name: string): Promise<boolean> {
  try {
    await prisma.strategyResultMulti.delete({
      where: { name }
    })

    // Return successfully deleted
    logger.info(`Successfully deleted ${name}`)
    return true
  } catch (error) {
    throw new BacktestError(`Failed to delete StrategyResult with name: ${name}. Error: ${error}`, ErrorCode.Delete)
  }
}
