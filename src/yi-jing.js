import { getMarkPriceKlineData } from "./helpers.js";
import { getCombinedPriceData, getIsWinRateEnough } from "./signals.js";

export const getAllYao = async () => {
  const markPriceKlineData = await getMarkPriceKlineData();
  const allYao = markPriceKlineData
    .map((kline) => (kline[4] > kline[1] ? "1" : "0"))
    .join("");
  return allYao;
};

export const getSixYaoArray = async () => {
  const sixYaoArray = [];
  const allYao = await getAllYao();
  for (let i = 0; i < allYao.length - 5; i++) {
    const substring = allYao.substring(i, i + 6);
    sixYaoArray.push(substring);
  }
  return sixYaoArray;
};

export const getIsInvestable = async () => {
  const sixYaoArray = await getSixYaoArray();
  const combinedPriceData = await getCombinedPriceData(sixYaoArray);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      return { price, nextPrice, type: result };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return isWinRateEnough;
};
