import { sendLineNotify, errorHandler } from "./common.js";
import { getPositionInformation } from "./helpers.js";
import {
  changeInitialLeverageAPI,
  newOrderAPI,
  cancelAllOpenOrdersAPI
} from "./api.js";
import { getSymbol } from "./storage.js";
import { LEVERAGE } from "../configs/trade-config.js";

export const changeInitialLeverage = async () => {
  const symbol = getSymbol();
  const totalParams = { symbol, leverage: LEVERAGE, timestamp: Date.now() };
  await changeInitialLeverageAPI(totalParams);
  await sendLineNotify("Change Initial Leverage!");
};

export const newOrder = async (totalParams) => {
  const response = await newOrderAPI(totalParams);
  const { symbol, type, origQty, price } = response.data;
  await sendLineNotify(`New order! ${symbol} ${type} ${origQty} ${price}`);
};

export const cancelAllOpenOrders = async () => {
  const symbol = getSymbol();
  const totalParams = { symbol, timestamp: Date.now() };
  await cancelAllOpenOrdersAPI(totalParams);
  await sendLineNotify("Cancel all open orders!");
};

export const closePosition = async () => {
  const symbol = getSymbol();
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
    const symbol = getSymbol();
    await newOrder({
      symbol,
      side: "BUY",
      type: "MARKET",
      quantity,
      timestamp: Date.now()
    });
    await Promise.all([
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
  } catch (error) {
    await sendLineNotify("Error occurred during place multiple orders");
    await errorHandler(error);
    await cancelAllOpenOrders();
    await closePosition();
  }
};
