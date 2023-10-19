import { LEVERAGE } from "../configs/trade-config.js";
import { sendLineNotify } from "./common.js";
import {
  getPositionInformation,
  getOrderQuantity,
  formatBySize,
  getStepSize
} from "./helpers.js";
import { changeInitialLeverageAPI, newOrderAPI } from "./api.js";
import { nodeCache } from "./cache.js";

export const changeInitialLeverage = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol, leverage: LEVERAGE, timestamp: Date.now() };
  await changeInitialLeverageAPI(totalParams);
  await sendLineNotify(`Change Initial Leverage! ${symbol} ${LEVERAGE}`);
};

export const newOrder = async (totalParams) => {
  const response = await newOrderAPI(totalParams);
  const { symbol, side, origQty } = response;
  await sendLineNotify(`New order! ${symbol} ${side} ${origQty}`);
  return response;
};

export const openPosition = async () => {
  const symbol = nodeCache.get("symbol");
  const positionInformation = await getPositionInformation();
  if (Number(positionInformation.leverage) !== LEVERAGE) {
    await changeInitialLeverage();
  }
  const [orderQuantity, stepSize] = await Promise.all([
    getOrderQuantity(),
    getStepSize()
  ]);
  await newOrder({
    symbol,
    side: "BUY",
    type: "MARKET",
    quantity: formatBySize(orderQuantity, stepSize),
    timestamp: Date.now()
  });
  await sendLineNotify("Open position!");
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
