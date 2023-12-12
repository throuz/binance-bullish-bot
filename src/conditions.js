import {
  MINIMUM_LEVERAGE,
  STOP_LOSS_PERCENT,
  TAKE_PROFIT_PERCENT,
  SHORT_PERIOD,
  LONG_PERIOD
} from "../configs/trade-config.js";
import { tickerPriceChangeStatisticsAPI } from "./api.js";
import {
  getMaxLeverage,
  getPNLPercent,
  getAveragePrice,
  getMarkPrice
} from "./helpers.js";

// Open conditions

export const getIsMaxLeverageEnough = async () => {
  const maxLeverage = await getMaxLeverage();
  return maxLeverage >= MINIMUM_LEVERAGE;
};

export const getIsOverAllPriceUpTrend = async () => {
  const tickerPriceChangeStatistics = await tickerPriceChangeStatisticsAPI();
  const priceUpStatistics = tickerPriceChangeStatistics.filter(
    (item) => item.priceChangePercent > 0
  );
  return priceUpStatistics.length / tickerPriceChangeStatistics.length > 0.5;
};

export const getIsOverAveragePrices = async () => {
  const markPrice = await getMarkPrice();
  const shortAveragePrice = await getAveragePrice(SHORT_PERIOD);
  const longAveragePrice = await getAveragePrice(LONG_PERIOD);
  return markPrice > shortAveragePrice && markPrice > longAveragePrice;
};

export const getIsOpenConditionsMet = async () => {
  const results = await Promise.all([
    getIsMaxLeverageEnough(),
    getIsOverAllPriceUpTrend(),
    getIsOverAveragePrices()
  ]);
  return results.every((result) => result);
};

// Close conditions

export const getIsTakeProfitReached = async () => {
  const PNLPercent = await getPNLPercent();
  return PNLPercent > TAKE_PROFIT_PERCENT;
};

export const getIsStopLossReached = async () => {
  const PNLPercent = await getPNLPercent();
  return PNLPercent < STOP_LOSS_PERCENT;
};

export const getIsCloseConditionsMet = async () => {
  const results = await Promise.all([
    getIsTakeProfitReached(),
    getIsStopLossReached()
  ]);
  return results.some((result) => result);
};
