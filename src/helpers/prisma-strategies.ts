import { StrategyMeta } from '../helpers/interfaces'
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

export async function insertStrategy(strategy: StrategyMeta): Promise<boolean> {
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
    logger.debug(`Successfully inserted strategy: ${strategy.name}`)
    return true
  } catch (error) {
    throw new BacktestError(`Problem inserting strategy with error: ${error}`, ErrorCode.Insert)
  }
}

export async function getAllStrategies(): Promise<StrategyMeta[]> {
  try {
    // Get all the strategies
    const strategies = await prisma.strategy.findMany()
    const strategyMetas = strategies.map((strategy: any) => ({
      ...strategy,
      params: JSON.parse(strategy.params),
      creationTime: Number(strategy.creationTime),
      lastRunTime: Number(strategy.lastRunTime)
    }))
    return strategyMetas
  } catch (error) {
    throw new BacktestError(`Problem getting all strategies with error: ${error}`, ErrorCode.Retrieve)
  }
}

export async function getStrategy(name: string): Promise<StrategyMeta> {
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
    logger.debug(`Found strategy: ${name}`)
    return strategyMeta
  } catch (error) {
    throw new BacktestError(`Problem getting strategy with error: ${error}`, ErrorCode.Retrieve)
  }
}

export async function updateLastRunTime(name: string, lastRunTime: number): Promise<boolean> {
  try {
    // Update the strategies last run time
    const strategy = await prisma.strategy.update({
      where: { name },
      data: { lastRunTime: BigInt(lastRunTime) }
    })
    logger.debug(`Successfully updated lastRunTime for strategy: ${strategy.name}`)
    return true
  } catch (error) {
    throw new BacktestError(`Problem updating lastRunTime with error: ${error}`, ErrorCode.Update)
  }
}

export async function deleteStrategy(name: string): Promise<boolean> {
  try {
    // Delete a strategy
    await prisma.strategy.delete({ where: { name } })
    logger.debug(`Successfully deleted strategy: ${name}`)
    return true
  } catch (error) {
    throw new BacktestError(`Problem deleting strategy with error: ${error}`, ErrorCode.Delete)
  }
}

export async function updateStrategy(strategy: StrategyMeta): Promise<boolean> {
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
    logger.debug(`Successfully updated strategy: ${strategy.name}`)
    return true
  } catch (error) {
    throw new BacktestError(`Problem updating strategy with error: ${error}`, ErrorCode.Update)
  }
}
