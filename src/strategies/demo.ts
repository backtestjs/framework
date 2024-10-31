import { BTH } from '../helpers/interfaces'
import * as indicator from 'technicalindicators'

export const properties = {
  params: ['lowSMA', 'highSMA'],
  dynamicParams: false
}

export async function runStrategy(bth: BTH) {
  if (bth.tradingCandle) {
    const lowSMAInput = bth.params.lowSMA
    const highSMAInput = bth.params.highSMA

    // Get last candles
    const lowSMACandles = await bth.getCandles('close', lowSMAInput, 0)
    const highSMACandles = await bth.getCandles('close', highSMAInput, 0)

    // Just for example, get last volume and last candle
    const lastVolume = await bth.getCandles('volume', 1) // Get current volume, like `bth.currentCandle.volume`
    const lastCandle = await bth.getCandles('candle', 1) // Get current candle, like `bth.currentCandle`

    // Calculate low and high SMA
    const lowSMAs = indicator.SMA.calculate({ period: lowSMAInput, values: lowSMACandles })
    const highSMAs = indicator.SMA.calculate({ period: highSMAInput, values: highSMACandles })

    const lowSMA = lowSMAs[lowSMAs.length - 1]
    const highSMA = highSMAs[highSMAs.length - 1]

    // Buy if lowSMA crosses over the highSMA
    if (lowSMA > highSMA) {
      await bth.buy()
    }

    // Sell if lowSMA crosses under the highSMA
    else {
      await bth.sell()
    }
  } else {
    // do something else
  }
}
