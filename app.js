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
  getHighestGainsSymbol,
  getPositionInformation
} from "./src/helpers.js";
import { changeInitialLeverage, placeMultipleOrders } from "./src/trade.js";
import { asyncLocalStorage } from "./src/storage.js";
import tradeConfig from "./configs/trade-config.js";

const { LEVERAGE } = tradeConfig;

const executeTradingStrategy = async () => {
  try {
    const allowNewOrders = await getAllowNewOrders();
    logWithTime(`allowNewOrders: ${allowNewOrders}`);
    if (allowNewOrders) {
      const highestGainsSymbol = await getHighestGainsSymbol();
      if (highestGainsSymbol !== "NONE") {
        asyncLocalStorage.run({ symbol: highestGainsSymbol }, async () => {
          const positionInformation = await getPositionInformation();
          if (Number(positionInformation.leverage) !== LEVERAGE) {
            await changeInitialLeverage();
          }
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
        });
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
