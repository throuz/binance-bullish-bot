import { binanceFuturesAPI } from "./web-services.js";
import { sendLineNotify, errorHandler } from "./common.js";
import { getSignature, getPositionInformation } from "./helpers.js";
import { getSymbol } from "./storage.js";
import tradeConfig from "../configs/trade-config.js";

const { LEVERAGE } = tradeConfig;

const changeInitialLeverage = async () => {
  const symbol = getSymbol();
  const totalParams = {
    symbol,
    leverage: LEVERAGE,
    timestamp: Date.now()
  };
  const signature = getSignature(totalParams);
  await binanceFuturesAPI.post("/fapi/v1/leverage", {
    ...totalParams,
    signature
  });
  await sendLineNotify("Change Initial Leverage!");
};

const newOrder = async (totalParams) => {
  const signature = getSignature(totalParams);
  const response = await binanceFuturesAPI.post("/fapi/v1/order", {
    ...totalParams,
    signature
  });
  const { symbol, type, origQty, price } = response.data;
  await sendLineNotify(`New order! ${symbol} ${type} ${origQty} ${price}`);
};

const cancelAllOpenOrders = async () => {
  const symbol = getSymbol();
  const totalParams = {
    symbol,
    timestamp: Date.now()
  };
  const signature = getSignature(totalParams);
  await binanceFuturesAPI.delete("/fapi/v1/allOpenOrders", {
    params: { ...totalParams, signature }
  });
  await sendLineNotify("Cancel all open orders!");
};

const closePosition = async () => {
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

const placeMultipleOrders = async (
  quantity,
  takeProfitPrice,
  stopLossPrice
) => {
  try {
    const symbol = getSymbol();
    await Promise.all([
      newOrder({
        symbol,
        side: "BUY",
        type: "MARKET",
        quantity,
        timestamp: Date.now()
      }),
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

export {
  changeInitialLeverage,
  newOrder,
  cancelAllOpenOrders,
  closePosition,
  placeMultipleOrders
};
