import { LEVERAGE } from "../configs/trade-config.js";
import { sendLineNotify, errorHandler } from "./common.js";
import { getPositionInformation, getCurrentAllOpenOrders } from "./helpers.js";
import {
  changeInitialLeverageAPI,
  newOrderAPI,
  cancelAllOpenOrdersAPI
} from "./api.js";
import { nodeCache } from "./cache.js";

export const changeInitialLeverage = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol, leverage: LEVERAGE, timestamp: Date.now() };
  await changeInitialLeverageAPI(totalParams);
  await sendLineNotify(`Change Initial Leverage! ${symbol} ${LEVERAGE}`);
};

export const newOrder = async (totalParams) => {
  const response = await newOrderAPI(totalParams);
  const { symbol, type, origQty, price } = response;
  await sendLineNotify(`New order! ${symbol} ${type} ${origQty} ${price}`);
  return response;
};

export const cancelAllOpenOrders = async () => {
  const currentAllOpenOrders = await getCurrentAllOpenOrders();
  if (currentAllOpenOrders.length > 0) {
    const symbol = nodeCache.get("symbol");
    await cancelAllOpenOrdersAPI({ symbol, timestamp: Date.now() });
    await sendLineNotify("Cancel all open orders!");
  }
};

export const closePosition = async () => {
  const symbol = nodeCache.get("symbol");
  const positionInformation = await getPositionInformation();
  const { positionAmt } = positionInformation;
  if (positionAmt > 0) {
    await newOrder({
      symbol,
      side: "SELL",
      type: "MARKET",
      quantity: positionAmt,
      timestamp: Date.now()
    });
    await sendLineNotify("Close position!");
  }
};

export const placeMultipleOrders = async (
  quantity,
  takeProfitPrice,
  stopLossPrice
) => {
  try {
    const symbol = nodeCache.get("symbol");
    await newOrder({
      symbol,
      side: "BUY",
      type: "MARKET",
      quantity,
      timestamp: Date.now()
    });
    const results = await Promise.all([
      newOrder({
        symbol,
        side: "SELL",
        type: "TAKE_PROFIT",
        timeInForce: "GTE_GTC",
        quantity,
        price: takeProfitPrice,
        stopPrice: takeProfitPrice,
        timestamp: Date.now()
      }),
      newOrder({
        symbol,
        side: "SELL",
        type: "STOP",
        timeInForce: "GTE_GTC",
        quantity,
        price: stopLossPrice,
        stopPrice: stopLossPrice,
        timestamp: Date.now()
      })
    ]);
    const resultTypes = results.map((result) => result.type);
    if (resultTypes.includes("LIMIT")) {
      await sendLineNotify("Has limit order when place multiple orders");
      await cancelAllOpenOrders();
      await closePosition();
    }
  } catch (error) {
    await sendLineNotify("Error occurred during place multiple orders");
    await errorHandler(error);
    await cancelAllOpenOrders();
    await closePosition();
  }
};
