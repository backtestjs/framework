import { getAllCandleMetaData } from '../../helpers/prisma-historical-data'
import { intervals } from '../../helpers/historical-data'
import { importCSV } from '../../helpers/csv'

import { MetaCandle } from '../../../types/global'
import { BacktestError, ErrorCode } from '../../helpers/error'

export async function importFileCSV(base: string, quote: string, interval: string, path: string) {
  if (!base) {
    throw new BacktestError('Base name (ex: BTC in BTCUSDT or APPL in APPL/USD) is required', ErrorCode.MissingInput)
  }

  if (!quote) {
    throw new BacktestError('Quote name (ex: USDT in BTCUSDT or USD in APPL/USD) is required', ErrorCode.MissingInput)
  }

  if (!interval || !intervals.includes(interval)) {
    throw new BacktestError(`Interval is required. Use one of ${intervals.join(' ')}`, ErrorCode.MissingInput)
  }

  if (!path) {
    throw new BacktestError('Path to CSV file is required', ErrorCode.MissingInput)
  }

  // Get historical metadata
  const historicalMetaDatas = await getAllCandleMetaData()
  if (historicalMetaDatas.error) return historicalMetaDatas

  const historicalDataSets: MetaCandle[] = typeof historicalMetaDatas.data !== 'string' ? historicalMetaDatas.data : []
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
