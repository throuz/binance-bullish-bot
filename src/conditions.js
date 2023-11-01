import { LEVERAGE, TRADING_RATIOS_PERIOD } from "../configs/trade-config.js";
import {
  notionalAndLeverageBracketsAPI,
  topLongShortAccountRatioAPI,
  topLongShortPositionRatioAPI,
  globalLongShortAccountRatioAPI
} from "./api.js";
import { nodeCache } from "./cache.js";
import { hexagrams, getRandomSixyao } from "./yi-jing.js";
import {
  getMarkPrice,
  getTrendAveragePrice,
  getPositionInformation,
  getTickerPrice24hrChangeStatistics
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

export const getIsPriceAboveWeightedAvgPrice = async () => {
  const statistics = await getTickerPrice24hrChangeStatistics();
  const { lastPrice, weightedAvgPrice } = statistics;
  return lastPrice > weightedAvgPrice;
};

export const getIsPrice24hrChangeBullish = async () => {
  const statistics = await getTickerPrice24hrChangeStatistics();
  return statistics.priceChangePercent > 0;
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
    getIsPriceInSafeZone(),
    getIsPriceAboveWeightedAvgPrice(),
    getIsPrice24hrChangeBullish(),
    getIsHexagramIndicateInvestmentPossible
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

export const getIsUnRealizedProfitNegative = async () => {
  const isUnRealizedProfitPositive = await getIsUnRealizedProfitPositive();
  return !isUnRealizedProfitPositive;
};

export const getIsPriceNotInSafeZone = async () => {
  const isPriceInSafeZone = await getIsPriceInSafeZone();
  return !isPriceInSafeZone;
};

export const getIsPriceBelowWeightedAvgPrice = async () => {
  const isPriceAboveWeightedAvgPrice = await getIsPriceAboveWeightedAvgPrice();
  return !isPriceAboveWeightedAvgPrice;
};

export const getIsTakeProfit = async () => {
  const results = await Promise.all([
    getIsUnRealizedProfitPositive(),
    getIsPriceNotInSafeZone()
  ]);
  return results.every((result) => result);
};

export const getIsStopLoss = async () => {
  const results = await Promise.all([
    getIsUnRealizedProfitNegative(),
    getIsPriceBelowWeightedAvgPrice()
  ]);
  return results.every((result) => result);
};

export const getIsCloseConditionsMet = async () => {
  const results = await Promise.all([
    getIsNotAllTradingRatiosBullish(),
    getIsTakeProfit(),
    getIsStopLoss()
  ]);
  return results.some((result) => result);
};
