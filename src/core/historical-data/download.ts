import { saveHistoricalData } from '../../helpers/historical-data'
import { getAllCandleMetaData } from '../../helpers/prisma-historical-data'
import { getCandleStartDate } from '../../helpers/api'
import { isValidInterval } from '../common'

import { MetaCandle } from '../../helpers/interfaces'
import { BacktestError, ErrorCode } from '../../helpers/error'
import * as logger from '../../helpers/logger'

export async function downloadHistoricalData(
  symbol: string,
  data: {
    interval: string
    startDate: number | string | Date
    endDate: number | string | Date
    downloadIsMandatory?: boolean
  }
): Promise<boolean> {
  if (!symbol) {
    throw new BacktestError('Symbol is required', ErrorCode.MissingInput)
  }

  if (!data.interval) {
    throw new BacktestError('Interval is required', ErrorCode.MissingInput)
  }

  // Get historical metadata
  const historicalDataSets: MetaCandle[] = await getAllCandleMetaData()

  let symbolStartDate = await getCandleStartDate(symbol)
  if (symbolStartDate.error) {
    // Try to load USDT symbol if symbol is not found
    symbolStartDate = await getCandleStartDate(`${symbol}USDT`)
    if (!symbolStartDate.error) symbol = `${symbol}USDT`
  }

  if (symbolStartDate.error) {
    throw new BacktestError(`Symbol ${symbol} does not exist`, ErrorCode.NotFound)
  }

  const symbolStart = symbolStartDate.data

  if (!isValidInterval(data.interval)) {
    throw new BacktestError(`Interval ${data.interval} does not exist`, ErrorCode.NotFound)
  }

  const isSymbolPresent = historicalDataSets.some((meta: MetaCandle) => meta.name === `${symbol}-${data.interval}`)

  if (isSymbolPresent) {
    const message = `Symbol ${symbol} with interval ${data.interval} already exists.`
    if (data.downloadIsMandatory) {
      throw new BacktestError(message, ErrorCode.Conflict)
    } else {
      logger.info(message)
      return false
    }
  }

  const now = new Date().getTime()
  const startTime = new Date(data.startDate || symbolStart).getTime()
  const endTime = new Date(data.endDate || now).getTime()

  if (startTime < symbolStart || startTime > now) {
    throw new BacktestError(
      `Start date must be between ${new Date(symbolStart).toLocaleString()} and ${new Date(now).toLocaleString()}`,
      ErrorCode.InvalidInput
    )
  }

  if (endTime > now || endTime <= startTime) {
    throw new BacktestError(
      `End date must be between ${new Date(startTime).toLocaleString()} and ${new Date(now).toLocaleString()}`,
      ErrorCode.InvalidInput
    )
  }

  const objectGetHistoricalData = {
    symbol: symbol,
    interval: data.interval,
    startTime: startTime,
    endTime: endTime
  }

  // Get candles
  return saveHistoricalData(objectGetHistoricalData)
}

export { getCandleStartDate }
