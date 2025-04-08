# Code Examples

## Moving Average Crossover

```typescript
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

## RSI Strategy

```typescript
export async function runStrategy(bth: BTH) {
  const closes = await bth.getCandles('close', 14)
  const rsi = calculateRSI(closes)

  if (rsi < 30) {
    await bth.buy()
  } else if (rsi > 70) {
    await bth.sell()
  }
}
```

## Multi-Timeframe Strategy

```typescript
export async function runStrategy(bth: BTH) {
  if (bth.tradingCandle) {
    const trend = await bth.getCandles('close', 1, 0)
    if (trend > 0) await bth.buy()
  } else {
    // Support timeframe analysis
    const volume = await bth.getCandles('volume', 1)
    console.log('Volume:', volume)
  }
}
```
