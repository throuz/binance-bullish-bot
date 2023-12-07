import schedule from "node-schedule";
import { errorHandler, logWithTime, sendLineNotify } from "./src/common.js";
import {
  getRandomSymbol,
  getAvailableBalance,
  getHasPositions,
  getCurrentPositionSymbol
} from "./src/helpers.js";
import { openPosition, closePosition } from "./src/trade.js";
import { nodeCache } from "./src/cache.js";
import {
  getIsOpenConditionsMet,
  getIsCloseConditionsMet
} from "./src/conditions.js";

const hasPositions = await getHasPositions();
if (hasPositions) {
  const currentPositionSymbol = await getCurrentPositionSymbol();
  nodeCache.set("symbol", currentPositionSymbol, 0);
}

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
      const isOpenConditionsMet = await getIsOpenConditionsMet();
      logWithTime(`isOpenConditionsMet: ${isOpenConditionsMet}`);
      if (isOpenConditionsMet) {
        await openPosition();
      }
    }
    if (hasPositions) {
      const isCloseConditionsMet = await getIsCloseConditionsMet();
      logWithTime(`isCloseConditionsMet: ${isCloseConditionsMet}`);
      if (isCloseConditionsMet) {
        await closePosition();
        await logBalance();
        if (isCloseConditionsMet === "isTakeProfitReached") {
          await openPosition();
        }
      }
    }
  } catch (error) {
    await errorHandler(error);
  }
};

executeTradingStrategy();

schedule.scheduleJob("* * * * *", executeTradingStrategy);
