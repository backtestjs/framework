import { getAllStrategies } from '../../helpers/prisma-strategies'
import { StrategyMeta } from '../../helpers/interfaces'

export async function findStrategieNames(): Promise<string[]> {
  const strategies = await findStrategies()
  return Array.isArray(strategies) ? strategies.map((strategy: StrategyMeta) => strategy.name) : strategies
}

export async function findStrategies(): Promise<StrategyMeta[]> {
  return getAllStrategies()
}
