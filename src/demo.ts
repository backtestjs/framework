import {
  parseRunResultsStats,
  findHistoricalData,
  findHistoricalDataSets,
  findHistoricalDataNames,
  downloadHistoricalData,
  importFileCSV,
  exportFileCSV,
  deleteHistoricalData,
  findResultNames,
  findResults,
  deleteResults,
  saveResults,
  findMultiResultNames,
  findMultiResults,
  deleteMultiResults,
  saveMultiResults,
  findStrategyNames,
  findStrategies,
  runStrategy,
  scanStrategies,
  printInfo
} from '../main'

import { StrategyResult, StrategyResultMulti } from './helpers/interfaces'
import { BacktestError, ErrorCode } from './helpers/error'

async function main() {
  printInfo()

  const downloaded1 = await downloadHistoricalData('BTCEUR', {
    interval: '1h',
    startDate: '2024-01-01',
    endDate: '2024-10-15'
  })
  console.log(downloaded1)

  const downloaded = await downloadHistoricalData('BTCEUR', {
    interval: '8h',
    startDate: '2024-01-01',
    endDate: '2024-10-15'
  })
  console.log(downloaded)

  const exported = await exportFileCSV('BTCEUR-8h')
  console.log(exported)

  const deleted = await deleteHistoricalData('BTCEUR-8h')
  console.log(deleted)

  const allNames = await findHistoricalDataNames()
  console.log(allNames)

  const allSets = await findHistoricalDataSets()
  console.log(allSets)

  const dataSet = await findHistoricalData('BTCEUR-8h')
  console.log(dataSet)

  const dataSet1 = await findHistoricalData('BTCEUR-1h')
  console.log(dataSet1)

  const imported = await importFileCSV('BTC', 'EUR', '8h', './csv/BTCEUR-8h.csv')
  console.log(imported)

  const dataSet2 = await findHistoricalData('BTCEUR-8h')
  console.log(dataSet2)

  const scan = await scanStrategies()
  console.log(scan)

  const strategies = await findStrategies()
  console.log(strategies)

  const strategiesNames = await findStrategyNames()
  console.log(strategiesNames)

  const runStrategyResult = await runStrategy({
    strategyName: 'demo',
    historicalMetaData: ['BTCEUR-8h'],
    params: {
      lowSMA: 10,
      highSMA: 50
    },
    startingAmount: 1000,
    startTime: new Date('2024-01-14').getTime(),
    endTime: new Date('2024-10-14').getTime()
  })
  console.log(runStrategyResult)

  const parsed = await parseRunResultsStats(runStrategyResult)
  console.log(parsed)

  const saved = await saveResults('demo-results', runStrategyResult as StrategyResult, true)
  console.log(saved)

  const resultsNames = await findResultNames()
  console.log(resultsNames)

  const allResults = await findResults()
  console.log(allResults)

  const deletedResults = await deleteResults('demo-results')
  console.log(deletedResults)

  const runMultiStrategyResult = await runStrategy({
    strategyName: 'demo',
    historicalMetaData: ['BTCEUR-8h', 'BTCEUR-1h'],
    params: {},
    startingAmount: 1000,
    startTime: new Date('2023-01-14').getTime(),
    endTime: new Date('2023-10-14').getTime(),
    percentFee: 0,
    percentSlippage: 0
  })
  console.log(runMultiStrategyResult)

  const parsedMulti = await parseRunResultsStats(runMultiStrategyResult)
  console.log(parsedMulti)

  const savedMulti = await saveMultiResults('demo-multi-results', runMultiStrategyResult as StrategyResultMulti)
  console.log(savedMulti)

  const multiResultsNames = await findMultiResultNames()
  console.log(multiResultsNames)

  const allMultiResults = await findMultiResults()
  console.log(allMultiResults)

  const deletedMultiResults = await deleteMultiResults('demo-multi-results')
  console.log(deletedMultiResults)

  const multiResultsNames2 = await findMultiResultNames()
  console.log(multiResultsNames2)
}

main()
