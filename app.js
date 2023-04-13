import tradeConfig from "./configs/trade-config.js";
import { sendLineNotify, logWithTime } from "./src/common.js";
import {
  getPositionAmount,
  getOppositeSide,
  getPositionDirection,
  getAvailableQuantity,
  getAllowableQuantity
} from "./src/helpers.js";
import getSignal from "./src/getSignal.js";
import { newOrder } from "./src/trade.js";

const { ORDER_QUANTITY } = tradeConfig;

const openPosition = async (signal) => {
  const [availableQuantity, allowableQuantity] = await Promise.all([
    getAvailableQuantity(),
    getAllowableQuantity()
  ]);

  if (Math.min(availableQuantity, allowableQuantity) >= ORDER_QUANTITY) {
    await newOrder(signal, ORDER_QUANTITY);
  } else {
    logWithTime("Insufficient quantity, unable to place an order!");
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

const check = async () => {
  try {
    const signal = await getSignal();
    if (signal !== "NONE") {
      await closePosition(signal);
      await openPosition(signal);
    }
  } catch (error) {
    if (error.response) {
      sendLineNotify(
        "The request was made and the server responded with a status code that falls out of the range of 2xx"
      );
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      sendLineNotify("The request was made but no response was received");
      console.log(error.request);
    } else {
      sendLineNotify(
        "Something happened in setting up the request that triggered an Error"
      );
      console.log("Error", error.message);
    }
    console.log(error.config);
  }
};

check();
setInterval(() => {
  check();
}, 60000);
