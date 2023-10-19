import {
  LEVERAGE,
  MIN_VOLATILITY_PERCENT,
  TRADING_RATIOS_PERIOD
} from "../configs/trade-config.js";
import {
  notionalAndLeverageBracketsAPI,
  topLongShortAccountRatioAPI,
  topLongShortPositionRatioAPI,
  globalLongShortAccountRatioAPI
} from "./api.js";
import { nodeCache } from "./cache.js";
import {
  getTrendExtrema,
  getMarkPrice,
  getMarkPriceKlineData
} from "./helpers.js";

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
  for (const result of results) {
    if (result[0].longShortRatio < 1) {
      return false;
    }
  }
  return true;
};

export const getIsUptrend = async () => {
  const { highestPriceIndex, lowestPriceIndex } = await getTrendExtrema();
  return highestPriceIndex > lowestPriceIndex;
};

export const getIsPriceInSafeZone = async () => {
  const [markPrice, markPriceKlineData] = await Promise.all([
    getMarkPrice(),
    getMarkPriceKlineData()
  ]);
  const closePriceArray = markPriceKlineData.map((kline) => Number(kline[4]));
  const safePrice = closePriceArray.reduce((a, b) => a + b, 0) / arr.length;
  const isPriceInSafeZone = markPrice > safePrice;
  return isPriceInSafeZone;
};

export const getIsPriceVolatilityEnough = async () => {
  const { highestPrice, lowestPrice } = await getTrendExtrema();
  const volatility = ((highestPrice - lowestPrice) / lowestPrice) * 100;
  return volatility > MIN_VOLATILITY_PERCENT;
};

export const getIsAllConditionsMet = async () => {
  const isLeverageAvailable = await getIsLeverageAvailable();
  if (!isLeverageAvailable) {
    return false;
  }
  const isAllTradingRatiosBullish = await getIsAllTradingRatiosBullish();
  if (!isAllTradingRatiosBullish) {
    return false;
  }
  const isUptrend = await getIsUptrend();
  if (!isUptrend) {
    return false;
  }
  const isPriceInSafeZone = await getIsPriceInSafeZone();
  if (!isPriceInSafeZone) {
    return false;
  }
  const isPriceVolatilityEnough = await getIsPriceVolatilityEnough();
  if (!isPriceVolatilityEnough) {
    return false;
  }
  return true;
};
