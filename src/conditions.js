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
  console.log(trendArray[trendArray.length - 3]);
  console.log(trendArray[trendArray.length - 2]);
  return (
    trendArray[trendArray.length - 3] === "down" &&
    trendArray[trendArray.length - 2] === "up"
  );
};

export const getIsOpenConditionsMet = async () => {
  const results = await Promise.all([
    getIsMaxLeverageEnough(),
    getIsJustConvertToUpTrend()
  ]);
  return results.every((result) => result);
};

// Close conditions

export const getIsDownTrend = async () => {
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
  const results = await Promise.all([getIsDownTrend()]);
  return results.some((result) => result);
};
