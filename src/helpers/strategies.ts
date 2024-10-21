import * as logger from './logger'
const path = require('path')
const glob = require('glob')

export function normalizePatterns(fileName: string, rootPath?: string): Array<string> {
  // replaceAll is needed for windows
  return !!rootPath
    ? [path.join(path.resolve(rootPath), fileName).replaceAll('\\', '/')]
    : [
        path.join(__dirname, '..', 'strategies', fileName).replaceAll('\\', '/'),
        path.join(path.resolve(process.cwd()), 'strategies', fileName).replaceAll('\\', '/')
      ]
}

export function getStrategy(strategyName: string, rootPath?: string) {
  let file: string | null = null
  const patterns = normalizePatterns(`${strategyName}.{ts,js}`, rootPath)
  patterns.forEach((pattern) => {
    logger.info(`Searching for strategy ${pattern}`)
    glob
      .sync(pattern)
      .filter((f: string) => path.basename(f, path.extname(f)) === strategyName && !f.endsWith('.d.ts'))
      .forEach((f: string) => {
        file = f
      })
  })
  return file
}

export function getStrategies(rootPath?: string) {
  const files: string[] = []
  const patterns = normalizePatterns(`*.{ts,js}`, rootPath)
  patterns.forEach((pattern) => {
    logger.info(`Searching in ${pattern}`)
    glob
      .sync(pattern)
      .filter((f: string) => !f.endsWith('.d.ts'))
      .forEach((f: string) => {
        files.push(f)
      })
  })
  return files
}
