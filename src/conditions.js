import { MINIMUM_LEVERAGE } from "../configs/trade-config.js";
import { getMaxLeverage, getHeikinAshiKLineData } from "./helpers.js";
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
    getIsJustConvertToUpTrend()
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

export const getIsCloseConditionsMet = async () => {
  const results = await Promise.all([getIsJustConvertToDownTrend()]);
  return results.some((result) => result);
};
