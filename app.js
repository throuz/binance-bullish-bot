import tradeConfig from "./configs/trade-config.js";
import { errorHandler } from "./src/common.js";
import {
  getFibonacciLevels,
  getMarkPrice,
  getTPSL,
  roundToDecimalPlace,
  getAllowNewOrders,
  getOrderQuantity
} from "./src/helpers.js";
import { placeMultipleOrders } from "./src/trade.js";

const { RUN_STRATEGY_INTERVAL } = tradeConfig;

const executeTradingStrategy = async () => {
  try {
    const allowNewOrders = await getAllowNewOrders();
    if (allowNewOrders) {
      const markPrice = await getMarkPrice();
      const fibonacciLevels = await getFibonacciLevels();
      const isInSaveZone = markPrice > fibonacciLevels[1];
      if (isInSaveZone) {
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
setInterval(() => {
  executeTradingStrategy();
}, RUN_STRATEGY_INTERVAL);
