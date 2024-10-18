import { BuySellReal, Order } from "../../types/global";
import { round } from "./parse";

export const orderBook = {
  bought: false,
  boughtLong: false,
  boughtShort: false,
  baseAmount: 0,
  quoteAmount: 0,
  borrowedBaseAmount: 0,
  preBoughtQuoteAmount: 0,
  fakeQuoteAmount: 0,
  stopLoss: 0,
  takeProfit: 0,
};

export let allOrders: Order[] = [];

export async function clearOrders() {
  allOrders = [];
}

export async function getCurrentWorth(close: number, high?: number, low?: number, open?: number) {
  // Return quote amount if not bought in
  if (!orderBook.bought)
    return {
      close: round(orderBook.quoteAmount),
      high: round(orderBook.quoteAmount),
      low: round(orderBook.quoteAmount),
      open: round(orderBook.quoteAmount),
    };

  // Current worth
  let currentWorth = orderBook.fakeQuoteAmount;
  currentWorth += orderBook.baseAmount * close;
  currentWorth -= orderBook.borrowedBaseAmount * close;

  // Get a value if bought in
  if (high !== undefined && low !== undefined && open !== undefined) {
    // Open worth
    let openWorth = orderBook.fakeQuoteAmount;
    openWorth += orderBook.baseAmount * open;
    openWorth -= orderBook.borrowedBaseAmount * open;

    // Highest worth
    let highestWorth = orderBook.fakeQuoteAmount;
    highestWorth += orderBook.baseAmount * high;
    highestWorth -= orderBook.borrowedBaseAmount * high;

    // Lowest worth
    let lowestWorth = orderBook.fakeQuoteAmount;
    lowestWorth += orderBook.baseAmount * low;
    lowestWorth -= orderBook.borrowedBaseAmount * low;

    return {
      close: round(currentWorth),
      high: highestWorth >= lowestWorth ? round(highestWorth) : round(lowestWorth),
      low: highestWorth >= lowestWorth ? round(lowestWorth) : round(highestWorth),
      open: round(openWorth),
    };
  }
  return { close: round(currentWorth), high: round(currentWorth), low: round(currentWorth), open: round(currentWorth) };
}

// ----------------------------------------------------
// |                  BUY FUNCTION                    |
// ----------------------------------------------------

export async function realBuy(buyParams: BuySellReal) {
  if (orderBook.quoteAmount > 0) {
    // Remove possible undefineds
    buyParams.price = buyParams.price ?? 0;
    buyParams.percentSlippage = buyParams.percentSlippage ?? 0;
    buyParams.percentFee = buyParams.percentFee ?? 0;

    // Define position if undefined
    if (buyParams.position === undefined) buyParams.position = "long";

    // Adjust if there is slippage
    if (buyParams.position === "long" && buyParams.percentSlippage > 0) {
      buyParams.price = buyParams.price * (1 + buyParams.percentSlippage / 100);
    } else if (buyParams.position === "short" && buyParams.percentSlippage > 0) {
      buyParams.price = buyParams.price * (1 - buyParams.percentSlippage / 100);
    }

    // Define order entry
    const order: Order = {
      type: "buy",
      position: "long",
      price: buyParams.price,
      amount: 0,
      worth: 0,
      quoteAmount: 0,
      baseAmount: 0,
      borrowedBaseAmount: 0,
      profitAmount: 0,
      profitPercent: 0,
      time: buyParams.date,
      note: buyParams.note || "",
    };

    // Return error if sending amount and base amount
    if (buyParams.amount !== undefined && buyParams.baseAmount !== undefined)
      return {
        error: true,
        data: `Cannot send amount and base amount for a buy order, sent amount: ${buyParams.amount} and base amount: ${buyParams.baseAmount}`,
      };
    // Define amount if undefined
    else if (buyParams.amount === undefined && buyParams.baseAmount === undefined)
      buyParams.amount = orderBook.quoteAmount;
    // Convert base asset amount to quote if needed
    else if (buyParams.baseAmount !== undefined) {
      buyParams.amount = buyParams.baseAmount * buyParams.price;
    }

    // Convert amount percentage to number if needed
    else if (typeof buyParams.amount === "string") {
      if (buyParams.amount.includes("%")) buyParams.amount = buyParams.amount.replace("%", "");
      else
        return {
          error: true,
          data: `If sending a string for buy amount you must provide a % instead received ${buyParams.amount}`,
        };
      if (typeof +buyParams.amount === "number" && +buyParams.amount <= 100 && +buyParams.amount > 0) {
        buyParams.amount = orderBook.quoteAmount * (+buyParams.amount / 100);
      } else
        return {
          error: true,
          data: `Buy amount does not have a valid number or is not > 0 and <= 100, expected a valid number instead received ${buyParams.amount}`,
        };
    }

    // Return if quote asset amount is 0
    if (typeof buyParams.amount === "number" && buyParams.amount <= 0)
      return { error: false, data: "Returning because there is no amount to buy" };

    // Handle if trying to buy more than have
    if (typeof buyParams.amount === "number" && buyParams.amount > orderBook.quoteAmount) {
      buyParams.amount = orderBook.quoteAmount;
    }

    // Make sure needed vars are numbers
    if (typeof buyParams.amount === "number") {
      // Define amount after fee
      let amountAfterFee = buyParams.amount;
      if (buyParams.percentFee > 0) amountAfterFee = buyParams.amount * (1 - buyParams.percentFee / 100);

      // Update bought or not
      if (!orderBook.bought) {
        orderBook.preBoughtQuoteAmount = orderBook.quoteAmount;
        orderBook.bought = true;
      }

      // Perform long buy
      if (buyParams.position === "long") {
        // Buy calculations
        orderBook.baseAmount += amountAfterFee / buyParams.price;
        orderBook.quoteAmount -= buyParams.amount;
        orderBook.fakeQuoteAmount -= buyParams.amount;
      }

      // Perform short buy
      else if (buyParams.position === "short") {
        if (buyParams.percentFee > 0) amountAfterFee = buyParams.amount * (1 + buyParams.percentFee / 100);

        // Buy calculations
        orderBook.quoteAmount -= buyParams.amount;
        orderBook.fakeQuoteAmount += buyParams.amount;
        orderBook.borrowedBaseAmount += amountAfterFee / buyParams.price;

        // Adjust order to short
        order.position = "short";
      }

      orderBook.boughtLong = orderBook.baseAmount === 0 ? false : true;
      orderBook.boughtShort = orderBook.borrowedBaseAmount === 0 ? false : true;

      // Update quote and base amount in order
      order.quoteAmount = round(orderBook.quoteAmount);
      order.baseAmount = round(orderBook.baseAmount);
      order.borrowedBaseAmount = round(orderBook.borrowedBaseAmount);

      // Set and push in order
      order.amount = round(buyParams.amount);
      order.worth = (await getCurrentWorth(buyParams.currentClose)).close;
      allOrders.push(order);

      // Return successfully bought message
      return { error: false, data: `Successfully bought amount of ${buyParams.amount}` };
    }

    // Return buy error
    else
      return {
        error: true,
        data: `Buy amount or symbol price does not have a valid number', expected a valid number instead received amount: ${buyParams.amount} and symbol price: ${buyParams.price}`,
      };
  }
}

// ----------------------------------------------------
// |                  SELL FUNCTION                   |
// ----------------------------------------------------

export async function realSell(sellParams: BuySellReal) {
  // Dont sell if not bought in
  if (orderBook.bought) {
    // Remove possible undefineds
    sellParams.price = sellParams.price ?? 0;
    sellParams.percentSlippage = sellParams.percentSlippage ?? 0;
    sellParams.percentFee = sellParams.percentFee ?? 0;

    // Define position if undefined
    if (sellParams.position === undefined) {
      if (orderBook.baseAmount > 0 && orderBook.borrowedBaseAmount > 0) sellParams.position = "both";
      else if (orderBook.baseAmount > 0) sellParams.position = "long";
      else if (orderBook.borrowedBaseAmount > 0) sellParams.position = "short";
    }

    // Adjust if there is slippage
    if (sellParams.position === "long" && sellParams.percentSlippage > 0) {
      sellParams.price = sellParams.price * (1 - sellParams.percentSlippage / 100);
    } else if (sellParams.position === "short" && sellParams.percentSlippage > 0) {
      sellParams.price = sellParams.price * (1 + sellParams.percentSlippage / 100);
    }

    // Define order entry
    const order: Order = {
      type: "sell",
      position: "long",
      price: sellParams.price,
      amount: 0,
      worth: 0,
      quoteAmount: 0,
      baseAmount: 0,
      borrowedBaseAmount: 0,
      profitAmount: 0,
      profitPercent: 0,
      time: sellParams.date,
      note: sellParams.note || "",
    };
    // Return error if sending amount and base amount
    if (sellParams.amount !== undefined && sellParams.baseAmount !== undefined)
      return {
        error: true,
        data: `Cannot send amount and base amount for a sell order, sent amount: ${sellParams.amount} and base amount: ${sellParams.baseAmount}`,
      };
    else if (sellParams.position === "both" && (sellParams.amount !== undefined || sellParams.baseAmount !== undefined))
      return {
        error: true,
        data: `When selling both long and short you cannot send amount or base amount (in such case its sell all), sent amount: ${sellParams.amount} and base amount: ${sellParams.baseAmount}`,
      };

    // Sell on long position
    if (sellParams.position === "long" || sellParams.position === "both") {
      // Define amount if undefined
      if (sellParams.amount === undefined && sellParams.baseAmount === undefined)
        sellParams.baseAmount = orderBook.baseAmount;
      // Define amount when not undefined but base amount is undefined
      else if (sellParams.amount !== undefined) {
        // Convert amount percentage to number if needed
        if (typeof sellParams.amount === "string") {
          if (sellParams.amount.includes("%")) sellParams.amount = sellParams.amount.replace("%", "");
          else
            return {
              error: true,
              data: `If sending a string for sell amount you must provide a %, instead received ${sellParams.amount}`,
            };
          if (typeof +sellParams.amount === "number" && +sellParams.amount <= 100 && +sellParams.amount > 0) {
            sellParams.baseAmount = orderBook.baseAmount * (+sellParams.amount / 100);
          } else
            return {
              error: true,
              data: `Sell amount does not have a valid number or is not > 0 and <= 100, expected a valid number instead received ${sellParams.amount}`,
            };
        }

        // Define base amount
        else if (
          typeof sellParams.amount === "number" &&
          typeof sellParams.price === "number" &&
          sellParams.amount > 0
        ) {
          sellParams.baseAmount = sellParams.amount / sellParams.price;
        } else
          return {
            error: true,
            data: `Sell amount must be more than 0 or symbol price does not have a valid number, instead received amount: ${sellParams.amount} and symbol price: ${sellParams.price}`,
          };
      }

      // Return if nothing to sell
      if (typeof sellParams.baseAmount === "number" && sellParams.baseAmount <= 0)
        return { error: false, data: "Returning because there is no amount to sell" };

      // Make sure sell amount is not larger then amount to sell
      if (typeof sellParams.baseAmount === "number" && sellParams.baseAmount > orderBook.baseAmount) {
        sellParams.baseAmount = orderBook.baseAmount;
      }

      if (typeof sellParams.baseAmount === "number" && typeof sellParams.price === "number") {
        // Define amount after fee
        let amountAfterFee = sellParams.baseAmount;

        // Perfrom sell math
        if (sellParams.percentFee > 0) amountAfterFee = sellParams.baseAmount * (1 - sellParams.percentFee / 100);
        orderBook.baseAmount -= sellParams.baseAmount;
        orderBook.quoteAmount += amountAfterFee * sellParams.price;
        orderBook.fakeQuoteAmount += amountAfterFee * sellParams.price;

        // Set and push in order
        order.amount = round(sellParams.baseAmount * sellParams.price);
      }

      order.quoteAmount = round(orderBook.quoteAmount);
      order.baseAmount = round(orderBook.baseAmount);
      order.borrowedBaseAmount = round(orderBook.borrowedBaseAmount);

      // Update order book with percentage if completely sold
      if (orderBook.baseAmount === 0 && orderBook.borrowedBaseAmount === 0) {
        // Find percentage between preBought and sold
        const percentBetween = -(
          ((orderBook.preBoughtQuoteAmount - orderBook.quoteAmount) / orderBook.preBoughtQuoteAmount) *
          100
        );
        order.profitAmount = +-(orderBook.preBoughtQuoteAmount - orderBook.quoteAmount).toFixed(2);
        order.profitPercent = +percentBetween.toFixed(2);
      }

      order.worth = (await getCurrentWorth(sellParams.currentClose)).close;

      //Push in long order
      allOrders.push(order);
    }

    // Define order entry for short
    const orderShort: Order = {
      type: "sell",
      position: "short",
      price: sellParams.price,
      amount: 0,
      worth: 0,
      quoteAmount: 0,
      baseAmount: 0,
      borrowedBaseAmount: 0,
      profitAmount: 0,
      profitPercent: 0,
      time: sellParams.date,
    };

    // Sell on short position
    if (sellParams.position === "short" || sellParams.position === "both") {
      if (sellParams.position === "both") {
        sellParams.amount = undefined;
        sellParams.baseAmount = undefined;
      }

      // Define amount if undefined
      if (sellParams.amount === undefined && sellParams.baseAmount === undefined)
        sellParams.baseAmount = orderBook.borrowedBaseAmount;
      // Define amount when not undefined but base amount is undefined
      else if (sellParams.amount !== undefined) {
        // Convert amount percentage to number if needed
        if (typeof sellParams.amount === "string") {
          if (sellParams.amount.includes("%")) sellParams.amount = sellParams.amount.replace("%", "");
          else
            return {
              error: true,
              data: `If sending a string for sell amount you must provide a %', instead received ${sellParams.amount}`,
            };
          if (typeof +sellParams.amount === "number" && +sellParams.amount <= 100 && +sellParams.amount > 0) {
            sellParams.baseAmount = orderBook.borrowedBaseAmount * (+sellParams.amount / 100);
          } else
            return {
              error: true,
              data: `Sell amount does not have a valid number or is not > 0 and <= 100, expected a valid number instead received ${sellParams.amount}`,
            };
        }

        // Define base amount
        else if (
          typeof sellParams.amount === "number" &&
          typeof sellParams.price === "number" &&
          sellParams.amount > 0
        ) {
          sellParams.baseAmount = sellParams.amount / sellParams.price;
        } else
          return {
            error: true,
            data: `Sell amount must be more than 0 or symbol price does not have a valid number, instead received amount: ${sellParams.amount} and symbol price: ${sellParams.price}`,
          };
      }

      // Return if nothing to sell
      if (typeof sellParams.baseAmount === "number" && sellParams.baseAmount <= 0)
        return { error: false, data: "Returning because there is no amount to sell" };

      // Make sure sell amount is not larger then amount to sell
      if (typeof sellParams.baseAmount === "number" && sellParams.baseAmount > orderBook.borrowedBaseAmount) {
        sellParams.baseAmount = orderBook.borrowedBaseAmount;
      }

      if (typeof sellParams.baseAmount === "number" && typeof sellParams.price === "number") {
        // Define amount after fee
        let amountAfterFee = sellParams.baseAmount;

        // Perfrom sell math
        if (sellParams.percentFee > 0) amountAfterFee = sellParams.baseAmount * (1 - sellParams.percentFee / 100);
        const price = amountAfterFee * sellParams.price;
        orderBook.borrowedBaseAmount -= sellParams.baseAmount;
        orderBook.fakeQuoteAmount -= price;
        if (orderBook.borrowedBaseAmount === 0) orderBook.quoteAmount = orderBook.fakeQuoteAmount;
        else orderBook.quoteAmount += price;

        // Set and push in order
        orderShort.amount = round(sellParams.baseAmount * sellParams.price);
      }

      // Update quote and base amount in order
      orderShort.quoteAmount = round(orderBook.quoteAmount);
      orderShort.baseAmount = round(orderBook.baseAmount);
      orderShort.borrowedBaseAmount = round(orderBook.borrowedBaseAmount);

      // Update order with percentage if completely sold
      if (orderBook.baseAmount === 0 && orderBook.borrowedBaseAmount === 0) {
        // Find percentage between preBought and sold
        const percentBetween = -(
          ((orderBook.preBoughtQuoteAmount - orderBook.quoteAmount) / orderBook.preBoughtQuoteAmount) *
          100
        );
        orderShort.profitAmount = +-(orderBook.preBoughtQuoteAmount - orderBook.quoteAmount).toFixed(2);
        orderShort.profitPercent = +percentBetween.toFixed(2);
      }

      // Push in order
      orderShort.worth = (await getCurrentWorth(sellParams.currentClose)).close;
      allOrders.push(orderShort);
    }

    // Update if bought or not
    orderBook.boughtLong = orderBook.baseAmount === 0 ? false : true;
    orderBook.boughtShort = orderBook.borrowedBaseAmount === 0 ? false : true;
    orderBook.bought = orderBook.boughtLong || orderBook.boughtShort;

    // Update pre bought amount if completely sold
    if (!orderBook.bought) orderBook.preBoughtQuoteAmount = orderBook.quoteAmount;

    // Reset stop loss and take profit
    orderBook.stopLoss = 0;
    orderBook.takeProfit = 0;
  }
}
