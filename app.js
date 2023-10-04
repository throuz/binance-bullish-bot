import schedule from "node-schedule";
import { errorHandler, logWithTime } from "./src/common.js";
import {
  getTPSL,
  formatBySize,
  getAllowNewOrders,
  getOrderQuantity,
  getSizes,
  getTopGainerSymbol,
  getPositionInformation,
  getIsPriceInSafeZone
} from "./src/helpers.js";
import { changeInitialLeverage, placeMultipleOrders } from "./src/trade.js";
import { asyncLocalStorage } from "./src/storage.js";
import { LEVERAGE } from "./configs/trade-config.js";

const executePlaceOrders = async () => {
  try {
    const isPriceInSafeZone = await getIsPriceInSafeZone();
    logWithTime(`isPriceInSafeZone: ${isPriceInSafeZone}`);
    if (isPriceInSafeZone) {
      const positionInformation = await getPositionInformation();
      if (Number(positionInformation.leverage) !== LEVERAGE) {
        await changeInitialLeverage();
      }
      const [orderQuantity, TPSL, sizes] = await Promise.all([
        getOrderQuantity(),
        getTPSL(),
        getSizes()
      ]);
      const { takeProfitPrice, stopLossPrice } = TPSL;
      const { tickSize, stepSize } = sizes;
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
      logWithTime(`topGainerSymbol: ${topGainerSymbol}`);
      asyncLocalStorage.run({ symbol: topGainerSymbol }, executePlaceOrders);
    }
  } catch (error) {
    await errorHandler(error);
  }
};

executeTradingStrategy();

schedule.scheduleJob("* * * * *", () => {
  executeTradingStrategy();
});
