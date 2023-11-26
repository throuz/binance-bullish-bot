import {
  KLINE_INTERVAL,
  ORDER_AMOUNT_PERCENT,
  QUOTE_ASSET
} from "../configs/trade-config.js";
import {
  exchangeInformationAPI,
  futuresAccountBalanceAPI,
  markPriceAPI,
  markPriceKlineDataAPI,
  notionalAndLeverageBracketsAPI,
  positionInformationAPI
} from "./api.js";
import { nodeCache } from "./cache.js";

export const getMaxLeverage = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol, timestamp: Date.now() };
  const notionalAndLeverageBrackets = await notionalAndLeverageBracketsAPI(
    totalParams
  );
  return notionalAndLeverageBrackets[0].brackets[0].initialLeverage;
};

export const getStepSize = async () => {
  const exchangeInformation = await exchangeInformationAPI();
  const symbol = nodeCache.get("symbol");
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
  const symbol = nodeCache.get("symbol");
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
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol, timestamp: Date.now() };
  const positionInformation = await positionInformationAPI(totalParams);
  return positionInformation[0];
};

export const getPNLPercent = async () => {
  const positionInformation = await getPositionInformation();
  const { unRealizedProfit, notional, leverage } = positionInformation;
  return (unRealizedProfit / (notional / leverage)) * 100;
};

export const getAllowableQuantity = async () => {
  const [positionInformation, markPrice] = await Promise.all([
    getPositionInformation(),
    getMarkPrice()
  ]);
  const { maxNotionalValue, positionAmt } = positionInformation;
  const maxAllowableQuantity = maxNotionalValue / markPrice;
  return maxAllowableQuantity - positionAmt;
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
  return allPositionInformation.some((info) => info.positionAmt > 0);
};

export const getCurrentPositionSymbol = async () => {
  const allPositionInformation = await getAllPositionInformation();
  const foundInfo = allPositionInformation.find((info) => info.positionAmt > 0);
  return foundInfo.symbol;
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
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol, interval, limit: 1500 };
  const markPriceKlineData = await markPriceKlineDataAPI(totalParams);
  const openPrices = markPriceKlineData.map((kline) => Number(kline[1]));
  const highPrices = markPriceKlineData.map((kline) => Number(kline[2]));
  const lowPrices = markPriceKlineData.map((kline) => Number(kline[3]));
  const closePrices = markPriceKlineData.map((kline) => Number(kline[4]));
  return { openPrices, highPrices, lowPrices, closePrices };
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
