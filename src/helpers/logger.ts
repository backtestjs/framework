export enum LogLevel {
  ERROR = 40,
  INFO = 30,
  DEBUG = 20,
  TRACE = 10
}

const currentLevel = 0 // TODO: da inserire in .env / config

export function error(...args: any[]) {
  if (shouldLog(LogLevel.ERROR)) {
    console.log('ERROR:', ...args)
  }
}

export function info(...args: any[]) {
  if (shouldLog(LogLevel.INFO)) {
    console.log('INFO:', ...args)
  }
}

export function debug(...args: any[]) {
  if (shouldLog(LogLevel.DEBUG)) {
    console.log('DEBUG:', ...args)
  }
}

export function trace(...args: any[]) {
  if (shouldLog(LogLevel.TRACE)) {
    console.log('TRACE:', ...args)
  }
}

function shouldLog(level: LogLevel): boolean {
  return level >= currentLevel
}
