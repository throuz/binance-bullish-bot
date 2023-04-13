import tradeConfig from "../configs/trade-config.js";
import { binanceFuturesAPI } from "./web-services.js";
import { sendLineNotify } from "./common.js";
import {
  getSignature,
  getPositionAmount,
  getOppositeSide,
  getPositionDirection,
  getInvestableQuantity
} from "./helpers.js";

const { SYMBOL, ORDER_QUANTITY } = tradeConfig;

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
  await sendLineNotify(`New order! ${side} ${quantity}`);
};

const openPosition = async (signal) => {
  const investableQuantity = await getInvestableQuantity();
  if (investableQuantity >= ORDER_QUANTITY) {
    await newOrder(signal, ORDER_QUANTITY);
  } else {
    await sendLineNotify("Insufficient quantity, unable to place an order!");
  }
};

const closePosition = async (signal) => {
  const positionAmount = await getPositionAmount();
  const positionDirection = getPositionDirection(positionAmount);
  const oppositeSignal = getOppositeSide(signal);
  if (positionDirection === oppositeSignal) {
    const closeQuantity = Math.abs(positionAmount);
    await newOrder(signal, closeQuantity);
  }
};

export { newOrder, openPosition, closePosition };
