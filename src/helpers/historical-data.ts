import { insertCandles, updateCandlesAndMetaCandle } from './prisma-historical-data'
import { GetCandles, Candle, MetaCandle } from '../helpers/interfaces'
import { parseCandles, removeUnusedCandles } from './parse'
import { getCandles, getBaseQuote } from './api'
import * as logger from './logger'

async function _getParseSaveCandlesPrivate(runParams: GetCandles, newData: boolean): Promise<Candle[]> {
  // Define function globals
  let finishedCandles = false
  let allCandles: Candle[] = []
  const metaName = `${runParams.symbol}-${runParams.interval}`

  async function saveCandlesNew(saveCandles: Candle[]): Promise<boolean> {
    // Get the base and quote of the symbol
    const baseQuote = await getBaseQuote(runParams.symbol)

    // Create and add meta data
    const meta = {
      name: metaName,
      symbol: runParams.symbol,
      interval: runParams.interval,
      base: baseQuote.base,
      quote: baseQuote.quote,
      startTime: saveCandles[0].closeTime,
      endTime: saveCandles[saveCandles.length - 1].closeTime,
      importedFromCSV: false,
      creationTime: new Date().getTime(),
      lastUpdatedTime: new Date().getTime()
    }

    // Insert candles and metaData into the DB
    return await insertCandles(meta, saveCandles)
  }

  async function saveCandlesUpdate(saveCandles: Candle[]): Promise<boolean> {
    // Update candles and metaData
    await updateCandlesAndMetaCandle(metaName, saveCandles)
    return true
  }

  while (!finishedCandles) {
    // Call Binance for candles
    let candleRequest = await getCandles({
      symbol: runParams.symbol,
      interval: runParams.interval,
      endTime: runParams.endTime
    })

    // Update the new end time
    runParams.endTime = candleRequest[0][6]

    // Check if required candle data is present
    if ((runParams.endTime ?? 0) < (runParams.startTime ?? 0) || candleRequest.length <= 1) {
      if (!(candleRequest.length <= 1))
        candleRequest = await removeUnusedCandles(candleRequest, runParams.startTime ?? 0)
      finishedCandles = true
    }

    // Parse candle data
    let candles = await parseCandles(candleRequest)
    allCandles = [...candles, ...allCandles]

    // Save to DB if >= 50k entries then delete all candles in memory and continue to get more candles
    if (allCandles.length >= 50000) {
      // Save the candles
      const saveCandlesResult = newData ? await saveCandlesNew(allCandles) : await saveCandlesUpdate(allCandles)
      if (saveCandlesResult) {
        logger.info(
          `Partial: Saved ${allCandles.length} candles for ${runParams.symbol} on the ${runParams.interval} interval`
        )
      }

      // Mark that this is not a first entry
      newData = false

      // Delete all candles
      allCandles = []
    }
  }

  // Save candles if more than 0 entries
  if (allCandles.length > 0) {
    const saveCandlesResult = newData ? await saveCandlesNew(allCandles) : await saveCandlesUpdate(allCandles)
    if (saveCandlesResult) {
      logger.info(
        `Partial: Saved ${allCandles.length} candles for ${runParams.symbol} on the ${runParams.interval} interval`
      )
    }
  }

  // Return the candles
  return allCandles
}

export async function saveHistoricalData(runParams: GetCandles) {
  // Get, parse and save all needed candles
  const allCandlesResults = await _getParseSaveCandlesPrivate(runParams, true)
  if (allCandlesResults) {
    logger.info(
      `Saved ${allCandlesResults.length} candles for ${runParams.symbol} on the ${runParams.interval} interval`
    )
  }

  // Return success message
  logger.info(`Successfully downloaded ${runParams.symbol} on the ${runParams.interval} interval`)
  return true
}
