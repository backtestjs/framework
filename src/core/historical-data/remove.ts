import { deleteCandles } from '../../helpers/prisma-historical-data'

export async function deleteHistoricalData(name: string) {
  if (!name) {
    return { error: false, data: 'Name is required' }
  }
  return deleteCandles(name)
}
