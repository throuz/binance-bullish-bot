import { LEVERAGE, TRADING_RATIOS_PERIOD } from "../configs/trade-config.js";
import {
  notionalAndLeverageBracketsAPI,
  topLongShortAccountRatioAPI,
  topLongShortPositionRatioAPI,
  globalLongShortAccountRatioAPI
} from "./api.js";
import { nodeCache } from "./cache.js";
import { hexagrams, getRandomSixyao } from "./yi-jing.js";

// Open conditions

export const getIsLeverageAvailable = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol, timestamp: Date.now() };
  const notionalAndLeverageBrackets = await notionalAndLeverageBracketsAPI(
    totalParams
  );
  return notionalAndLeverageBrackets[0].brackets[0].initialLeverage >= LEVERAGE;
};

export const getIsAllTradingRatiosBullish = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol, period: TRADING_RATIOS_PERIOD, limit: 1 };
  const results = await Promise.all([
    topLongShortAccountRatioAPI(totalParams),
    topLongShortPositionRatioAPI(totalParams),
    globalLongShortAccountRatioAPI(totalParams)
  ]);
  return results.every((result) => result[0].longShortRatio > 1);
};

export const getIsHexagramIndicateInvestmentPossible = () => {
  const randomSixyao = getRandomSixyao();
  const foundHexagram = hexagrams.find(
    (hexagram) => hexagram.sixyao === randomSixyao
  );
  return foundHexagram.result;
};

export const getIsOpenConditionsMet = async () => {
  const results = await Promise.all([
    getIsLeverageAvailable(),
    getIsAllTradingRatiosBullish(),
    getIsHexagramIndicateInvestmentPossible
  ]);
  return results.every((result) => result);
};

// Close conditions

export const getIsNotAllTradingRatiosBullish = async () => {
  const isAllTradingRatiosBullish = await getIsAllTradingRatiosBullish();
  return !isAllTradingRatiosBullish;
};

export const getIsCloseConditionsMet = async () => {
  const isNotAllTradingRatiosBullish = await getIsNotAllTradingRatiosBullish();
  return isNotAllTradingRatiosBullish;
};
