# Advanced Usage

## Multiple Data Intervals

Use multiple timeframes in your strategies:

```typescript
export async function runStrategy(bth: BTH) {
  // Main trading interval
  if (bth.tradingCandle) {
    const shortMA = await bth.getCandles('close', 10)
    const longMA = await bth.getCandles('close', 20)

    if (shortMA > longMA) {
      await bth.buy()
    }
  }
  // Support interval for confirmations
  else {
    const volume = await bth.getCandles('volume', 1)
    const avgVolume = await bth.getCandles('volume', 20)
    console.log('Volume analysis:', volume > avgVolume)
  }
}
```

## Parameter Optimization

Test multiple parameter combinations:

```typescript
const result = await runStrategy({
  strategyName: 'maStrategy',
  historicalData: ['BTCEUR-1d'],
  params: {
    shortPeriod: [5, 10, 15],
    longPeriod: [20, 30, 40]
  }
})
```

## Custom Indicators

Implement custom technical indicators:

```typescript
function calculateRSI(values: number[], period: number): number {
  // RSI implementation
  return rsiValue
}

export async function runStrategy(bth: BTH) {
  const closes = await bth.getCandles('close', 14)
  const rsi = calculateRSI(closes, 14)

  if (rsi < 30) await bth.buy()
  if (rsi > 70) await bth.sell()
}
```
