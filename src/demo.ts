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
  deleteResult,
  saveResult,
  findMultiResultNames,
  findMultiResults,
  deleteMultiResult,
  saveMultiResult,
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

  // historical data
  const startDate = new Date('2024-01-01').getTime()
  const endDate = new Date('2024-10-15').getTime()

  // analyzed period
  const startTime = new Date('2024-02-01').getTime()
  const endTime = new Date('2024-10-14').getTime()

  const found = await findHistoricalData('BTCEUR-8h')
  console.log('found:', found)

  if (found) {
    const deleted = await deleteHistoricalData('BTCEUR-8h')
    console.log('deleted:', deleted)
  }

  const downloaded2 = await downloadHistoricalData('BTCEUR', {
    interval: '1d',
    startDate: startDate,
    endDate: endDate
  })
  console.log('downloaded2:', downloaded2)

  const downloaded1 = await downloadHistoricalData('BTCEUR', {
    interval: '1h',
    startDate: startDate,
    endDate: endDate
  })
  console.log('downloaded1:', downloaded1)

  const downloaded = await downloadHistoricalData('BTCEUR', {
    interval: '8h',
    startDate: startDate,
    endDate: endDate
  })
  console.log('downloaded:', downloaded)

  const exported = await exportFileCSV('BTCEUR-8h')
  console.log('exported:', exported)

  const allNames = await findHistoricalDataNames()
  console.log('allNames:', allNames)

  const allSets = await findHistoricalDataSets()
  console.log('allSets:', allSets.map(({ name }) => name).join(','))

  const dataSet = await findHistoricalData('BTCEUR-8h')
  console.log('dataSet:', dataSet)

  const dataSet1 = await findHistoricalData('BTCEUR-1h')
  console.log('dataSet1:', dataSet1)

  const deleted = await deleteHistoricalData('BTCEUR-8h')
  console.log('deleted:', deleted)

  const imported = await importFileCSV('BTC', 'EUR', '8h', './csv/BTCEUR-8h.csv')
  console.log('imported:', imported)

  const dataSet2 = await findHistoricalData('BTCEUR-8h')
  console.log('dataSet2:', dataSet2)

  const scan = await scanStrategies()
  console.log('scan:', scan)

  const strategies = await findStrategies()
  console.log('strategies:', strategies)

  const strategiesNames = await findStrategyNames()
  console.log('strategiesNames:', strategiesNames)

  const runStrategyResult = await runStrategy({
    strategyName: 'demo',
    historicalData: ['BTCEUR-1d'],
    params: {
      lowSMA: 10,
      highSMA: 50
    },
    startingAmount: 1000,
    startTime: startTime,
    endTime: endTime
  })
  console.log('runStrategyResult:', runStrategyResult.name)

  const parsed = await parseRunResultsStats(runStrategyResult)
  console.log('parsed:', parsed?.totals[0], parsed?.totals[1]) // just to show somethings (probably, you need to look parsed or strategyResult)

  const saved = await saveResult('demo-results', runStrategyResult as StrategyResult, true)
  console.log('saved:', saved)

  const resultsNames = await findResultNames()
  console.log('resultsNames:', resultsNames)

  const allResults = await findResults()
  console.log('allResults:', allResults.length)

  const deletedResults = await deleteResult('demo-results')
  console.log('deletedResults:', deletedResults)

  const runMultiStrategyResult = await runStrategy({
    strategyName: 'demo',
    historicalData: ['BTCEUR-8h', 'BTCEUR-1h'],
    params: {},
    startingAmount: 1000,
    startTime: startTime,
    endTime: endTime,
    percentFee: 0,
    percentSlippage: 0
  })
  console.log('runMultiStrategyResult:', runMultiStrategyResult.name)

  const parsedMulti = await parseRunResultsStats(runMultiStrategyResult)
  console.log('parsedMulti:', parsedMulti?.totals[0], parsedMulti?.totals[1]) // just to show somethings (probably, you need to look parsed or strategyResult)

  const savedMulti = await saveMultiResult('demo-multi-results', runMultiStrategyResult as StrategyResultMulti)
  console.log('savedMulti:', savedMulti)

  const multiResultsNames = await findMultiResultNames()
  console.log('multiResultsNames:', multiResultsNames)

  const allMultiResults = await findMultiResults()
  console.log('allMultiResults:', allMultiResults.length)

  const deletedMultiResult = await deleteMultiResult('demo-multi-results')
  console.log('deletedMultiResult:', deletedMultiResult)

  const multiResultsNames2 = await findMultiResultNames()
  console.log('multiResultsNames2:', multiResultsNames2)

  const runAdvancedStrategyResult = await runStrategy({
    strategyName: 'demo',
    historicalData: ['BTCEUR-1d', 'BTCEUR-8h'],
    supportHistoricalData: ['BTCEUR-1h', 'BTCEUR-8h'],
    startingAmount: 1000,
    startTime: startTime,
    endTime: endTime,
    params: {
      lowSMA: 10,
      highSMA: 50
    },
    percentFee: 0,
    percentSlippage: 0,
    rootPath: undefined
  })
  console.log('runStrategyResult:', runStrategyResult.name)

  const parsedAdvanced = await parseRunResultsStats(runAdvancedStrategyResult)
  console.log('parsedAdvanced:', parsedAdvanced.totals[0], parsedAdvanced.totals[1]) // just to show somethings (probably, you need to look parsed or strategyResult)
}

main()
