import {
  QUOTE_ASSET,
  LEVERAGE,
  KLINE_INTERVAL,
  KLINE_LIMIT,
  ORDER_AMOUNT_PERCENT
} from "../configs/trade-config.js";
import {
  exchangeInformationAPI,
  futuresAccountBalanceAPI,
  markPriceAPI,
  positionInformationAPI,
  markPriceKlineDataAPI
} from "./api.js";
import { nodeCache } from "./cache.js";

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
  const [availableBalance, markPrice] = await Promise.all([
    getAvailableBalance(),
    getMarkPrice()
  ]);
  const availableFunds = availableBalance * LEVERAGE;
  return availableFunds / markPrice;
};

export const getPositionInformation = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol, timestamp: Date.now() };
  const positionInformation = await positionInformationAPI(totalParams);
  return positionInformation[0];
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

export const getMarkPriceKlineData = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = {
    symbol,
    interval: KLINE_INTERVAL,
    limit: KLINE_LIMIT
  };
  const markPriceKlineData = await markPriceKlineDataAPI(totalParams);
  return markPriceKlineData;
};

export const getTrendAveragePrice = async () => {
  const markPriceKlineData = await getMarkPriceKlineData();
  const closePriceArray = markPriceKlineData.map((kline) => Number(kline[4]));
  const closePriceArraySum = closePriceArray.reduce((a, b) => a + b, 0);
  const trendAveragePrice = closePriceArraySum / closePriceArray.length;
  return trendAveragePrice;
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
      item.quoteAsset === QUOTE_ASSET
  );
  const randomIndex = Math.floor(Math.random() * symbols.length);
  return symbols[randomIndex].symbol;
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
