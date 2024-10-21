import { deleteCandles } from '../../helpers/prisma-historical-data'
import { BacktestError, ErrorCode } from '../../helpers/error'

export async function deleteHistoricalData(name: string) {
  if (!name) {
    throw new BacktestError('Name is required', ErrorCode.MissingInput)
  }
  return deleteCandles(name)
}
