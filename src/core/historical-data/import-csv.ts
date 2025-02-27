import { getAllCandleMetaData } from '../../helpers/prisma-historical-data'
import { getIntervals, isValidInterval } from '../common'
import { importCSV } from '../../helpers/csv'

import { MetaCandle } from '../../helpers/interfaces'
import { BacktestError, ErrorCode } from '../../helpers/error'

export async function importFileCSV(base: string, quote: string, interval: string, path: string): Promise<boolean> {
  if (!base) {
    throw new BacktestError('Base name (ex: BTC in BTCUSDT or APPL in APPL/USD) is required', ErrorCode.MissingInput)
  }

  if (!quote) {
    throw new BacktestError('Quote name (ex: USDT in BTCUSDT or USD in APPL/USD) is required', ErrorCode.MissingInput)
  }

  if (!interval || !isValidInterval(interval)) {
    throw new BacktestError(`Interval is required. Use one of ${getIntervals().join(' ')}`, ErrorCode.MissingInput)
  }

  if (!path) {
    throw new BacktestError('Path to CSV file is required', ErrorCode.MissingInput)
  }

  // Get historical metadata
  const historicalDataSets: MetaCandle[] = await getAllCandleMetaData()
  const isHistoricalDataPresent = historicalDataSets.some(
    (meta: MetaCandle) => meta.name === `${base + quote}-${interval}`
  )

  // Validate entry does not already exist
  if (isHistoricalDataPresent) {
    throw new BacktestError(
      `Historical data already found for ${base + quote} with ${interval} interval.`,
      ErrorCode.Conflict
    )
  }

  let filePath = path?.trim()

  // Remove path surrounding quotes if they exist
  if ((filePath.startsWith(`"`) && filePath.endsWith(`"`)) || (filePath.startsWith(`'`) && filePath.endsWith(`'`))) {
    filePath = filePath.substring(1, filePath.length - 1)
  }

  // Try to import the CSV
  return importCSV({ interval, base: base.toUpperCase(), quote: quote.toUpperCase(), path: filePath })
}
