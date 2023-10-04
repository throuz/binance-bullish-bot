import schedule from "node-schedule";
import { errorHandler, logWithTime } from "./src/common.js";
import {
  getFibonacciLevels,
  getMarkPrice,
  getTPSL,
  formatBySize,
  getAllowNewOrders,
  getOrderQuantity,
  getSizes,
  getTopGainerSymbol,
  getPositionInformation
} from "./src/helpers.js";
import { changeInitialLeverage, placeMultipleOrders } from "./src/trade.js";
import { asyncLocalStorage } from "./src/storage.js";
import { LEVERAGE, SAFE_ZONE_INDEX } from "./configs/trade-config.js";

const executePlaceOrders = async () => {
  try {
    const positionInformation = await getPositionInformation();
    if (Number(positionInformation.leverage) !== LEVERAGE) {
      await changeInitialLeverage();
    }
    const [markPrice, fibonacciLevels] = await Promise.all([
      getMarkPrice(),
      getFibonacciLevels()
    ]);
    const isPriceInSafeZone = markPrice > fibonacciLevels[SAFE_ZONE_INDEX];
    logWithTime(`isPriceInSafeZone: ${isPriceInSafeZone}`);
    if (isPriceInSafeZone) {
      const [orderQuantity, sizes] = await Promise.all([
        getOrderQuantity(),
        getSizes()
      ]);
      const { tickSize, stepSize } = sizes;
      const { takeProfitPrice, stopLossPrice } = getTPSL(
        markPrice,
        fibonacciLevels
      );
      await placeMultipleOrders(
        formatBySize(orderQuantity, stepSize),
        formatBySize(takeProfitPrice, tickSize),
        formatBySize(stopLossPrice, tickSize)
      );
    }
  } catch (error) {
    await errorHandler(error);
  }
};

const executeTradingStrategy = async () => {
  try {
    const allowNewOrders = await getAllowNewOrders();
    logWithTime(`allowNewOrders: ${allowNewOrders}`);
    if (allowNewOrders) {
      const topGainerSymbol = await getTopGainerSymbol();
      if (topGainerSymbol) {
        asyncLocalStorage.run({ symbol: topGainerSymbol }, executePlaceOrders);
      }
    }
  } catch (error) {
    await errorHandler(error);
  }
};

executeTradingStrategy();

schedule.scheduleJob("* * * * *", () => {
  executeTradingStrategy();
});
