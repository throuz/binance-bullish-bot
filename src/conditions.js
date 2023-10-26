import { LEVERAGE, TRADING_RATIOS_PERIOD } from "../configs/trade-config.js";
import {
  notionalAndLeverageBracketsAPI,
  tickerPrice24hrChangeStatisticsAPI,
  topLongShortAccountRatioAPI,
  topLongShortPositionRatioAPI,
  globalLongShortAccountRatioAPI
} from "./api.js";
import { nodeCache } from "./cache.js";
import {
  getMarkPrice,
  getTrendAveragePrice,
  getPositionInformation
} from "./helpers.js";

// Open conditions

export const getIsLeverageAvailable = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol, timestamp: Date.now() };
  const notionalAndLeverageBrackets = await notionalAndLeverageBracketsAPI(
    totalParams
  );
  return notionalAndLeverageBrackets[0].brackets[0].initialLeverage >= LEVERAGE;
};

export const getIsPrice24hrChangeBullish = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol };
  const tickerPrice24hrChangeStatistics =
    await tickerPrice24hrChangeStatisticsAPI(totalParams);
  return tickerPrice24hrChangeStatistics.priceChangePercent > 0;
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

export const getIsPriceInSafeZone = async () => {
  const [markPrice, trendAveragePrice] = await Promise.all([
    getMarkPrice(),
    getTrendAveragePrice()
  ]);
  const isPriceInSafeZone = markPrice > trendAveragePrice;
  return isPriceInSafeZone;
};

export const getIsOpenConditionsMet = async () => {
  const results = await Promise.all([
    getIsLeverageAvailable(),
    getIsPrice24hrChangeBullish(),
    getIsAllTradingRatiosBullish(),
    getIsPriceInSafeZone()
  ]);
  return results.every((result) => result);
};

// Close conditions

export const getIsNotAllTradingRatiosBullish = async () => {
  const isAllTradingRatiosBullish = await getIsAllTradingRatiosBullish();
  return !isAllTradingRatiosBullish;
};

export const getIsUnRealizedProfitPositive = async () => {
  const positionInformation = await getPositionInformation();
  return positionInformation.unRealizedProfit > 0;
};

export const getIsPriceNotInSafeZone = async () => {
  const isPriceInSafeZone = await getIsPriceInSafeZone();
  return !isPriceInSafeZone;
};

export const getIsTakeProfit = async () => {
  const results = await Promise.all([
    getIsUnRealizedProfitPositive(),
    getIsPriceNotInSafeZone()
  ]);
  return results.every((result) => result);
};

export const getIsCloseConditionsMet = async () => {
  const results = await Promise.all([
    getIsNotAllTradingRatiosBullish(),
    getIsTakeProfit()
  ]);
  return results.some((result) => result);
};
