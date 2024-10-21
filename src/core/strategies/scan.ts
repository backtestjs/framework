import { insertStrategy, updateStrategy, deleteStrategy, getAllStrategies } from '../../helpers/prisma-strategies'
import { StrategyMeta, ScanAction } from '../../../types/global'
import { getStrategies } from '../../helpers/strategies'
import { BacktestError, ErrorCode } from '../../helpers/error'

const path = require('path')

export async function scanStrategies(rootPath?: string) {
  // Get strategies
  let strategies: StrategyMeta[] = await getAllStrategies()
  if (!strategies?.length) {
    strategies = []
  }

  const files = getStrategies(rootPath)
  if (!files?.length) {
    throw new BacktestError('No files found to scan', ErrorCode.NotFound)
  }

  const fileStrategies = files.map((file) => path.basename(file, path.extname(file)))
  const doneActions: ScanAction[] = []

  for (const [index, strategyName] of fileStrategies.entries()) {
    const registeredStrategy = strategies.find(({ name }) => name === strategyName)
    const strategy = await import(files[index])
    const strategyProperties = strategy.properties || {}

    const meta = {
      name: strategyName,
      params: strategyProperties.params || registeredStrategy?.params || [],
      dynamicParams: strategyProperties.dynamicParams || registeredStrategy?.dynamicParams || false,
      creationTime: registeredStrategy?.creationTime || new Date().getTime(),
      lastRunTime: registeredStrategy?.lastRunTime || 0
    }

    if (!!registeredStrategy?.name) {
      const action: ScanAction = { strategyName, action: 'insert' }
      try {
        action.error = await insertStrategy(meta)
      } catch (error) {
        action.error = true
        action.message = (error as Error).message
      }
      doneActions.push(action)
    } else {
      const action: ScanAction = { strategyName, action: 'insert' }
      try {
        action.error = await insertStrategy(meta)
      } catch (error) {
        action.error = true
        action.message = (error as Error).message
      }
      doneActions.push(action)
    }
  }

  for (const { name: strategyName } of strategies) {
    if (!fileStrategies.includes(strategyName)) {
      const action: ScanAction = { strategyName, action: 'delete' }
      try {
        action.error = await deleteStrategy(strategyName)
      } catch (error) {
        action.error = true
        action.message = (error as Error).message
      }
      doneActions.push(action)
    }
  }

  return {
    error: false,
    data: doneActions
  }
}
