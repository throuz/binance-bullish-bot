import {
  MINIMUM_LEVERAGE,
  TAKE_PROFIT_PERCENT,
  STOP_LOSS_PERCENT
} from "../configs/trade-config.js";
import {
  getMaxLeverage,
  getHeikinAshiKLineData,
  getPNLPercent
} from "./helpers.js";
import { getStorageData } from "../storage/storage.js";

export const getTrendArray = async () => {
  const heikinAshiKLineData = await getHeikinAshiKLineData();
  const { open, close } = heikinAshiKLineData;
  const trendArray = open.map((price, index) =>
    price < close[index] ? "up" : "down"
  );
  return trendArray;
};

// Open conditions

export const getIsMaxLeverageEnough = async () => {
  const maxLeverage = await getMaxLeverage();
  return maxLeverage >= MINIMUM_LEVERAGE;
};

export const getIsJustStartTrend = async () => {
  const trendArray = await getTrendArray();
  const openSide = await getStorageData("openSide");
  if (openSide === "BUY") {
    return (
      trendArray[trendArray.length - 3] === "down" &&
      trendArray[trendArray.length - 2] === "up"
    );
  }
  if (openSide === "SELL") {
    return (
      trendArray[trendArray.length - 3] === "up" &&
      trendArray[trendArray.length - 2] === "down"
    );
  }
  return false;
};

export const getIsOpenConditionsMet = async () => {
  const results = await Promise.all([
    getIsMaxLeverageEnough(),
    getIsJustStartTrend()
  ]);
  return results.every((result) => result);
};

// Close conditions

export const getIsJustEndTrend = async () => {
  const trendArray = await getTrendArray();
  const openSide = await getStorageData("openSide");
  if (openSide === "BUY") {
    return trendArray[trendArray.length - 2] === "down";
  }
  if (openSide === "SELL") {
    return trendArray[trendArray.length - 2] === "up";
  }
  return false;
};

export const getIsTakeProfit = async () => {
  const isJustEndTrend = await getIsJustEndTrend();
  const PNLPercent = await getPNLPercent();
  return isJustEndTrend && PNLPercent > TAKE_PROFIT_PERCENT;
};

export const getIsStopLoss = async () => {
  const PNLPercent = await getPNLPercent();
  return PNLPercent < STOP_LOSS_PERCENT;
};

export const getIsCloseConditionsMet = async () => {
  const results = await Promise.all([getIsTakeProfit(), getIsStopLoss()]);
  return results.some((result) => result);
};
