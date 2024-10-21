export enum ErrorCode {
  NotFound = 'NOT_FOUND', // Something was not found
  ActionFailed = 'ACTION_FAILED', // Unable to complete action (general)

  // Input errors
  InvalidInput = 'INVALID_INPUT', // Invalid data or parameter
  MissingInput = 'MISSING_INPUT', // Missing data or parameter

  // Strategy and Trade errors
  StrategyError = 'STRATEGY_ERROR', // Strategy related error
  StrategyNotFound = 'STRATEGY_NOT_FOUND', // Strategy not found
  TradeNotProcessed = 'TRADE_NOT_PROCESSED', // No trade processed

  // File/API errors
  ExternalAPI = 'EXTERNAL_API_ERROR', // Issues accessing external API (e.g., Binance)
  InvalidPath = 'INVALID_PATH', // Path does not exist or is invalid
  ParseError = 'PARSE_ERROR', // Parse error (general)

  // Data handling errors
  Conflict = 'DATA_CONFLICT', // Data already present
  Access = 'DATA_ACCESS', // Unable to access data
  Insert = 'DATA_INSERT', // Unable to insert data
  Delete = 'DATA_DELETE', // Unable to delete data
  Update = 'DATA_UPDATE', // Unable to update data
  Retrieve = 'DATA_RETRIEVE' // Unable to retrieve data
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
