import tradeConfig from "./configs/trade-config.js";
import { log } from "./src/common.js";
import {
  getPositionAmount,
  getOppositeSide,
  getSignal,
  getPositionDirection,
  getAvailableQuantity,
  getAllowableQuantity
} from "./src/helpers.js";
import { newOrder } from "./src/trade.js";

const { INITIAL_QUANTITY, POSITION_SCALE_OUT_RATE } = tradeConfig;

let addPositionTimes = 0;

const openPosition = async (signal) => {
  const [availableQuantity, allowableQuantity] = await Promise.all([
    getAvailableQuantity(),
    getAllowableQuantity()
  ]);

  const orderQuantity =
    Math.trunc(
      INITIAL_QUANTITY * POSITION_SCALE_OUT_RATE ** addPositionTimes * 1000
    ) / 1000;

  if (Math.min(availableQuantity, allowableQuantity) >= orderQuantity) {
    await newOrder(signal, orderQuantity);
    addPositionTimes++;
  } else {
    log("Insufficient quantity, unable to place an order!");
  }
};

const closePosition = async (signal) => {
  const positionAmount = await getPositionAmount();
  const positionDirection = getPositionDirection(positionAmount);
  const oppositeSignal = getOppositeSide(signal);

  if (positionDirection === oppositeSignal) {
    addPositionTimes = 0;
    const closeQuantity = Math.abs(positionAmount);
    await newOrder(signal, closeQuantity);
  }
};

const check = async () => {
  const signal = await getSignal();
  if (signal !== "NONE") {
    await closePosition(signal);
    await openPosition(signal);
  }
};

check();
setInterval(() => {
  check();
}, 60000);
