import { changeInitialLeverageAPI, newOrderAPI } from "./api.js";
import { nodeCache } from "./cache.js";
import { sendLineNotify } from "./common.js";
import {
  formatBySize,
  getMaxLeverage,
  getOrderQuantity,
  getPositionInformation,
  getStepSize
} from "./helpers.js";
import { getStorageData, setStorageData } from "../storage/storage.js";

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
  const [positionInformation, maxLeverage] = await Promise.all([
    getPositionInformation(),
    getMaxLeverage()
  ]);
  if (Number(positionInformation.leverage) !== maxLeverage) {
    await changeToMaxLeverage();
  }
  const symbol = nodeCache.get("symbol");
  const openSide = await getStorageData("openSide");
  const [orderQuantity, stepSize] = await Promise.all([
    getOrderQuantity(),
    getStepSize()
  ]);
  await newOrder({
    symbol,
    side: openSide,
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
    const symbol = nodeCache.get("symbol");
    const openSide = await getStorageData("openSide");
    const closeSide = await getStorageData("closeSide");
    await newOrder({
      symbol,
      side: closeSide,
      type: "MARKET",
      quantity: positionAmt,
      timestamp: Date.now()
    });
    await sendLineNotify("Close position!");
    if (unRealizedProfit < 0) {
      setStorageData("openSide", closeSide);
      setStorageData("closeSide", openSide);
    }
  }
};
