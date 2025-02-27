import * as logger from './logger'
const path = require('path')
const glob = require('glob')

function _normalizePatterns(fileName: string, rootPath?: string): Array<string> {
  // replaceAll is needed for windows
  return !!rootPath
    ? [path.join(path.resolve(rootPath), fileName).replaceAll('\\', '/')]
    : [
        path.join(__dirname, '..', 'strategies', fileName).replaceAll('\\', '/'),
        path.join(path.resolve(process.cwd()), 'strategies', fileName).replaceAll('\\', '/'),
        path.join(path.resolve(process.cwd()), 'src', 'strategies', fileName).replaceAll('\\', '/')
      ]
}

export function getStrategy(strategyName: string, rootPath?: string) {
  let file: string | null = null
  const patterns = _normalizePatterns(`${strategyName}.{ts,js}`, rootPath)
  patterns.forEach((pattern) => {
    logger.trace(`Searching for strategy ${pattern}`)
    glob
      .sync(pattern)
      .filter((f: string) => path.basename(f, path.extname(f)) === strategyName && !f.endsWith('.d.ts'))
      .forEach((f: string) => {
        file = f
      })
  })
  return file
}

export function getStrategiesFrom(rootPath?: string) {
  const files: string[] = []
  const patterns = _normalizePatterns(`*.{ts,js}`, rootPath)
  patterns.forEach((pattern) => {
    logger.trace(`Searching in ${pattern}`)
    glob
      .sync(pattern)
      .filter((f: string) => !f.endsWith('.d.ts'))
      .forEach((f: string) => {
        files.push(f)
      })
  })
  return files
}
