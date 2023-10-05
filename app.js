import schedule from "node-schedule";
import { LEVERAGE } from "./configs/trade-config.js";
import { errorHandler, logWithTime } from "./src/common.js";
import {
  getTPSL,
  formatBySize,
  getAllowNewOrders,
  getOrderQuantity,
  getSizes,
  getPositionInformation,
  getIsPriceInSafeZone,
  getRandomSymbol,
  getIsPriceVolatilityEnough,
  getIsLeverageAvailable
} from "./src/helpers.js";
import { changeInitialLeverage, placeMultipleOrders } from "./src/trade.js";
import { nodeCache } from "./src/cache.js";

const executePlaceOrders = async () => {
  const isPriceVolatilityEnough = await getIsPriceVolatilityEnough();
  logWithTime(`isPriceVolatilityEnough: ${isPriceVolatilityEnough}`);
  if (isPriceVolatilityEnough) {
    const isPriceInSafeZone = await getIsPriceInSafeZone();
    logWithTime(`isPriceInSafeZone: ${isPriceInSafeZone}`);
    if (isPriceInSafeZone) {
      const isLeverageAvailable = await getIsLeverageAvailable();
      logWithTime(`isLeverageAvailable: ${isLeverageAvailable}`);
      if (isLeverageAvailable) {
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
    }
  }
};

const executeTradingStrategy = async () => {
  try {
    const allowNewOrders = await getAllowNewOrders();
    logWithTime(`allowNewOrders: ${allowNewOrders}`);
    if (allowNewOrders) {
      const randomSymbol = await getRandomSymbol();
      nodeCache.set("symbol", randomSymbol, 0);
      logWithTime(`randomSymbol: ${randomSymbol}`);
      await executePlaceOrders();
    }
  } catch (error) {
    await errorHandler(error);
  }
};

executeTradingStrategy();

schedule.scheduleJob("* * * * *", executeTradingStrategy);
