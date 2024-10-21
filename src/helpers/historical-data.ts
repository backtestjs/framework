import { insertCandles, updateCandlesAndMetaCandle } from './prisma-historical-data'
import { GetCandles, Candle, MetaCandle } from '../../types/global'
import { parseCandles, removeUnusedCandles } from './parse'
import { getCandles, getBaseQuote } from './api'

export const intervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M']

async function getParseSaveCandlesPrivate(runParams: GetCandles, newData: boolean) {
  // Define function globals
  let finishedCandles = false
  let allCandles: Candle[] = []
  const metaName = `${runParams.symbol}-${runParams.interval}`

  async function saveCandlesNew(saveCandles: Candle[]) {
    // Get the base and quote of the symbol
    const baseQuote = await getBaseQuote(runParams.symbol)
    if (baseQuote.error) return baseQuote

    // Create and add meta data
    const meta = {
      name: metaName,
      symbol: runParams.symbol,
      interval: runParams.interval,
      base: baseQuote.data.base,
      quote: baseQuote.data.quote,
      startTime: saveCandles[0].closeTime,
      endTime: saveCandles[saveCandles.length - 1].closeTime,
      importedFromCSV: false,
      creationTime: new Date().getTime(),
      lastUpdatedTime: new Date().getTime()
    }

    // Insert candles and metaData into the DB
    const insertedCandles = await insertCandles(meta, saveCandles)
    if (insertedCandles.error) return insertedCandles
    return { error: false, data: '' }
  }

  async function saveCandlesUpdate(saveCandles: Candle[]) {
    // Update candles and metaData
    const insertResults = await updateCandlesAndMetaCandle(metaName, saveCandles)
    if (insertResults.error) return insertResults
    return { error: false, data: '' }
  }

  while (!finishedCandles) {
    // Call Binance for candles
    const candleRequest = await getCandles({
      symbol: runParams.symbol,
      interval: runParams.interval,
      endTime: runParams.endTime
    })

    // Update the new end time
    runParams.endTime = candleRequest.data[0][6]

    // Check for errors to get candles
    if (candleRequest.error) return candleRequest

    // Check if required candle data is present
    if ((runParams.endTime ?? 0) < (runParams.startTime ?? 0) || candleRequest.data.length <= 1) {
      if (!(candleRequest.data.length <= 1))
        candleRequest.data = await removeUnusedCandles(candleRequest.data, runParams.startTime ?? 0)
      finishedCandles = true
    }

    // Parse candle data
    let candles = await parseCandles(candleRequest.data)
    allCandles = [...candles, ...allCandles]

    // Save to DB if >= 50k entries then delete all candles in memory and continue to get more candles
    if (allCandles.length >= 50000) {
      // Save the candles
      const saveCandlesResult = newData ? await saveCandlesNew(allCandles) : await saveCandlesUpdate(allCandles)
      if (saveCandlesResult.error) return saveCandlesResult

      // Mark that this is not a first entry
      newData = false

      // Delete all candles
      allCandles = []
    }
  }

  // Save candles if more than 0 entries
  if (allCandles.length > 0) {
    const saveCandlesResult = newData ? await saveCandlesNew(allCandles) : await saveCandlesUpdate(allCandles)
    if (saveCandlesResult.error) return saveCandlesResult
  }

  // Return the candles
  return { error: false, data: allCandles }
}

export async function saveHistoricalData(runParams: GetCandles) {
  // Get, parse and save all needed candles
  const allCandlesResults = await getParseSaveCandlesPrivate(runParams, true)
  if (allCandlesResults.error) return allCandlesResults

  // Return success message
  return { error: false, data: `Successfully downloaded ${runParams.symbol} on the ${runParams.interval} interval` }
}

export async function updateHistoricalData(metadata: MetaCandle, newTimes: number) {
  // Define if should get or not
  let run = false

  // Make a copy of the metadata
  const metadataCopy = { ...metadata }

  // If requesting future times
  if (newTimes > metadata.endTime) {
    run = true
    metadataCopy.startTime = metadata.endTime
    metadataCopy.endTime = newTimes
  }

  // If requesting past times
  else if (newTimes < metadata.startTime) {
    run = true
    metadataCopy.startTime = newTimes
    metadataCopy.endTime = metadata.startTime
  }

  // If should get new candles then get and parse them
  if (run) {
    const allCandlesResults = await getParseSaveCandlesPrivate(metadataCopy, false)
    if (allCandlesResults.error) return allCandlesResults
  }

  // Return success message
  return { error: false, data: `Successfully updated candles for ${metadata.symbol}` }
}
