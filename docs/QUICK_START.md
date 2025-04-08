# Quick Start

## Installation

To install the package in your project, use the following npm command:

```bash
npm i @backtest/framework
```

## Basic Strategy

```typescript
// ./strategies/demo.ts
import { BTH } from '@backtest/framework'

export async function startCallback(historicalName: string) {
  console.log('called before runStrategy', historicalName)
}

export async function finishCallback(historicalName: string) {
  console.log('called after runStrategy', historicalName)
}

export async function runStrategy(bth: BTH) {
  const sma10 = await bth.getCandles('close', 10)
  const sma20 = await bth.getCandles('close', 20)

  if (sma10 > sma20) {
    await bth.buy()
  } else {
    await bth.sell()
  }
}
```

## How to use this package

```typescript
import {
  parseRunResultsStats,
  findHistoricalData,
  findHistoricalDataNames,
  downloadHistoricalData,
  runStrategy,
  scanStrategies
} from '../main'

async function main() {
  // historical data
  const startDate = new Date('2024-01-01').getTime()
  const endDate = new Date('2024-10-15').getTime()

  // analyzed period
  const startTime = new Date('2024-03-01').getTime()
  const endTime = new Date('2024-10-14').getTime()

  // check if already downloaded
  const found = await findHistoricalData('BTCEUR-8h')
  console.log('found:', found)

  if (!found) {
    // download data from public API binance
    const downloaded = await downloadHistoricalData('BTCEUR', {
      interval: '8h',
      startDate: startDate,
      endDate: endDate
    })
    console.log('downloaded:', downloaded)
  }

  // check if now is present
  const allNames = await findHistoricalDataNames()
  console.log('allNames:', allNames)

  // scan strategies
  const scan = await scanStrategies()
  console.log('scan:', scan)

  // run strategy
  const runStrategyResult = await runStrategy({
    strategyName: 'demo',
    historicalData: ['BTCEUR-8h'],
    params: {},
    startingAmount: 1000,
    startTime: startTime,
    endTime: endTime
  })
  console.log('runStrategyResult:', runStrategyResult.name)

  const parsed = await parseRunResultsStats(runStrategyResult)
  console.log('parsed:', parsed?.totals[0], parsed?.totals[1]) // just to show somethings (probably, you need to look parsed or strategyResult)
}

main()
```
