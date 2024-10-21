export enum ErrorCode {
  NotFound = 'NOT_FOUND', // Something was not found
  ActionFailed = 'ACTION_FAILED', // Unable to complete action (general)
  NoResults = 'NO_RESULTS', // No data/result/trade processed

  // Input errors
  InvalidInput = 'INVALID_INPUT', // Invalid data or parameter
  MissingInput = 'MISSING_INPUT', // Missing data or parameter

  // Strategy errors
  StrategyError = 'STRATEGY_ERROR', // Strategy related error
  StrategyNotFound = 'STRATEGY_NOT_FOUND', // Strategy not found

  // File/API errors
  ExternalAPI = 'EXTERNAL_API_ERROR', // Issues accessing external API (e.g., Binance)
  InvalidPath = 'INVALID_PATH', // Path does not exist or is invalid

  // Data handling errors
  Conflict = 'DATA_CONFLICT', // Data already present
  Access = 'DATA_ACCESS', // Unable to access data
  Save = 'DATA_SAVE', // Unable to save data
  Delete = 'DATA_DELETE', // Unable to delete data
  Update = 'DATA_UPDATE' // Unable to update data
}

export class BacktestError extends Error {
  code: ErrorCode

  constructor(message: string, code: ErrorCode) {
    super(`${message} (Code: ${code})`)
    this.code = code
    this.name = this.constructor.name

    Object.setPrototypeOf(this, BacktestError.prototype)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message?.replace(/\s*\(Code: [^)]+\)/, '') || undefined
    }
  }

  toString() {
    return `${this.name}: ${this.message})`
  }
}
