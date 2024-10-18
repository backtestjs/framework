"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realSell = exports.realBuy = exports.getCurrentWorth = exports.clearOrders = exports.allOrders = exports.orderBook = void 0;
const parse_1 = require("./parse");
exports.orderBook = {
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
exports.allOrders = [];
async function clearOrders() {
    exports.allOrders = [];
}
exports.clearOrders = clearOrders;
async function getCurrentWorth(close, high, low, open) {
    if (!exports.orderBook.bought)
        return {
            close: (0, parse_1.round)(exports.orderBook.quoteAmount),
            high: (0, parse_1.round)(exports.orderBook.quoteAmount),
            low: (0, parse_1.round)(exports.orderBook.quoteAmount),
            open: (0, parse_1.round)(exports.orderBook.quoteAmount),
        };
    let currentWorth = exports.orderBook.fakeQuoteAmount;
    currentWorth += exports.orderBook.baseAmount * close;
    currentWorth -= exports.orderBook.borrowedBaseAmount * close;
    if (high !== undefined && low !== undefined && open !== undefined) {
        let openWorth = exports.orderBook.fakeQuoteAmount;
        openWorth += exports.orderBook.baseAmount * open;
        openWorth -= exports.orderBook.borrowedBaseAmount * open;
        let highestWorth = exports.orderBook.fakeQuoteAmount;
        highestWorth += exports.orderBook.baseAmount * high;
        highestWorth -= exports.orderBook.borrowedBaseAmount * high;
        let lowestWorth = exports.orderBook.fakeQuoteAmount;
        lowestWorth += exports.orderBook.baseAmount * low;
        lowestWorth -= exports.orderBook.borrowedBaseAmount * low;
        return {
            close: (0, parse_1.round)(currentWorth),
            high: highestWorth >= lowestWorth ? (0, parse_1.round)(highestWorth) : (0, parse_1.round)(lowestWorth),
            low: highestWorth >= lowestWorth ? (0, parse_1.round)(lowestWorth) : (0, parse_1.round)(highestWorth),
            open: (0, parse_1.round)(openWorth),
        };
    }
    return { close: (0, parse_1.round)(currentWorth), high: (0, parse_1.round)(currentWorth), low: (0, parse_1.round)(currentWorth), open: (0, parse_1.round)(currentWorth) };
}
exports.getCurrentWorth = getCurrentWorth;
async function realBuy(buyParams) {
    var _a, _b, _c;
    if (exports.orderBook.quoteAmount > 0) {
        buyParams.price = (_a = buyParams.price) !== null && _a !== void 0 ? _a : 0;
        buyParams.percentSlippage = (_b = buyParams.percentSlippage) !== null && _b !== void 0 ? _b : 0;
        buyParams.percentFee = (_c = buyParams.percentFee) !== null && _c !== void 0 ? _c : 0;
        if (buyParams.position === undefined)
            buyParams.position = "long";
        if (buyParams.position === "long" && buyParams.percentSlippage > 0) {
            buyParams.price = buyParams.price * (1 + buyParams.percentSlippage / 100);
        }
        else if (buyParams.position === "short" && buyParams.percentSlippage > 0) {
            buyParams.price = buyParams.price * (1 - buyParams.percentSlippage / 100);
        }
        const order = {
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
        if (buyParams.amount !== undefined && buyParams.baseAmount !== undefined)
            return {
                error: true,
                data: `Cannot send amount and base amount for a buy order, sent amount: ${buyParams.amount} and base amount: ${buyParams.baseAmount}`,
            };
        else if (buyParams.amount === undefined && buyParams.baseAmount === undefined)
            buyParams.amount = exports.orderBook.quoteAmount;
        else if (buyParams.baseAmount !== undefined) {
            buyParams.amount = buyParams.baseAmount * buyParams.price;
        }
        else if (typeof buyParams.amount === "string") {
            if (buyParams.amount.includes("%"))
                buyParams.amount = buyParams.amount.replace("%", "");
            else
                return {
                    error: true,
                    data: `If sending a string for buy amount you must provide a % instead received ${buyParams.amount}`,
                };
            if (typeof +buyParams.amount === "number" && +buyParams.amount <= 100 && +buyParams.amount > 0) {
                buyParams.amount = exports.orderBook.quoteAmount * (+buyParams.amount / 100);
            }
            else
                return {
                    error: true,
                    data: `Buy amount does not have a valid number or is not > 0 and <= 100, expected a valid number instead received ${buyParams.amount}`,
                };
        }
        if (typeof buyParams.amount === "number" && buyParams.amount <= 0)
            return { error: false, data: "Returning because there is no amount to buy" };
        if (typeof buyParams.amount === "number" && buyParams.amount > exports.orderBook.quoteAmount) {
            buyParams.amount = exports.orderBook.quoteAmount;
        }
        if (typeof buyParams.amount === "number") {
            let amountAfterFee = buyParams.amount;
            if (buyParams.percentFee > 0)
                amountAfterFee = buyParams.amount * (1 - buyParams.percentFee / 100);
            if (!exports.orderBook.bought) {
                exports.orderBook.preBoughtQuoteAmount = exports.orderBook.quoteAmount;
                exports.orderBook.bought = true;
            }
            if (buyParams.position === "long") {
                exports.orderBook.baseAmount += amountAfterFee / buyParams.price;
                exports.orderBook.quoteAmount -= buyParams.amount;
                exports.orderBook.fakeQuoteAmount -= buyParams.amount;
            }
            else if (buyParams.position === "short") {
                if (buyParams.percentFee > 0)
                    amountAfterFee = buyParams.amount * (1 + buyParams.percentFee / 100);
                exports.orderBook.quoteAmount -= buyParams.amount;
                exports.orderBook.fakeQuoteAmount += buyParams.amount;
                exports.orderBook.borrowedBaseAmount += amountAfterFee / buyParams.price;
                order.position = "short";
            }
            exports.orderBook.boughtLong = exports.orderBook.baseAmount === 0 ? false : true;
            exports.orderBook.boughtShort = exports.orderBook.borrowedBaseAmount === 0 ? false : true;
            order.quoteAmount = (0, parse_1.round)(exports.orderBook.quoteAmount);
            order.baseAmount = (0, parse_1.round)(exports.orderBook.baseAmount);
            order.borrowedBaseAmount = (0, parse_1.round)(exports.orderBook.borrowedBaseAmount);
            order.amount = (0, parse_1.round)(buyParams.amount);
            order.worth = (await getCurrentWorth(buyParams.currentClose)).close;
            exports.allOrders.push(order);
            return { error: false, data: `Successfully bought amount of ${buyParams.amount}` };
        }
        else
            return {
                error: true,
                data: `Buy amount or symbol price does not have a valid number', expected a valid number instead received amount: ${buyParams.amount} and symbol price: ${buyParams.price}`,
            };
    }
}
exports.realBuy = realBuy;
async function realSell(sellParams) {
    var _a, _b, _c;
    if (exports.orderBook.bought) {
        sellParams.price = (_a = sellParams.price) !== null && _a !== void 0 ? _a : 0;
        sellParams.percentSlippage = (_b = sellParams.percentSlippage) !== null && _b !== void 0 ? _b : 0;
        sellParams.percentFee = (_c = sellParams.percentFee) !== null && _c !== void 0 ? _c : 0;
        if (sellParams.position === undefined) {
            if (exports.orderBook.baseAmount > 0 && exports.orderBook.borrowedBaseAmount > 0)
                sellParams.position = "both";
            else if (exports.orderBook.baseAmount > 0)
                sellParams.position = "long";
            else if (exports.orderBook.borrowedBaseAmount > 0)
                sellParams.position = "short";
        }
        if (sellParams.position === "long" && sellParams.percentSlippage > 0) {
            sellParams.price = sellParams.price * (1 - sellParams.percentSlippage / 100);
        }
        else if (sellParams.position === "short" && sellParams.percentSlippage > 0) {
            sellParams.price = sellParams.price * (1 + sellParams.percentSlippage / 100);
        }
        const order = {
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
        if (sellParams.position === "long" || sellParams.position === "both") {
            if (sellParams.amount === undefined && sellParams.baseAmount === undefined)
                sellParams.baseAmount = exports.orderBook.baseAmount;
            else if (sellParams.amount !== undefined) {
                if (typeof sellParams.amount === "string") {
                    if (sellParams.amount.includes("%"))
                        sellParams.amount = sellParams.amount.replace("%", "");
                    else
                        return {
                            error: true,
                            data: `If sending a string for sell amount you must provide a %, instead received ${sellParams.amount}`,
                        };
                    if (typeof +sellParams.amount === "number" && +sellParams.amount <= 100 && +sellParams.amount > 0) {
                        sellParams.baseAmount = exports.orderBook.baseAmount * (+sellParams.amount / 100);
                    }
                    else
                        return {
                            error: true,
                            data: `Sell amount does not have a valid number or is not > 0 and <= 100, expected a valid number instead received ${sellParams.amount}`,
                        };
                }
                else if (typeof sellParams.amount === "number" &&
                    typeof sellParams.price === "number" &&
                    sellParams.amount > 0) {
                    sellParams.baseAmount = sellParams.amount / sellParams.price;
                }
                else
                    return {
                        error: true,
                        data: `Sell amount must be more than 0 or symbol price does not have a valid number, instead received amount: ${sellParams.amount} and symbol price: ${sellParams.price}`,
                    };
            }
            if (typeof sellParams.baseAmount === "number" && sellParams.baseAmount <= 0)
                return { error: false, data: "Returning because there is no amount to sell" };
            if (typeof sellParams.baseAmount === "number" && sellParams.baseAmount > exports.orderBook.baseAmount) {
                sellParams.baseAmount = exports.orderBook.baseAmount;
            }
            if (typeof sellParams.baseAmount === "number" && typeof sellParams.price === "number") {
                let amountAfterFee = sellParams.baseAmount;
                if (sellParams.percentFee > 0)
                    amountAfterFee = sellParams.baseAmount * (1 - sellParams.percentFee / 100);
                exports.orderBook.baseAmount -= sellParams.baseAmount;
                exports.orderBook.quoteAmount += amountAfterFee * sellParams.price;
                exports.orderBook.fakeQuoteAmount += amountAfterFee * sellParams.price;
                order.amount = (0, parse_1.round)(sellParams.baseAmount * sellParams.price);
            }
            order.quoteAmount = (0, parse_1.round)(exports.orderBook.quoteAmount);
            order.baseAmount = (0, parse_1.round)(exports.orderBook.baseAmount);
            order.borrowedBaseAmount = (0, parse_1.round)(exports.orderBook.borrowedBaseAmount);
            if (exports.orderBook.baseAmount === 0 && exports.orderBook.borrowedBaseAmount === 0) {
                const percentBetween = -(((exports.orderBook.preBoughtQuoteAmount - exports.orderBook.quoteAmount) / exports.orderBook.preBoughtQuoteAmount) *
                    100);
                order.profitAmount = +-(exports.orderBook.preBoughtQuoteAmount - exports.orderBook.quoteAmount).toFixed(2);
                order.profitPercent = +percentBetween.toFixed(2);
            }
            order.worth = (await getCurrentWorth(sellParams.currentClose)).close;
            exports.allOrders.push(order);
        }
        const orderShort = {
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
        if (sellParams.position === "short" || sellParams.position === "both") {
            if (sellParams.position === "both") {
                sellParams.amount = undefined;
                sellParams.baseAmount = undefined;
            }
            if (sellParams.amount === undefined && sellParams.baseAmount === undefined)
                sellParams.baseAmount = exports.orderBook.borrowedBaseAmount;
            else if (sellParams.amount !== undefined) {
                if (typeof sellParams.amount === "string") {
                    if (sellParams.amount.includes("%"))
                        sellParams.amount = sellParams.amount.replace("%", "");
                    else
                        return {
                            error: true,
                            data: `If sending a string for sell amount you must provide a %', instead received ${sellParams.amount}`,
                        };
                    if (typeof +sellParams.amount === "number" && +sellParams.amount <= 100 && +sellParams.amount > 0) {
                        sellParams.baseAmount = exports.orderBook.borrowedBaseAmount * (+sellParams.amount / 100);
                    }
                    else
                        return {
                            error: true,
                            data: `Sell amount does not have a valid number or is not > 0 and <= 100, expected a valid number instead received ${sellParams.amount}`,
                        };
                }
                else if (typeof sellParams.amount === "number" &&
                    typeof sellParams.price === "number" &&
                    sellParams.amount > 0) {
                    sellParams.baseAmount = sellParams.amount / sellParams.price;
                }
                else
                    return {
                        error: true,
                        data: `Sell amount must be more than 0 or symbol price does not have a valid number, instead received amount: ${sellParams.amount} and symbol price: ${sellParams.price}`,
                    };
            }
            if (typeof sellParams.baseAmount === "number" && sellParams.baseAmount <= 0)
                return { error: false, data: "Returning because there is no amount to sell" };
            if (typeof sellParams.baseAmount === "number" && sellParams.baseAmount > exports.orderBook.borrowedBaseAmount) {
                sellParams.baseAmount = exports.orderBook.borrowedBaseAmount;
            }
            if (typeof sellParams.baseAmount === "number" && typeof sellParams.price === "number") {
                let amountAfterFee = sellParams.baseAmount;
                if (sellParams.percentFee > 0)
                    amountAfterFee = sellParams.baseAmount * (1 - sellParams.percentFee / 100);
                const price = amountAfterFee * sellParams.price;
                exports.orderBook.borrowedBaseAmount -= sellParams.baseAmount;
                exports.orderBook.fakeQuoteAmount -= price;
                if (exports.orderBook.borrowedBaseAmount === 0)
                    exports.orderBook.quoteAmount = exports.orderBook.fakeQuoteAmount;
                else
                    exports.orderBook.quoteAmount += price;
                orderShort.amount = (0, parse_1.round)(sellParams.baseAmount * sellParams.price);
            }
            orderShort.quoteAmount = (0, parse_1.round)(exports.orderBook.quoteAmount);
            orderShort.baseAmount = (0, parse_1.round)(exports.orderBook.baseAmount);
            orderShort.borrowedBaseAmount = (0, parse_1.round)(exports.orderBook.borrowedBaseAmount);
            if (exports.orderBook.baseAmount === 0 && exports.orderBook.borrowedBaseAmount === 0) {
                const percentBetween = -(((exports.orderBook.preBoughtQuoteAmount - exports.orderBook.quoteAmount) / exports.orderBook.preBoughtQuoteAmount) *
                    100);
                orderShort.profitAmount = +-(exports.orderBook.preBoughtQuoteAmount - exports.orderBook.quoteAmount).toFixed(2);
                orderShort.profitPercent = +percentBetween.toFixed(2);
            }
            orderShort.worth = (await getCurrentWorth(sellParams.currentClose)).close;
            exports.allOrders.push(orderShort);
        }
        exports.orderBook.boughtLong = exports.orderBook.baseAmount === 0 ? false : true;
        exports.orderBook.boughtShort = exports.orderBook.borrowedBaseAmount === 0 ? false : true;
        exports.orderBook.bought = exports.orderBook.boughtLong || exports.orderBook.boughtShort;
        if (!exports.orderBook.bought)
            exports.orderBook.preBoughtQuoteAmount = exports.orderBook.quoteAmount;
        exports.orderBook.stopLoss = 0;
        exports.orderBook.takeProfit = 0;
    }
}
exports.realSell = realSell;
//# sourceMappingURL=orders.js.map