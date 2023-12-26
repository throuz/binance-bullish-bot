import { MINIMUM_LEVERAGE } from "../configs/trade-config.js";
import {
  getMaxLeverage,
  getHeikinAshiKLineData,
  getSMAData
} from "./helpers.js";

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

export const getIsOverSMA = async () => {
  const smaData = await getSMAData();
  const lastSMA = smaData[smaData.length - 1];
  const heikinAshiKLineData = await getHeikinAshiKLineData();
  const { close } = heikinAshiKLineData;
  const lastPrice = close[close.length - 1];
  console.log(lastSMA);
  console.log(lastPrice);
  return lastPrice > lastSMA;
};

export const getIsOpenConditionsMet = async () => {
  const results = await Promise.all([
    getIsMaxLeverageEnough(),
    getIsJustConvertToUpTrend(),
    getIsOverSMA()
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
