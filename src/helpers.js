import {
  ORDER_AMOUNT_PERCENT,
  QUOTE_ASSET,
  KLINE_INTERVAL
} from "../configs/trade-config.js";
import {
  exchangeInformationAPI,
  futuresAccountBalanceAPI,
  markPriceAPI,
  notionalAndLeverageBracketsAPI,
  positionInformationAPI,
  markPriceKlineDataAPI
} from "./api.js";
import { heikinashi } from "technicalindicators";
import { getStorageData } from "../storage/storage.js";

export const getMaxLeverage = async () => {
  const symbol = await getStorageData("symbol");
  const totalParams = { symbol, timestamp: Date.now() };
  const notionalAndLeverageBrackets = await notionalAndLeverageBracketsAPI(
    totalParams
  );
  return notionalAndLeverageBrackets[0].brackets[0].initialLeverage;
};

export const getStepSize = async () => {
  const exchangeInformation = await exchangeInformationAPI();
  const symbol = await getStorageData("symbol");
  const symbolData = exchangeInformation.symbols.find(
    (item) => item.symbol === symbol
  );
  const stepSize = symbolData.filters.find(
    (filter) => filter.filterType === "LOT_SIZE"
  ).stepSize;
  return stepSize;
};

export const getAvailableBalance = async () => {
  const totalParams = { timestamp: Date.now() };
  const futuresAccountBalance = await futuresAccountBalanceAPI(totalParams);
  const availableBalance = futuresAccountBalance.find(
    ({ asset }) => asset === QUOTE_ASSET
  ).availableBalance;
  return availableBalance;
};

export const getMarkPrice = async () => {
  const symbol = await getStorageData("symbol");
  const totalParams = { symbol };
  const markPrice = await markPriceAPI(totalParams);
  return markPrice.markPrice;
};

export const getAvailableQuantity = async () => {
  const [availableBalance, maxLeverage, markPrice] = await Promise.all([
    getAvailableBalance(),
    getMaxLeverage(),
    getMarkPrice()
  ]);
  const availableFunds = availableBalance * maxLeverage;
  return availableFunds / markPrice;
};

export const getPositionInformation = async () => {
  const symbol = await getStorageData("symbol");
  const totalParams = { symbol, timestamp: Date.now() };
  const positionInformation = await positionInformationAPI(totalParams);
  return positionInformation[0];
};

export const getPNLPercent = async () => {
  const positionInformation = await getPositionInformation();
  const { unRealizedProfit, notional, leverage } = positionInformation;
  return (unRealizedProfit / (Math.abs(notional) / leverage)) * 100;
};

export const getAllowableQuantity = async () => {
  const [positionInformation, markPrice] = await Promise.all([
    getPositionInformation(),
    getMarkPrice()
  ]);
  const { maxNotionalValue, positionAmt } = positionInformation;
  const maxAllowableQuantity = maxNotionalValue / markPrice;
  return maxAllowableQuantity - Math.abs(positionAmt);
};

export const getInvestableQuantity = async () => {
  const [availableQuantity, allowableQuantity] = await Promise.all([
    getAvailableQuantity(),
    getAllowableQuantity()
  ]);
  return Math.min(availableQuantity, allowableQuantity);
};

export const getAllPositionInformation = async () => {
  const totalParams = { timestamp: Date.now() };
  const positionInformation = await positionInformationAPI(totalParams);
  return positionInformation;
};

export const getHasPositions = async () => {
  const allPositionInformation = await getAllPositionInformation();
  return allPositionInformation.some((info) => Math.abs(info.positionAmt) > 0);
};

export const getOrderQuantity = async () => {
  const investableQuantity = await getInvestableQuantity();
  const orderQuantity = investableQuantity * (ORDER_AMOUNT_PERCENT / 100);
  return orderQuantity;
};

export const getRandomSymbol = async () => {
  const exchangeInformation = await exchangeInformationAPI();
  const symbols = exchangeInformation.symbols.filter(
    (item) =>
      item.contractType === "PERPETUAL" &&
      item.status === "TRADING" &&
      item.quoteAsset === QUOTE_ASSET &&
      item.symbol !== "USDCUSDT"
  );
  const randomIndex = Math.floor(Math.random() * symbols.length);
  return symbols[randomIndex].symbol;
};

export const getMarkPriceKlineData = async (interval = KLINE_INTERVAL) => {
  const symbol = await getStorageData("symbol");
  const totalParams = { symbol, interval };
  const markPriceKlineData = await markPriceKlineDataAPI(totalParams);
  return markPriceKlineData;
};

export const getHeikinAshiKLineData = async (interval = KLINE_INTERVAL) => {
  const markPriceKlineData = await getMarkPriceKlineData(interval);
  const openPrices = markPriceKlineData.map((kline) => Number(kline[1]));
  const highPrices = markPriceKlineData.map((kline) => Number(kline[2]));
  const lowPrices = markPriceKlineData.map((kline) => Number(kline[3]));
  const closePrices = markPriceKlineData.map((kline) => Number(kline[4]));
  return heikinashi({
    open: openPrices,
    high: highPrices,
    low: lowPrices,
    close: closePrices
  });
};

export const getPrecisionBySize = (size) => {
  if (size === "1") {
    return 0;
  } else {
    return size.indexOf("1") - 1;
  }
};

export const formatBySize = (number, size) => {
  const precision = getPrecisionBySize(size);
  return Number(number.toFixed(precision));
};
