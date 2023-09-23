import tradeConfig from "../configs/trade-config.js";
import { binanceFuturesAPI } from "./web-services.js";
import { sendLineNotify } from "./common.js";
import { getSignature } from "./helpers.js";

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

const placeMultipleOrders = async (
  quantity,
  price,
  takeProfitPrice,
  stopLossPrice
) => {
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
};

export { newOrder, placeMultipleOrders };
