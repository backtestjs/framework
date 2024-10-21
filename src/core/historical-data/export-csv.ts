import { exportCSV } from '../../helpers/csv'
import { BacktestError, ErrorCode } from '../../helpers/error'

export async function exportFileCSV(name: string, rootPath: string = './csv') {
  if (!name) {
    throw new BacktestError('Name is required', ErrorCode.MissingInput)
  }
  return exportCSV(name, rootPath)
}
