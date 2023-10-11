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
  getAllowPlaceOrders
} from "./src/helpers.js";
import { changeInitialLeverage, placeMultipleOrders } from "./src/trade.js";
import { nodeCache } from "./src/cache.js";

const setRandomSymbol = async () => {
  const randomSymbol = await getRandomSymbol();
  nodeCache.set("symbol", randomSymbol, 0);
  logWithTime(`randomSymbol: ${randomSymbol}`);
};

await setRandomSymbol();

const executePlaceOrders = async () => {
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
      const allowPlaceOrders = await getAllowPlaceOrders();
      logWithTime(`allowPlaceOrders: ${allowPlaceOrders}`);
      if (allowPlaceOrders) {
        const availableBalance = await getAvailableBalance();
        await sendLineNotify(`Balance: ${availableBalance}`);
        await executePlaceOrders();
      } else {
        await setRandomSymbol();
      }
    }
  } catch (error) {
    await errorHandler(error);
  }
};

executeTradingStrategy();

schedule.scheduleJob("* * * * *", executeTradingStrategy);
