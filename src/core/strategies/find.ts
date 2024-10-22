import { getAllStrategies, getStrategy } from '../../helpers/prisma-strategies'
import { StrategyMeta } from '../../helpers/interfaces'

export async function findStrategyNames(): Promise<string[]> {
  const strategies = await findStrategies()
  return strategies.map((strategy: StrategyMeta) => strategy.name).sort()
}

export async function findStrategies(): Promise<StrategyMeta[]> {
  return getAllStrategies()
}

export async function findStrategy(name: string): Promise<StrategyMeta> {
  return getStrategy(name)
}
