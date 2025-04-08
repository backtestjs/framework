# Strategy Development Guide

## Basic Structure

Every strategy must export a `runStrategy` function:

```typescript
import { BTH } from '@backtest/framework'

export async function runStrategy(bth: BTH) {
  // Strategy logic here
}
```

## Available Methods

### Price Data

```typescript
const close = await bth.getCandles('close', 1) // Latest close price
const opens = await bth.getCandles('open', 10) // Last 10 open prices
const highs = await bth.getCandles('high', 5, 2) // High prices from 5 to 2 candles ago
```

### Trading Actions

```typescript
// Basic orders
await bth.buy()
await bth.sell()

// Advanced orders
await bth.buy({
  amount: 100,
  stopLoss: 9500,
  takeProfit: 11000
})
```

## Strategy Parameters

Define and use strategy parameters:

```typescript
export async function runStrategy(bth: BTH) {
  const { shortPeriod, longPeriod } = bth.params
  const shortMA = await bth.getCandles('close', shortPeriod)
  const longMA = await bth.getCandles('close', longPeriod)
}
```

## Multiple Timeframes

Handle different intervals:

```typescript
export async function runStrategy(bth: BTH) {
  if (bth.tradingCandle) {
    // Main trading logic
    const price = await bth.getCandles('close', 1)
  } else {
    // Support timeframe analysis
    const volume = await bth.getCandles('volume', 1)
  }
}
```
