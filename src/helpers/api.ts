import { GetCandles } from '../../types/global'
import axios from 'axios'
import { BacktestError, ErrorCode } from './error'
import * as logger from './logger'

// API Definitions
const binanceUrl = 'http://api.binance.com'
const versionAPI = 'v3'

const endpointExchangeInfo = 'exchangeInfo'
const endpointCandles = 'klines'

async function _callBinanceAPI(endpoint: string, query: string, symbol: string): Promise<any> {
  const url = `${binanceUrl}/api/${versionAPI}/${endpoint}?${query}`
  logger.trace(`Binance URL: ${url}`)

  try {
    // Call Binance API
    const results = await axios.get(url)
    return results.data
  } catch (error) {
    // Return error if it happens
    if (error?.response?.data?.code === -1121) {
      throw new BacktestError(`Symbol ${symbol} not found on Binance`, ErrorCode.ExternalAPI)
    }
    throw new BacktestError(`Problem accessing Binance with error ${error.toString() || error}`, ErrorCode.ExternalAPI)
  }
}

export async function getCandleStartDate(symbol: string): Promise<any> {
  // Get lowest candles
  const candleStart = await getCandles({ symbol, interval: '1m', limit: 1, startTime: 0 })

  // Return lowest candle closeTime
  return candleStart[0][0]
}

export async function getBaseQuote(symbol: string): Promise<{ base: any; quote: any }> {
  // Define symbol
  let query = `symbol=${symbol}`

  // Call Binance with symbol
  const baseQuote = await _callBinanceAPI(endpointExchangeInfo, query, symbol)

  // Parse and return base and quote
  return { base: baseQuote.symbols[0].baseAsset, quote: baseQuote.symbols[0].quoteAsset }
}

export async function getCandles(getCandlesParams: GetCandles): Promise<any> {
  // Define the candle limit
  if (getCandlesParams.limit === undefined) getCandlesParams.limit = 1000

  // Define the query to get candles
  let query = `symbol=${getCandlesParams.symbol}&interval=${getCandlesParams.interval}&limit=${getCandlesParams.limit}`

  // Add start or end time if needed
  if (getCandlesParams.startTime !== undefined) query += `&startTime=${getCandlesParams.startTime}`
  if (getCandlesParams.endTime !== undefined) query += `&endTime=${getCandlesParams.endTime}`

  // Call and return the call to Binance
  return await _callBinanceAPI(endpointCandles, query, getCandlesParams.symbol)
}
