import { LooseObject, ImportCSV, Candle } from '../../types/global'
import { insertCandles, getCandles } from './prisma-historical-data'
import { BacktestError, ErrorCode } from './error'
import csvToJson from 'csvtojson'
import * as path from 'path'
import * as fs from 'fs'

function getNormalizedField(json: LooseObject, possibleFields: string[]): string | null {
  const normalizedFields: { [key: string]: string } = Object.keys(json).reduce(
    (acc: { [key: string]: string }, key) => {
      acc[key.toLowerCase()] = key
      return acc
    },
    {}
  )

  for (const field of possibleFields) {
    if (normalizedFields[field.toLowerCase()]) {
      return normalizedFields[field.toLowerCase()]
    }
  }
  return null
}

function getFieldKeys(json: LooseObject, fields: { [key: string]: string[] }): { [key: string]: string } {
  const fieldKeys: { [key: string]: string } = {}
  for (const [key, possibleFields] of Object.entries(fields)) {
    const fieldKey = getNormalizedField(json, possibleFields)
    if (fieldKey) {
      fieldKeys[key] = fieldKey
    } else {
      throw new BacktestError(`CSV does not have a valid ${possibleFields.join(', ')} field`, ErrorCode.InvalidInput)
    }
  }
  return fieldKeys
}

function getOptionalFieldKeys(json: LooseObject, fields: { [key: string]: string[] }): { [key: string]: string } {
  const optionalFields: { [key: string]: string } = {}
  for (const [key, possibleFields] of Object.entries(fields)) {
    const fieldKey = getNormalizedField(json, possibleFields)
    if (fieldKey) {
      optionalFields[key] = fieldKey
    }
  }
  return optionalFields
}

export async function importCSV(importCSVParams: ImportCSV) {
  let jsonCSV: LooseObject
  try {
    jsonCSV = await csvToJson().fromFile(importCSVParams.path)
  } catch (error) {
    throw new BacktestError(`Path ${importCSVParams.path} does not exist or is incorrect`, ErrorCode.InvalidPath)
  }

  const json = jsonCSV[0]

  const requiredFields = {
    closeTime: ['closeTime', 'date'],
    open: ['open'],
    close: ['close'],
    low: ['low'],
    high: ['high']
  }

  const optionalFields = {
    openTime: ['openTime'],
    volume: ['volume'],
    assetVolume: ['assetVolume'],
    numberOfTrades: ['numberOfTrades']
  }

  try {
    const fieldKeys = getFieldKeys(json, requiredFields)
    const optionalFileds = getOptionalFieldKeys(json, optionalFields)

    // Parse JSON for DB
    const jsonParsedCandles: Candle[] = jsonCSV.map((entry: LooseObject) => ({
      openTime: optionalFileds.openTime ? new Date(+entry[optionalFileds.openTime]).getTime() : 0,
      open: +entry[fieldKeys.open],
      high: +entry[fieldKeys.high],
      low: +entry[fieldKeys.low],
      close: +entry[fieldKeys.close],
      volume: optionalFileds.volume ? +entry[optionalFileds.volume] : 0,
      closeTime: new Date(+entry[fieldKeys.closeTime]).getTime(),
      assetVolume: optionalFileds.assetVolume ? +entry[optionalFileds.assetVolume] : 0,
      numberOfTrades: optionalFileds.numberOfTrades ? +entry[optionalFileds.numberOfTrades] : 0
    }))

    // Create and add meta data
    const meta = {
      name: `${importCSVParams.base + importCSVParams.quote}-${importCSVParams.interval}`,
      symbol: importCSVParams.base + importCSVParams.quote,
      interval: importCSVParams.interval,
      base: importCSVParams.base,
      quote: importCSVParams.quote,
      startTime: jsonParsedCandles[0].closeTime,
      endTime: jsonParsedCandles[jsonParsedCandles.length - 1].closeTime,
      importedFromCSV: true,
      creationTime: new Date().getTime(),
      lastUpdatedTime: new Date().getTime()
    }

    // Insert candles into the DB
    const insertedCandles = await insertCandles(meta, jsonParsedCandles)
    if (insertedCandles.error) return insertedCandles

    // Return success
    return {
      error: false,
      data: `Successfully imported ${importCSVParams.base + importCSVParams.quote} from ${new Date(
        meta.startTime
      ).toLocaleString()} to ${new Date(meta.endTime).toLocaleString()}`
    }
  } catch (error: any) {
    throw new BacktestError(error?.message || 'Generic error !?', ErrorCode.ActionFailed)
  }
}

export async function exportCSV(name: string, rootPath: string = './csv') {
  // Get candles
  const candlesRequest = await getCandles(name)
  if (candlesRequest.error) return candlesRequest

  const candles = typeof candlesRequest.data !== 'string' ? candlesRequest.data : null
  if (!candles) {
    throw new BacktestError(`No candles found for name ${name}`, ErrorCode.NotFound)
  }

  // Get candles keys for the header row
  const keys = Object.keys(candles.candles[0])

  // Create the header row
  const headerRow = keys.join(',') + '\n'

  // Create the data rows
  const dataRows = candles.candles
    .map((obj: LooseObject) => {
      const values = keys.map((key) => {
        const value = obj[key]
        return typeof value === 'string' ? `"${value}"` : value
      })
      return values.join(',')
    })
    .join('\n')

  // Check if the directory exists, and create it if it doesn't
  const dir = rootPath || './csv'
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }

  // Write the file to csv folder
  const filePath = path.join(dir, `${name}.csv`)
  fs.writeFileSync(filePath, headerRow + dataRows)

  // Return success
  return { error: false, data: `Successfully exported data to ./csv folder with name ${name}.csv` }
}
