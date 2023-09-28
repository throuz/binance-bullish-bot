import tradeConfig from "../configs/trade-config.js";
import { binanceFuturesAPI } from "./web-services.js";
import { sendLineNotify, errorHandler } from "./common.js";
import { getSignature, getPositionInformation } from "./helpers.js";

const { SYMBOL } = tradeConfig;

const newOrder = async (totalParams) => {
  const signature = getSignature(totalParams);
  await binanceFuturesAPI.post("/fapi/v1/order", {
    ...totalParams,
    signature
  });
  await sendLineNotify(
    `New order! ${totalParams.type} ${totalParams.quantity} ${totalParams.price}`
  );
};

const cancelAllOpenOrders = async () => {
  const totalParams = {
    symbol: SYMBOL,
    timestamp: Date.now()
  };
  const signature = getSignature(totalParams);
  await binanceFuturesAPI.delete("/fapi/v1/allOpenOrders", {
    params: { ...totalParams, signature }
  });
  await sendLineNotify("Cancel all open orders!");
};

const closePosition = async () => {
  const positionInformation = await getPositionInformation();
  const { positionAmt } = positionInformation;
  if (positionAmt > 0) {
    await newOrder({
      symbol: SYMBOL,
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
  price,
  takeProfitPrice,
  stopLossPrice
) => {
  try {
    await newOrder({
      symbol: SYMBOL,
      side: "BUY",
      type: "LIMIT",
      timeInForce: "GTC",
      quantity,
      price,
      timestamp: Date.now()
    });
    await newOrder({
      symbol: SYMBOL,
      side: "SELL",
      type: "TAKE_PROFIT",
      timeInForce: "GTE_GTC",
      quantity,
      price: takeProfitPrice,
      stopPrice: takeProfitPrice,
      timestamp: Date.now()
    });
    await newOrder({
      symbol: SYMBOL,
      side: "SELL",
      type: "STOP",
      timeInForce: "GTE_GTC",
      quantity,
      price: stopLossPrice,
      stopPrice: stopLossPrice,
      timestamp: Date.now()
    });
  } catch (error) {
    await sendLineNotify("Error occurred during place multiple orders");
    await errorHandler(error);
    await cancelAllOpenOrders();
    await closePosition();
  }
};

export { newOrder, placeMultipleOrders };
