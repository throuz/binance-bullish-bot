import schedule from "node-schedule";
import { errorHandler, logWithTime, sendLineNotify } from "./src/common.js";
import {
  getRandomSymbol,
  getAvailableBalance,
  getHasPositions
} from "./src/helpers.js";
import { openPosition, closePosition } from "./src/trade.js";
import { nodeCache } from "./src/cache.js";
import { getIsAllConditionsMet } from "./src/conditions.js";

const setRandomSymbol = async () => {
  const randomSymbol = await getRandomSymbol();
  nodeCache.set("symbol", randomSymbol, 0);
  logWithTime(`randomSymbol: ${randomSymbol}`);
};

const logBalance = async () => {
  const availableBalance = await getAvailableBalance();
  await sendLineNotify(`Balance: ${availableBalance}`);
};

const executeTradingStrategy = async () => {
  try {
    const hasPositions = await getHasPositions();
    logWithTime(`hasPositions: ${hasPositions}`);
    if (!hasPositions) {
      await setRandomSymbol();
      const isAllConditionsMet = await getIsAllConditionsMet();
      logWithTime(`isAllConditionsMet: ${isAllConditionsMet}`);
      if (isAllConditionsMet) {
        await logBalance();
        await openPosition();
      }
    } else {
      const isAllConditionsMet = await getIsAllConditionsMet();
      logWithTime(`isAllConditionsMet: ${isAllConditionsMet}`);
      if (!isAllConditionsMet) {
        await closePosition();
      }
    }
  } catch (error) {
    await errorHandler(error);
  }
};

executeTradingStrategy();

schedule.scheduleJob("* * * * *", executeTradingStrategy);
