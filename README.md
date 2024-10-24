![GitHub](https://img.shields.io/github/license/backtestjs/framework)
![GitHub package.json version](https://img.shields.io/github/package-json/v/backtestjs/framework)
[![Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fbacktestjs%2Fframework&count_bg=%23AE21A7&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=views&edge_flat=false)](https://hits.seeyoufarm.com)

# Backtest JS: Framework

Enhance your trading strategies with BacktestJS, meticulously crafted for trading developers. Leverage the power of TypeScript to backtest your strategies with unmatched precision, efficiency, and flexibility.

## Pay Attention 🚨

Work in progress, a full version will be released within a couple of weeks!!

## Key Features 🌟

- **Intuitive Methods**: Utilizes intuitive methods for smooth and efficient operation.

- **Comprehensive Candle Data**: Access historical candle data from Binance or effortlessly import your own CSV files.

- **Integrated Storage**: Efficiently store your candle data, strategies, and results in the internal SQLite storage.

- **Documentation**: Maximize BacktestJS’s capabilities with thorough guides and resources.

<br/>

## Quick Start

### Installation

To install the package in your project, use the following npm command:

```bash
npm install @backtestjs/framework
```

### How to use this package

You can incorporate this framework directly into your project by installing it as described above.

Alternatively, you can clone the [quick-start](https://github.com/backtestjs/quick-start) repository, which will allow you to start writing your strategies without needing to set up a project from scratch. The project itself provides all the necessary instructions.

If not, you can use the command line interface that will handle everything for you. In this case, we recommend checking out the specific project [@backtestjs/command-line](https://github.com/backtestjs/command-line). This way, you can easily navigate and use the command line interface without any confusion.

<br/>

## Documentation

Explore the BacktestJS universe with our [Full Documentation](http://backtestjs.com). Discover tutorials, video guides, and extensive examples.

<br/>

## Historical Candle Data

Easily download candle data from Binance or import it from a CSV file for strategy execution. Additionally, you can export your data to a CSV file via the CLI with just a few clicks. No coding or API key is required (thanks Binance!).

<br/>

## Custom Strategies

In addition to the demonstration strategies already present, you can create your own by adding a file under `src/strategies`.

Use one of the existing files or the examples in this guide as a reference. Each file should contain a `runStrategy` method, and if it uses external or dynamic parameters, it should also include a properly filled-out `properties` structure.

Whenever you create a new strategy, modify the `properties` structure of an existing one, or delete an existing strategy, you need to run the `scanStrategies` method.

There’s no need to stop or restart the backtestjs process if it’s running, or to exit the program. The program will reload the contents of your file with each launch, as long as it’s synchronized.

Using well-defined or dynamic parameters (instead of constants within your strategy) will allow you to run multiple tests simultaneously.

## Candle Data

Each candle have the following information available:

```typescript
export interface Candle {
  symbol: string
  interval: string
  openTime: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  closeTime: number
  assetVolume: number
  numberOfTrades: number
}
```

## Buy and Sell

It is possible to execute a buy or sell by following this:

```typescript
export interface BuySell {
  price?: number // Price of which you will trade the asset
  position?: string // Can be "short" or "long" (long is the default)
  amount?: number | string // Amount of asset to buy can be number or string (string must include a %), f.e. 300 or "10%"
  baseAmount?: number // Trade the base amount to use for percentage calculations (total worth for baseAmount equals to amount)
  stopLoss?: number // Price of which a stop loss will trigger (all will be sold on the stop loss)
  takeProfit?: number // Price of which a take profit will trigger (all will be sold on the take profit price)
  percentFee?: number
  percentSlippage?: number //
  note?: string // Add a simple note to identify this trade
}
```

**_Pay attention_**: follow these rules:

- You CAN short and long at the same time but they need to be two seperate calls
- If you try to buy or sell but you already bought or sold everything, the buy or sell will be skipped and not recorded
- You cannot use “amount” and “baseAmount” params together
- If in a short and a long you cannot use “amount” or “baseAmount” when selling without specifying a position.
- You cannot use stopLoss if you long and short at the same time
- You cannot use takeProfit if you long and short at the same time
- Amount param can be a number or a string, if a string it must contain a percent sign “%”

In particular, the buy signal:

```typescript
bth.buy()

/* or */
await bth.buy({
  position: 'short', // or 'long' (default)
  amount: '10%', // or baseAmount
  note: 'a simple note here',
  stopLoss: stopLoss,
  percentSlippage: percentSlippage,
  percentFee: percentFee
})
```

while the sell signal:

```typescript
bth.sell()

/* or */

await bth.sell({
  amount: 250, // or baseAmount
  note: 'a simple note here'
})
```

## Examples: buy & sell

### Beginner: The simplest buy & sell

```typescript
// Lets say you have $1000 and want to trade bitcoin
// Put in a long order and buy all which is $1000 worth of bitcoin
await buy()
// Lets say you bought bitcoin and are now worth $1000
// Put in a sell order and sell all which is $1000 worth of bitcoin
await sell()
```

### Begginer: How to specify amount

```typescript
// Lets say you have $1000 and want to trade bitcoin
// Put in a long order of $400 worth of bitcoin
await buy({ amount: 400 })
// Same thing can be achieved here
await buy({ amount: '40%' })
// Lets say you bought bitcoin and are now worth $1000 in bitcoin and put in a sell order of $400 worth of bitcoin
await sell({ amount: 400 })
// Same thing can be achieved here
await sell({ amount: '40%' })
```

### Regular: How to specify stop loss and take profit

```typescript
// Lets say you have $1000 and want to trade bitcoin
// Put a short order in with all which is $1000 and a stop loss at $24,000
await buy({ position: "short", stopLoss: 24000 })
// The application is smart enough to know that its a short and only sell if a candles high goes above $24,000
// Lets say you bought bitcoin in a long and a short but only want to sell some of the shorted amount
// Put in a sell order to sell 50% of the shorted amount
await sell({ position: "short", amount "50%"})
```

### Regular: How to specify base amount

```typescript
// Lets say you have $1000 and bitcoin is currently worth $2000
// Put a long order in of .25 bitcoin which is $500 worth
await buy({ baseAmount: 0.25 })
// This can also be achieved by doing
await buy({ amount: 500 })
// You cannot use amount with baseAmount in the same buy / sell call
// Lets say you bought bitcoin and are worth $1000 and bitcoin is worth $2000
// Put a short order in of .25 bitcoin which is $500 worth
await sell({ baseAmount: 0.25 })
// This can also be achieved by doing
await sell({ amount: 500 })
```

### Advanced: How to place an order at a specific price

```typescript
// Lets say you have $1000 and bitcoins close was $2100 but you had a trigger to buy at $2000
// Put a long order in of $1000 worth but bitcoin at a price of $2000
await buy({ price: 2000 })
// Lets say you bought and bitcoin is worth $2200 but you had a trigger to sell at $2100
// Put a sell order in where bitcoin is worth $2100
await sell({ price: 2100 })
```

## Examples: strategy

### Beginner: The simplest strategy

Below is an example of a simple 3 over 45 SMA strategy. You buy once the 3 crosses the 45 and sell otherwise. In this example, we don’t use the power of params.

```typescript
import { BTH } from '@backtestjs/framework'
import { indicatorSMA } from '../indicators/moving-averages'

export async function runStrategy(bth: BTH) {
  const lowSMACandles = await bth.getCandles('close', 0, 3)
  const highSMACandles = await bth.getCandles('close', 0, 45)

  // Calculate low and high SMA
  const lowSMA = await indicatorSMA(lowSMACandles, 3)
  const highSMA = await indicatorSMA(highSMACandles, 45)

  // Buy if lowSMA crosses over the highSMA
  if (lowSMA > highSMA) {
    await bth.buy()
  }

  // Sell if lowSMA crosses under the highSMA
  else {
    await bth.sell()
  }
}
```

**_Pay attention_**: hard-coded parameters will prevent you from running multiple tests simultaneously!

<br/>

### Regular: the same strategy with parameters

Below is an example of a simple SMA strategy like above but it’s not hard-coded to the 3 over 45. When you run the strategy through the CLI, you will be asked to provide a low and high SMA. You can even provide multiple lows and multiple highs, and all the variations will be tested in one run.

```typescript
import { BTH } from '../core/interfaces'
import { indicatorSMA } from '../indicators/moving-averages'

export const properties = {
  params: ['lowSMA', 'highSMA'],
  dynamicParams: false
}

export async function runStrategy(bth: BTH) {
  const lowSMAInput = bth.params.lowSMA
  const highSMAInput = bth.params.highSMA

  // Get last candles
  const lowSMACandles = await bth.getCandles('close', 0, lowSMAInput)
  const highSMACandles = await bth.getCandles('close', 0, highSMAInput)

  // Calculate low and high SMA
  const lowSMA = await indicatorSMA(lowSMACandles, lowSMAInput)
  const highSMA = await indicatorSMA(highSMACandles, highSMAInput)

  // Buy if lowSMA crosses over the highSMA
  if (lowSMA > highSMA) {
    await bth.buy()
  }

  // Sell if lowSMA crosses under the highSMA
  else {
    await bth.sell()
  }
}
```

### Advanced: use of multiple historical data

Your strategy can also use other intervals as a support, that is one or more intervals of the same symbol. This way, on the trading interval, you can execute buy/sell actions, while you can use the supports to perform statistics or validate any trading signals.

```typescript
export async function runStrategy(bth: BTH) {
  if (bth.tradingCandle) {
    // For example, use BTCEUR-1d data to execute your trading strategy (buy, sell, etc.)
  } else {
    // do something else when BTCEUR-8h candle is closed
  }
}
```

<br/>

## How to run strategies

When you run your strategy, you can provide multiple parameters. Below is the general structure:

```typescript
export interface RunStrategy {
  strategyName: string // name of the strategy to run
  historicalData: string[] // symbols to use for trading (e.g. ['BTCEUR-8h', 'BTCEUR-1d'])
  supportHistoricalData?: string[] // symbols to use as support (e.g. ['BTCEUR-1h', 'BTCEUR-8h', 'BTCEUR-1d'])
  startingAmount: number // how much money to start with
  startTime: number // from which date start to evaluate yor strategy
  endTime: number // to which date evaluate your strategy
  params: LooseObject // parameters to use for the strategy, you can pass multiple value for each parameter
  percentFee?: number // 0.1 means 0.1% fee
  percentSlippage?: number // 0.6 means 0.6% slippage
  rootPath?: string // sometimes is useful specify a different path (uncommon case)
  alwaysFreshLoad?: boolean // if true the file of the strategy is always reloaded by scratch, the default is false
}
```

**_Pay attention_**: If `alwaysFreshLoad` is set to `true`, it's important to note that you cannot use global variables in your strategy. As a result, you won't be able to take advantage of the benefits of using support historical data.

<br />

## Backtesting Results

BacktestJS not only delivers performance insights but also returns your strategy's effectiveness through comprehensive statistics.

<br/>

## Import Candle Data from CSV

Although there is an option to download data from **binance** for `crypto` assets there is no automatic download available for traditional symbols such as `apple` or `tesla` stock as well as forex symbols such as `usdyen`.

This candle data can be downloaded from third party sites such as `yahoo finance` and can then be easily imported to the BacktestJS database to use with any strategy.

### How to prepare CSV file

The CSV file **must** have the following fields:

- Close time of the candle: closeTime or date
- Open price of the candle: open
- High price of the candle: high
- Low price of the candle: low
- Close price of the candle: close

The CSV file can have the following **optional** fields:

- Open time of the candle: openTime, openTime
- Volume in the candle: volume
- Asset volume of the candle: assetVolume
- Number of trades done in the candle: numberOfTrades

**_Pay attention_**: follow these rules:

- Each field can be written without considering case sensitivity.
- The order of the fields in the CSV file is not important.
- Any additional fields will not cause an error but won't be added to the database.

<br/>

## Prisma: Useful commands

[Prisma](https://prisma.io) is a modern DB toolkit to query, migrate and model your database.

In this project, Prisma is used with `SQLite` to avoid the need for installing other databases. If necessary, the database file can be deleted or updated.

Below are some useful commands to run from the terminal/shell:

- Run `npx prisma` to display the command line help;
- Run `npx prisma validate` to validate the prisma.schema;
- Run `npx prisma generate` to generate artifacts, such as the Prisma client;
- Run `npx prisma db push` to push the Prisma schema state to the database.

However, it's always recommended to refer to the official Prisma documentation for detailed information.

## Thanks to

The original project is currently on hold. However, thanks to the permissive license, we aim to continue the author’s work. We express our gratitude and recognition for creating a usable product under a license that allows for external adoption and support.

So, our thanks to Andrew Baronick ( [GitHub](https://www.github.com/andrewbaronick) / [LinkedIn](https://www.linkedin.com/in/andrew-baronick/) )
