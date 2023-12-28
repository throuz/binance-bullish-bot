import { MINIMUM_LEVERAGE } from "../configs/trade-config.js";
import { getMaxLeverage, getHeikinAshiKLineData } from "./helpers.js";

// Open conditions

export const getIsMaxLeverageEnough = async () => {
  const maxLeverage = await getMaxLeverage();
  return maxLeverage >= MINIMUM_LEVERAGE;
};

export const getIsJustConvertToUpTrend = async () => {
  const heikinAshiKLineData = await getHeikinAshiKLineData();
  const { open, close } = heikinAshiKLineData;
  const trendArray = open.map((price, index) => {
    if (price < close[index]) {
      return "up";
    }
    return "down";
  });
  return (
    trendArray[trendArray.length - 3] === "down" &&
    trendArray[trendArray.length - 2] === "up"
  );
};

export const getIsUpTrend = async () => {
  const heikinAshiKLineData = await getHeikinAshiKLineData("1h");
  const { open, close } = heikinAshiKLineData;
  return open[open.length - 1] < close[close.length - 1];
};

export const getIsOpenConditionsMet = async () => {
  const results = await Promise.all([
    getIsMaxLeverageEnough(),
    getIsJustConvertToUpTrend(),
    getIsUpTrend()
  ]);
  return results.every((result) => result);
};

// Close conditions

export const getIsJustConvertToDownTrend = async () => {
  const heikinAshiKLineData = await getHeikinAshiKLineData();
  const { open, close } = heikinAshiKLineData;
  const trendArray = open.map((price, index) => {
    if (price < close[index]) {
      return "up";
    }
    return "down";
  });
  return trendArray[trendArray.length - 2] === "down";
};

export const getIsCloseConditionsMet = async () => {
  const results = await Promise.all([getIsJustConvertToDownTrend()]);
  return results.some((result) => result);
};
