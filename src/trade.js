import { sendLineNotify } from "./common.js";
import {
  getPositionInformation,
  getOrderQuantity,
  formatBySize,
  getStepSize,
  getMaxLeverage
} from "./helpers.js";
import { changeInitialLeverageAPI, newOrderAPI } from "./api.js";
import { nodeCache } from "./cache.js";
import { addTradesInSignalsJson, addWinsInSignalsJson } from "./signals.js";

export const changeToMaxLeverage = async () => {
  const symbol = nodeCache.get("symbol");
  const maxLeverage = await getMaxLeverage();
  const totalParams = { symbol, leverage: maxLeverage, timestamp: Date.now() };
  await changeInitialLeverageAPI(totalParams);
  await sendLineNotify(`Change To Max Leverage! ${symbol} ${maxLeverage}`);
};

export const newOrder = async (totalParams) => {
  await newOrderAPI(totalParams);
  const { symbol, side, quantity } = totalParams;
  await sendLineNotify(`New order! ${symbol} ${side} ${quantity}`);
};

export const openPosition = async () => {
  await addTradesInSignalsJson();
  const [positionInformation, maxLeverage] = await Promise.all([
    getPositionInformation(),
    getMaxLeverage()
  ]);
  if (Number(positionInformation.leverage) !== maxLeverage) {
    await changeToMaxLeverage();
  }
  const symbol = nodeCache.get("symbol");
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
  const positionInformation = await getPositionInformation();
  const { positionAmt, unRealizedProfit } = positionInformation;
  if (positionAmt > 0) {
    if (unRealizedProfit > 0) {
      await addWinsInSignalsJson();
    }
    const symbol = nodeCache.get("symbol");
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
