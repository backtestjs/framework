import { StrategyMeta } from '../../types/global'
import { PrismaClient } from '@prisma/client'
import { BacktestError, ErrorCode } from './error'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./db/backtestjs.db'
    }
  }
})

export async function insertStrategy(strategy: StrategyMeta): Promise<{ error: boolean; data: string }> {
  try {
    // Insert a strategy
    await prisma.strategy.create({
      data: {
        ...strategy,
        params: JSON.stringify(strategy.params),
        creationTime: BigInt(strategy.creationTime),
        lastRunTime: BigInt(strategy.lastRunTime)
      }
    })
    return {
      error: false,
      data: `Successfully inserted strategy: ${strategy.name}`
    }
  } catch (error) {
    throw new BacktestError(`Problem inserting strategy with error: ${error}`, ErrorCode.Insert)
  }
}

export async function getAllStrategies(): Promise<{
  error: boolean
  data: StrategyMeta[] | string
}> {
  try {
    // Get all the strategies
    const strategies = await prisma.strategy.findMany()
    const strategyMetas = strategies.map((strategy: any) => ({
      ...strategy,
      params: JSON.parse(strategy.params),
      creationTime: Number(strategy.creationTime),
      lastRunTime: Number(strategy.lastRunTime)
    }))
    return { error: false, data: strategyMetas }
  } catch (error) {
    throw new BacktestError(`Problem getting all strategies with error: ${error}`, ErrorCode.Retrieve)
  }
}

export async function getStrategy(name: string): Promise<{ error: boolean; data: StrategyMeta | string }> {
  try {
    // Get a specific strategy
    const strategy = await prisma.strategy.findUnique({ where: { name } })
    if (!strategy) {
      throw new BacktestError(`Strategy with name: ${name} not found`, ErrorCode.NotFound)
    }
    const strategyMeta = {
      ...strategy,
      params: JSON.parse(strategy.params),
      creationTime: Number(strategy.creationTime),
      lastRunTime: Number(strategy.lastRunTime)
    }
    return { error: false, data: strategyMeta }
  } catch (error) {
    throw new BacktestError(`Problem getting strategy with error: ${error}`, ErrorCode.Retrieve)
  }
}

export async function updateLastRunTime(name: string, lastRunTime: number): Promise<{ error: boolean; data: string }> {
  try {
    // Update the strategies last run time
    const strategy = await prisma.strategy.update({
      where: { name },
      data: { lastRunTime: BigInt(lastRunTime) }
    })
    return {
      error: false,
      data: `Successfully updated lastRunTime for strategy: ${strategy.name}`
    }
  } catch (error) {
    throw new BacktestError(`Problem updating lastRunTime with error: ${error}`, ErrorCode.Update)
  }
}

export async function deleteStrategy(name: string): Promise<{ error: boolean; data: string }> {
  try {
    // Delete a strategy
    await prisma.strategy.delete({ where: { name } })
    return { error: false, data: `Successfully deleted strategy: ${name}` }
  } catch (error) {
    throw new BacktestError(`Problem deleting strategy with error: ${error}`, ErrorCode.Delete)
  }
}

export async function updateStrategy(strategy: StrategyMeta): Promise<{ error: boolean; data: string }> {
  try {
    // Insert a strategy
    await prisma.strategy.update({
      where: { name: strategy.name },
      data: {
        ...strategy,
        params: JSON.stringify(strategy.params),
        creationTime: BigInt(strategy.creationTime),
        lastRunTime: BigInt(strategy.lastRunTime)
      }
    })
    return {
      error: false,
      data: `Successfully updated strategy: ${strategy.name}`
    }
  } catch (error) {
    throw new BacktestError(`Problem updating strategy with error: ${error}`, ErrorCode.Update)
  }
}
