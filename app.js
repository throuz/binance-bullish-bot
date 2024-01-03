import schedule from "node-schedule";
import { errorHandler, logWithTime, sendLineNotify } from "./src/common.js";
import {
  getRandomSymbol,
  getAvailableBalance,
  getHasPositions
} from "./src/helpers.js";
import { openPosition, closePosition } from "./src/trade.js";
import {
  getIsOpenConditionsMet,
  getIsCloseConditionsMet
} from "./src/conditions.js";
import { getStorageData, setStorageData } from "./storage/storage.js";

const setRandomSymbol = async () => {
  const randomSymbol = await getRandomSymbol();
  await setStorageData("symbol", randomSymbol);
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
      const lastResult = await getStorageData("lastResult");
      if (lastResult === "LOSS") {
        await setRandomSymbol();
      }
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
      }
    }
  } catch (error) {
    await errorHandler(error);
  }
};

executeTradingStrategy();

schedule.scheduleJob("* * * * *", executeTradingStrategy);
