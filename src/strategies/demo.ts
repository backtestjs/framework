import { BTH } from '../helpers/interfaces'
import * as indicator from 'technicalindicators'

export const properties = {
  params: ['lowSMA', 'highSMA'],
  dynamicParams: false
}

export async function runStrategy(bth: BTH) {
  if (bth.tradingCandle) {
    const lowSMACandles = await bth.getCandles('close', 0, 3)
    const highSMACandles = await bth.getCandles('close', 0, 45)

    // Calculate low and high SMA
    const lowSMAs = indicator.SMA.calculate({ period: 3, values: lowSMACandles })
    const highSMAs = indicator.SMA.calculate({ period: 45, values: highSMACandles })

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
