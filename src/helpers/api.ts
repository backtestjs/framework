import { GetCandles } from '../../types/global'
import axios from 'axios'
import { BacktestError, ErrorCode } from './error'

// API Definitions
const binanceUrl = 'http://api.binance.com'
const versionAPI = 'v3'

const endpointExchangeInfo = 'exchangeInfo'
const endpointCandles = 'klines'

async function callBinanceAPI(endpoint: string, query: string) {
  try {
    // Call Binance API
    const url = `${binanceUrl}/api/${versionAPI}/${endpoint}?${query}`
    const results = await axios.get(url)
    return { error: false, data: results.data }
  } catch (error) {
    // Return error if it happens
    throw new BacktestError(`Problem accessing Binance with error ${error.toString() || error}`, ErrorCode.ExternalAPI)
  }
}

export async function getCandleStartDate(symbol: string) {
  // Get lowest candles
  const candleStart = await getCandles({ symbol, interval: '1m', limit: 1, startTime: 0 })

  // Return lowest candle closeTime
  if (!candleStart.error) candleStart.data = candleStart.data[0][0]
  return candleStart
}

export async function getBaseQuote(symbol: string) {
  // Define symbol
  let query = `symbol=${symbol}`

  // Call Binance with symbol
  const baseQuote = await callBinanceAPI(endpointExchangeInfo, query)

  // Parse and return base and quote
  if (!baseQuote.error)
    baseQuote.data = { base: baseQuote.data.symbols[0].baseAsset, quote: baseQuote.data.symbols[0].quoteAsset }
  return baseQuote
}

export async function getCandles(getCandlesParams: GetCandles) {
  // Define the candle limit
  if (getCandlesParams.limit === undefined) getCandlesParams.limit = 1000

  // Define the query to get candles
  let query = `symbol=${getCandlesParams.symbol}&interval=${getCandlesParams.interval}&limit=${getCandlesParams.limit}`

  // Add start or end time if needed
  if (getCandlesParams.startTime !== undefined) query += `&startTime=${getCandlesParams.startTime}`
  if (getCandlesParams.endTime !== undefined) query += `&endTime=${getCandlesParams.endTime}`

  // Call and return the call to Binance
  return await callBinanceAPI(endpointCandles, query)
}
