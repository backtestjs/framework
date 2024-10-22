export enum LogLevel {
  ERROR = 40,
  INFO = 30,
  DEBUG = 20,
  TRACE = 10
}

let currentLevel: number = LogLevel.ERROR
try {
  currentLevel = LogLevel[process.env?.FRAMEWORK_LOG_LEVEL?.toUpperCase() || 'ERROR']
} catch (error) {
  currentLevel = LogLevel.ERROR
}

export function error(...args: any[]) {
  if (_shouldLog(LogLevel.ERROR)) {
    console.log('ERROR:', ...args)
  }
}

export function info(...args: any[]) {
  if (_shouldLog(LogLevel.INFO)) {
    console.log('INFO:', ...args)
  }
}

export function debug(...args: any[]) {
  if (_shouldLog(LogLevel.DEBUG)) {
    console.log('DEBUG:', ...args)
  }
}

export function trace(...args: any[]) {
  if (_shouldLog(LogLevel.TRACE)) {
    console.log('TRACE:', ...args)
  }
}

function _shouldLog(level: LogLevel): boolean {
  return level >= currentLevel
}
