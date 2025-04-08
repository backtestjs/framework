# Basic Usage

## Installation

```bash
npm install @backtest/framework
```

## Quick Start

1. Create a basic strategy:

```typescript
import { BTH } from '@backtest/framework'

export async function runStrategy(bth: BTH) {
  const closePrice = await bth.getCandles('close', 1)
  const sma20 = await bth.getCandles('close', 20, 0)

  if (closePrice > sma20) {
    await bth.buy()
  } else {
    await bth.sell()
  }
}
```

2. Configure environment:

```env
DATABASE_URL=file:./db/backtest.db
FRAMEWORK_LOG_LEVEL=ERROR
```

3. Run the strategy:

```typescript
import { runStrategy } from '@backtest/framework'

const result = await runStrategy({
  strategyName: 'simpleMovingAverage',
  historicalData: ['BTCEUR-1d'],
  params: { period: 20 },
  startingAmount: 1000
})
```

## Historical Data

Import data from CSV or download from exchanges:

```typescript
import { downloadHistoricalData, importFileCSV } from '@backtest/framework'

// Download from exchange
await downloadHistoricalData('BTCEUR', {
  interval: '1d',
  start: '2023-01-01',
  end: '2023-12-31'
})

// Import from CSV
await importFileCSV('./data/BTCEUR.csv', {
  symbol: 'BTCEUR',
  interval: '1d'
})
```
