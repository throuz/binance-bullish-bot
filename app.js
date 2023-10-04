import schedule from "node-schedule";
import { LEVERAGE } from "./configs/trade-config.js";
import { errorHandler, logWithTime } from "./src/common.js";
import {
  getTPSL,
  formatBySize,
  getAllowNewOrders,
  getOrderQuantity,
  getSizes,
  getTopGainerSymbol,
  getPositionInformation,
  getIsPriceInSafeZone,
  getAvailableBalance
} from "./src/helpers.js";
import { changeInitialLeverage, placeMultipleOrders } from "./src/trade.js";
import { nodeCache } from "./src/cache.js";

const topGainerSymbol = await getTopGainerSymbol();
nodeCache.set("symbol", topGainerSymbol, 120);

const availableBalance = await getAvailableBalance();
nodeCache.set("balance", availableBalance, 120);

const executePlaceOrders = async () => {
  logWithTime(`current symbol: ${nodeCache.get("symbol")}`);
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
};

const executeTradingStrategy = async () => {
  try {
    const allowNewOrders = await getAllowNewOrders();
    logWithTime(`allowNewOrders: ${allowNewOrders}`);
    if (allowNewOrders) {
      const availableBalance = await getAvailableBalance();
      const needChangeSymbol = availableBalance < nodeCache.get("balance");
      logWithTime(`needChangeSymbol: ${needChangeSymbol}`);
      if (needChangeSymbol) {
        const symbol = nodeCache.get("symbol");
        const topGainerSymbol = await getTopGainerSymbol(symbol);
        nodeCache.set("symbol", topGainerSymbol, 0);
      }
      nodeCache.set("balance", availableBalance, 0);
      await executePlaceOrders();
    }
  } catch (error) {
    await errorHandler(error);
  }
};

executeTradingStrategy();

schedule.scheduleJob("* * * * *", () => {
  executeTradingStrategy();
});
