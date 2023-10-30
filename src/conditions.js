import { LEVERAGE, TRADING_RATIOS_PERIOD } from "../configs/trade-config.js";
import {
  notionalAndLeverageBracketsAPI,
  tickerPrice24hrChangeStatisticsAPI,
  topLongShortAccountRatioAPI,
  topLongShortPositionRatioAPI,
  globalLongShortAccountRatioAPI
} from "./api.js";
import { nodeCache } from "./cache.js";

export const getIsLeverageAvailable = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol, timestamp: Date.now() };
  const notionalAndLeverageBrackets = await notionalAndLeverageBracketsAPI(
    totalParams
  );
  return notionalAndLeverageBrackets[0].brackets[0].initialLeverage >= LEVERAGE;
};

export const getIsPriceAboveWeightedAvgPrice = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol };
  const statistics = await tickerPrice24hrChangeStatisticsAPI(totalParams);
  const { lastPrice, weightedAvgPrice } = statistics;
  return lastPrice > weightedAvgPrice;
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

export const getIsOpenConditionsMet = async () => {
  const results = await Promise.all([
    getIsLeverageAvailable(),
    getIsPriceAboveWeightedAvgPrice(),
    getIsAllTradingRatiosBullish()
  ]);
  return results.every((result) => result);
};

export const getIsCloseConditionsMet = async () => {
  const results = await Promise.all([
    getIsPriceAboveWeightedAvgPrice(),
    getIsAllTradingRatiosBullish()
  ]);
  return results.some((result) => result === false);
};