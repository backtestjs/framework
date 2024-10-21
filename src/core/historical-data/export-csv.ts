import { exportCSV } from '../../helpers/csv'

export async function exportFileCSV(name: string, rootPath: string = './csv') {
  if (!name) {
    return { error: false, data: 'Name is required' }
  }
  return exportCSV(name, rootPath)
}
