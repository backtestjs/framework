import { getAllStrategies } from '../../helpers/prisma-strategies'
import { StrategyMeta } from '../../../types/global'
import { BacktestError, ErrorCode } from '../../helpers/error'

export async function findStrategieNames() {
  const strategies = await findStrategies()

  return Array.isArray(strategies) ? strategies.map((strategy: StrategyMeta) => strategy.name) : strategies
}

export async function findStrategies() {
  let allStrategies = await getAllStrategies()
  if (allStrategies.error) return allStrategies

  const strategies: StrategyMeta[] | null = typeof allStrategies.data === 'string' ? null : allStrategies.data
  if (!strategies?.length) {
    return { error: true, data: `No strategies found` }
  }

  return strategies
}
