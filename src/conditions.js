import { MINIMUM_LEVERAGE } from "../configs/trade-config.js";
import { getMaxLeverage, getHeikinAshiKLineData } from "./helpers.js";

// Open conditions

export const getIsMaxLeverageEnough = async () => {
  const maxLeverage = await getMaxLeverage();
  return maxLeverage >= MINIMUM_LEVERAGE;
};

export const getIsKLineUpTrend = async () => {
  const heikinAshiKLineData = await getHeikinAshiKLineData();
  const { open, close } = heikinAshiKLineData;
  const lastOpenPrice = open[open.length - 1];
  const lastClosePrice = close[close.length - 1];
  return lastClosePrice > lastOpenPrice;
};

export const getIsOpenConditionsMet = async () => {
  const results = await Promise.all([
    getIsMaxLeverageEnough(),
    getIsKLineUpTrend()
  ]);
  return results.every((result) => result);
};

// Close conditions

export const getIsKLineDownTrend = async () => {
  const heikinAshiKLineData = await getHeikinAshiKLineData();
  const { open, close } = heikinAshiKLineData;
  const lastOpenPrice = open[open.length - 1];
  const lastClosePrice = close[close.length - 1];
  return lastClosePrice < lastOpenPrice;
};

export const getIsCloseConditionsMet = async () => {
  const results = await Promise.all([getIsKLineDownTrend()]);
  return results.some((result) => result);
};
