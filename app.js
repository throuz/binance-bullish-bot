import schedule from "node-schedule";
import { errorHandler, logWithTime } from "./src/common.js";
import {
  getFibonacciLevels,
  getMarkPrice,
  getTPSL,
  roundToDecimalPlace,
  getAllowNewOrders,
  getOrderQuantity,
  getPrecisions,
  getHighestGainsSymbol
} from "./src/helpers.js";
import { placeMultipleOrders } from "./src/trade.js";

const executeTradingStrategy = async () => {
  try {
    const allowNewOrders = await getAllowNewOrders();
    logWithTime(`allowNewOrders: ${allowNewOrders}`);
    if (allowNewOrders) {
      // const highestGainsSymbol = await getHighestGainsSymbol();
      // console.log(highestGainsSymbol);
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
        const precisions = await getPrecisions();
        const { quantityPrecision, pricePrecision } = precisions;
        await placeMultipleOrders(
          roundToDecimalPlace(orderQuantity, quantityPrecision),
          roundToDecimalPlace(markPrice, pricePrecision),
          roundToDecimalPlace(takeProfitPrice, pricePrecision),
          roundToDecimalPlace(stopLossPrice, pricePrecision)
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
