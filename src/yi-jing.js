import { MIN_WIN_RATE } from "../configs/trade-config.js";
import { getMarkPriceKlineData } from "./helpers.js";

export const getAllYao = async () => {
  const markPriceKlineData = await getMarkPriceKlineData();
  const allYao = markPriceKlineData
    .map((kline) => (kline[4] > kline[1] ? "1" : "0"))
    .join("");
  return allYao;
};

export const getLastSixYao = async () => {
  const allYao = await getAllYao();
  const lastSixYao = allYao.slice(-6);
  return lastSixYao;
};

export const getSevenYaoArray = async () => {
  const sevenYaoArray = [];
  const allYao = await getAllYao();
  for (let i = 0; i < allYao.length - 6; i++) {
    const substring = allYao.substring(i, i + 7);
    sevenYaoArray.push(substring);
  }
  return sevenYaoArray;
};

export const getMatchedSevenYaoArray = async () => {
  const sevenYaoArray = await getSevenYaoArray();
  const lastSixYao = await getLastSixYao();
  const regex = new RegExp(`^${lastSixYao}`);
  const matchedSevenYaoArray = sevenYaoArray.filter((sevenYao) =>
    regex.test(sevenYao)
  );
  return matchedSevenYaoArray;
};

export const getIsInvestable = async () => {
  const matchedSevenYaoArray = await getMatchedSevenYaoArray();
  const totalTimes = matchedSevenYaoArray.length;
  const lastSixYao = await getLastSixYao();
  const winYaos = lastSixYao + "1";
  const winTimes = matchedSevenYaoArray.reduce((acc, current) => {
    return current === winYaos ? acc + 1 : acc;
  }, 0);
  return winTimes / totalTimes > MIN_WIN_RATE;
};
