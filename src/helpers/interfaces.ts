export interface RunStrategy {
  strategyName: string
  historicalData: string[]
  supportHistoricalData?: string[]
  startingAmount: number
  startTime: number
  endTime: number
  params: LooseObject
  percentFee?: number
  percentSlippage?: number
  rootPath?: string
  alwaysFreshLoad?: boolean
}

export interface BuySell {
  price?: number
  position?: string
  amount?: number | string
  baseAmount?: number
  stopLoss?: number
  takeProfit?: number
  percentFee?: number
  percentSlippage?: number
  note?: string
}

export interface BuySellReal {
  currentClose: number
  price?: number
  position?: string
  amount?: number | string
  baseAmount?: number
  percentFee?: number
  percentSlippage?: number
  date: number
  note?: string
}

export interface GetCandles {
  symbol: string
  interval: string
  startTime?: number
  endTime?: number
  limit?: number
}

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

export interface MetaCandle {
  name: string
  symbol: string
  interval: string
  base: string
  quote: string
  startTime: number
  endTime: number
  importedFromCSV: boolean
  creationTime: number
  lastUpdatedTime: number
}

export interface BTH {
  currentCandle: Candle
  getCandles: Function
  params: LooseObject
  orderBook: OrderBook
  allOrders: Order[]
  buy: Function
  sell: Function
  tradingCandle: boolean
}

export interface OrderBook {
  bought: boolean
  boughtLong: boolean
  boughtShort: boolean
  baseAmount: number
  quoteAmount: number
  borrowedBaseAmount: number
  limitAmount: number
  preBoughtQuoteAmount: number
  stopLoss: number | string
  takeProfit: number | string
}

export interface ImportCSV {
  interval: string
  base: string
  quote: string
  path: string
}

export interface StrategyResult {
  name: string
  historicalDataName: string
  strategyName: string
  params: LooseObject
  startTime: number
  endTime: number
  startingAmount: number
  txFee: number
  slippage: number
  runMetaData: RunMetaData
  allOrders: Order[]
  allWorths: Worth[]
}

export interface GetStrategyResult extends StrategyResult {
  candleMetaData: MetaCandle
  candles: Candle[]
}

export interface StrategyResultMulti {
  name: string
  symbols: string[]
  permutationCount: number
  strategyName: string
  params: LooseObject
  startTime: number
  endTime: number
  startingAmount: number
  txFee: number
  slippage: number
  multiResults: LooseObject[]
  isMultiValue: boolean
  isMultiSymbol: boolean
}

export interface Order {
  type: string
  position: string
  price: number
  amount: number
  worth: number
  quoteAmount: number
  baseAmount: number
  borrowedBaseAmount: number
  profitAmount: number
  profitPercent: number
  time: number
  note?: string
}

export interface Worth {
  close: number
  high: number
  low: number
  open: number
  time: number
}

export interface RunMetaData {
  highestAmount: number
  highestAmountDate: number
  lowestAmount: number
  lowestAmountDate: number
  maxDrawdownAmount: number
  maxDrawdownAmountDates: string
  maxDrawdownPercent: number
  maxDrawdownPercentDates: string
  startingAssetAmount: number
  startingAssetAmountDate: number
  endingAssetAmount: number
  endingAssetAmountDate: number
  highestAssetAmount: number
  highestAssetAmountDate: number
  lowestAssetAmount: number
  lowestAssetAmountDate: number
  numberOfCandles: number
  numberOfCandlesInvested: number
  sharpeRatio: number
  id?: number
  strategyResultId?: number
}

export interface StrategyMeta {
  name: string
  params: string[]
  dynamicParams: boolean
  creationTime: number
  lastRunTime: number
}

export interface LooseObject {
  [key: string]: any
}

export interface ScanAction {
  strategyName: string
  action: string
  error?: boolean
  message?: string
}

export interface AssetAmounts {
  startingAssetAmount: number
  endingAssetAmount: number
  highestAssetAmount: number
  highestAssetAmountDate: number
  lowestAssetAmount: number
  lowestAssetAmountDate: number
  numberOfCandles: number
}

export interface RunStrategyResultMulti {
  [key: string]: any
  symbol: string
  interval: string
  endAmount: number
  maxDrawdownAmount: number
  maxDrawdownPercent: number
  numberOfCandlesInvested: number
  sharpeRatio: number
  assetAmounts: AssetAmounts
}

export interface RunStrategyResult {
  runMetaData: RunMetaData
  allOrders: Order[]
  allWorths: Worth[]
  allCandles: Candle[]
}
