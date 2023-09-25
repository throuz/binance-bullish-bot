import schedule from "node-schedule";
import { errorHandler, logWithTime } from "./src/common.js";
import {
  getFibonacciLevels,
  getMarkPrice,
  getTPSL,
  roundToDecimalPlace,
  getAllowNewOrders,
  getOrderQuantity
} from "./src/helpers.js";
import { placeMultipleOrders } from "./src/trade.js";

const executeTradingStrategy = async () => {
  try {
    const allowNewOrders = await getAllowNewOrders();
    logWithTime(`allowNewOrders: ${allowNewOrders}`);
    if (allowNewOrders) {
      const markPrice = await getMarkPrice();
      const fibonacciLevels = await getFibonacciLevels();
      const isPriceInSafeZone = markPrice > fibonacciLevels[1];
      logWithTime(`isPriceInSafeZone: ${isPriceInSafeZone}`);
      if (isPriceInSafeZone) {
        const orderQuantity = await getOrderQuantity();
        const { takeProfitPrice, stopLossPrice } = getTPSL(
          markPrice,
          fibonacciLevels
        );
        await placeMultipleOrders(
          roundToDecimalPlace(orderQuantity, 3),
          roundToDecimalPlace(markPrice, 1),
          roundToDecimalPlace(takeProfitPrice, 1),
          roundToDecimalPlace(stopLossPrice, 1)
        );
      }
    }
  } catch (error) {
    await errorHandler(error);
  }
};

executeTradingStrategy();
schedule.scheduleJob("*/1 * * * *", () => {
  executeTradingStrategy();
});
