import tradeConfig from "../configs/trade-config.js";
import { binanceFuturesAPI } from "./web-services.js";
import { sendLineNotify, logWithTime } from "./common.js";
import { getSignature } from "./helpers.js";

const { SYMBOL } = tradeConfig;

const newOrder = async (side, quantity) => {
  const totalParams = {
    symbol: SYMBOL,
    type: "MARKET",
    side,
    quantity,
    timestamp: Date.now()
  };
  const signature = getSignature(totalParams);

  await binanceFuturesAPI.post("/fapi/v1/order", {
    ...totalParams,
    signature
  });
  logWithTime(`New order! ${side} ${quantity}`);
  await sendLineNotify(`New order! ${side} ${quantity}`);
};

export { newOrder };
