import {
  QUOTE_ASSET,
  LEVERAGE,
  INTERVAL,
  KLINE_LIMIT,
  FIBONACCI_RATIOS,
  TAKE_PROFIT_INDEX,
  STOP_LOSS_INDEX,
  ORDER_AMOUNT_PERCENTAGE
} from "../configs/trade-config.js";
import {
  exchangeInformationAPI,
  futuresAccountBalanceAPI,
  markPriceAPI,
  positionInformationAPI,
  markPriceKlineDataAPI
} from "./api.js";
import { getSymbol } from "./storage.js";

export const getSizes = async () => {
  const exchangeInformation = await exchangeInformationAPI();
  const symbol = getSymbol();
  const symbolData = exchangeInformation.symbols.find(
    (item) => item.symbol === symbol
  );
  const tickSize = symbolData.filters.find(
    (filter) => filter.filterType === "PRICE_FILTER"
  ).tickSize;
  const stepSize = symbolData.filters.find(
    (filter) => filter.filterType === "LOT_SIZE"
  ).stepSize;
  return { tickSize, stepSize };
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
  const symbol = getSymbol();
  const totalParams = { symbol };
  const markPrice = await markPriceAPI(totalParams);
  return markPrice.markPrice;
};

export const getAllMarkPrice = async () => {
  const markPrice = await markPriceAPI();
  return markPrice.filter((item) => item.symbol.includes(QUOTE_ASSET));
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
  const symbol = getSymbol();
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

export const getHasPosition = async () => {
  const allPositionInformation = await getAllPositionInformation();
  for (const info of allPositionInformation) {
    if (info.positionAmt > 0) {
      return true;
    }
  }
  return false;
};

export const getAllowNewOrders = async () => {
  const hasPosition = await getHasPosition();
  if (hasPosition) {
    return false;
  }
  return true;
};

export const getTrendExtrema = async () => {
  const symbol = getSymbol();
  const totalParams = {
    symbol,
    interval: INTERVAL,
    limit: KLINE_LIMIT
  };
  const markPriceKlineData = await markPriceKlineDataAPI(totalParams);
  const highPriceArray = markPriceKlineData.map((kline) => kline[2]);
  const highestPrice = Math.max(...highPriceArray);
  const lowPriceArray = markPriceKlineData.map((kline) => kline[3]);
  const lowestPrice = Math.min(...lowPriceArray);
  return { highestPrice, lowestPrice };
};

export const getPrice24hrAgo = async (symbol) => {
  const totalParams = {
    symbol,
    interval: "1m",
    startTime: Date.now() - 24 * 60 * 60 * 1000,
    limit: 1
  };
  const markPriceKlineData = await markPriceKlineDataAPI(totalParams);
  return { symbol, price24hrAgo: markPriceKlineData[0][1] };
};

export const getFibonacciLevels = async () => {
  const { highestPrice, lowestPrice } = await getTrendExtrema();
  const priceDifference = highestPrice - lowestPrice;
  const fibonacciLevels = FIBONACCI_RATIOS.map(
    (ratio) => lowestPrice + priceDifference * ratio
  );
  return fibonacciLevels;
};

export const getTPSL = (price, levels) => {
  const differenceArray = levels.map((level) => Math.abs(level - price));
  const minDifference = Math.min(...differenceArray);
  const targetIndex = differenceArray.findIndex(
    (diff) => diff === minDifference
  );
  const takeProfitPrice = levels[targetIndex + TAKE_PROFIT_INDEX];
  const stopLossPrice = levels[targetIndex + STOP_LOSS_INDEX];
  return { takeProfitPrice, stopLossPrice };
};

export const getOrderQuantity = async () => {
  const investableQuantity = await getInvestableQuantity();
  const orderQuantity = investableQuantity * (ORDER_AMOUNT_PERCENTAGE / 100);
  return orderQuantity;
};

export const getAllPriceChangeRatio = async (filter) => {
  const allMarkPrice = await getAllMarkPrice();
  const promiseAllArray = allMarkPrice.map((item) =>
    getPrice24hrAgo(item.symbol)
  );
  const findMarkPrice = (symbol) =>
    allMarkPrice.find((element) => element.symbol === symbol).markPrice;
  const allPrice24hrAgo = await Promise.all(promiseAllArray);
  const filteredAllPrice24hrAgo = allPrice24hrAgo.filter((item) => {
    if (filter === "GAIN") {
      return findMarkPrice(item.symbol) > item.price24hrAgo;
    }
    if (filter === "LOSS") {
      return findMarkPrice(item.symbol) < item.price24hrAgo;
    }
    return true;
  });
  const allPriceChangeRatio = filteredAllPrice24hrAgo.map((item) => ({
    symbol: item.symbol,
    priceChangeRatio:
      (findMarkPrice(item.symbol) - item.price24hrAgo) / item.price24hrAgo
  }));
  return allPriceChangeRatio;
};

export const getTopGainerSymbol = async () => {
  const allPriceChangeRatio = await getAllPriceChangeRatio("GAIN");
  if (allPriceChangeRatio.length === 0) {
    return "NONE";
  }
  const ratios = allPriceChangeRatio.map((item) => item.priceChangeRatio);
  const maxRatio = Math.max(...ratios);
  const foundIndex = allPriceChangeRatio.findIndex(
    (item) => item.priceChangeRatio === maxRatio
  );
  return allPriceChangeRatio[foundIndex].symbol;
};

export const getTopLoserSymbol = async () => {
  const allPriceChangeRatio = await getAllPriceChangeRatio("LOSS");
  if (allPriceChangeRatio.length === 0) {
    return "NONE";
  }
  const ratios = allPriceChangeRatio.map((item) => item.priceChangeRatio);
  const minRatio = Math.min(...ratios);
  const foundIndex = allPriceChangeRatio.findIndex(
    (item) => item.priceChangeRatio === minRatio
  );
  return allPriceChangeRatio[foundIndex].symbol;
};

export const getPrecisionBySize = (size) => {
  const formatedSize = String(Number(size));
  if (formatedSize === "1") {
    return 0;
  } else {
    return formatedSize.length - 2;
  }
};

export const formatBySize = (number, size) => {
  const precision = getPrecisionBySize(size);
  return Number(number.toFixed(precision));
};
