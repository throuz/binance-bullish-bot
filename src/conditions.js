import { MINIMUM_LEVERAGE } from "../configs/trade-config.js";
import { getMaxLeverage, getHeikinAshiKLineData } from "./helpers.js";

// Open conditions

export const getIsMaxLeverageEnough = async () => {
  const maxLeverage = await getMaxLeverage();
  return maxLeverage >= MINIMUM_LEVERAGE;
};

export const getIsUpTrend = async () => {
  const heikinAshiKLineData = await getHeikinAshiKLineData();
  const { open, close } = heikinAshiKLineData;
  const lastSecondOpenPrice = open[open.length - 2];
  const lastSecondClosePrice = close[close.length - 2];
  return lastSecondClosePrice > lastSecondOpenPrice;
};

export const getIsOpenConditionsMet = async () => {
  const results = await Promise.all([getIsMaxLeverageEnough(), getIsUpTrend()]);
  return results.every((result) => result);
};

// Close conditions

export const getIsDownTrend = async () => {
  const heikinAshiKLineData = await getHeikinAshiKLineData();
  const { open, close } = heikinAshiKLineData;
  const lastSecondOpenPrice = open[open.length - 2];
  const lastSecondClosePrice = close[close.length - 2];
  return lastSecondClosePrice < lastSecondOpenPrice;
};

export const getIsCloseConditionsMet = async () => {
  const results = await Promise.all([getIsDownTrend()]);
  return results.some((result) => result);
};
