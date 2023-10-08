import schedule from "node-schedule";
import { LEVERAGE } from "./configs/trade-config.js";
import { errorHandler, logWithTime, sendLineNotify } from "./src/common.js";
import {
  getTPSL,
  formatBySize,
  getAllowNewOrders,
  getOrderQuantity,
  getSizes,
  getPositionInformation,
  getRandomSymbol,
  getAvailableBalance,
  getAllowPlaceOrders,
  getNeedChangeSymbol
} from "./src/helpers.js";
import {
  changeInitialLeverage,
  placeMultipleOrders,
  cancelAllOpenOrders
} from "./src/trade.js";
import { nodeCache } from "./src/cache.js";

nodeCache.set("initialized", false, 0);

const executePlaceOrders = async () => {
  await cancelAllOpenOrders();
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
};

const executeTradingStrategy = async () => {
  try {
    const allowNewOrders = await getAllowNewOrders();
    logWithTime(`allowNewOrders: ${allowNewOrders}`);
    if (allowNewOrders) {
      const needChangeSymbol = await getNeedChangeSymbol();
      logWithTime(`needChangeSymbol: ${needChangeSymbol}`);
      if (!nodeCache.get("initialized") || needChangeSymbol) {
        const randomSymbol = await getRandomSymbol();
        nodeCache.set("symbol", randomSymbol, 0);
        logWithTime(`randomSymbol: ${randomSymbol}`);
      }
      const allowPlaceOrders = await getAllowPlaceOrders();
      logWithTime(`allowPlaceOrders: ${allowPlaceOrders}`);
      if (allowPlaceOrders) {
        const availableBalance = await getAvailableBalance();
        await sendLineNotify(`Balance: ${availableBalance}`);
        await executePlaceOrders();
        if (!nodeCache.get("initialized")) {
          nodeCache.set("initialized", true, 0);
        }
      }
    }
  } catch (error) {
    await errorHandler(error);
  }
};

executeTradingStrategy();

schedule.scheduleJob("* * * * *", executeTradingStrategy);
