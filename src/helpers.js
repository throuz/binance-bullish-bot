import {
  QUOTE_ASSET,
  LEVERAGE,
  INTERVAL,
  KLINE_LIMIT,
  FIBONACCI_RATIOS,
  TAKE_PROFIT_INDEX,
  STOP_LOSS_INDEX,
  ORDER_AMOUNT_PERCENTAGE,
  SAFE_ZONE_INDEX,
  MIN_VOLATILITY_RATIO
} from "../configs/trade-config.js";
import {
  exchangeInformationAPI,
  futuresAccountBalanceAPI,
  markPriceAPI,
  positionInformationAPI,
  markPriceKlineDataAPI,
  notionalAndLeverageBracketsAPI
} from "./api.js";
import { nodeCache } from "./cache.js";

export const getSizes = async () => {
  const exchangeInformation = await exchangeInformationAPI();
  const symbol = nodeCache.get("symbol");
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
  const symbol = nodeCache.get("symbol");
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

export const getIsPriceVolatilityEnough = async () => {
  const { highestPrice, lowestPrice } = await getTrendExtrema();
  const volatility = (highestPrice - lowestPrice) / lowestPrice;
  return volatility > MIN_VOLATILITY_RATIO;
};

export const getFibonacciLevels = async () => {
  const { highestPrice, lowestPrice } = await getTrendExtrema();
  const priceDifference = highestPrice - lowestPrice;
  const fibonacciLevels = FIBONACCI_RATIOS.map(
    (ratio) => lowestPrice + priceDifference * ratio
  );
  return fibonacciLevels;
};

export const getIsPriceInSafeZone = async () => {
  const [markPrice, fibonacciLevels] = await Promise.all([
    getMarkPrice(),
    getFibonacciLevels()
  ]);
  const isPriceInSafeZone = markPrice > fibonacciLevels[SAFE_ZONE_INDEX];
  return isPriceInSafeZone;
};

export const getTPSL = async () => {
  const [markPrice, fibonacciLevels] = await Promise.all([
    getMarkPrice(),
    getFibonacciLevels()
  ]);
  let closestIndex = 0;
  let closestDifference = Math.abs(markPrice - fibonacciLevels[0]);
  for (let i = 1; i < fibonacciLevels.length; i++) {
    const difference = Math.abs(markPrice - fibonacciLevels[i]);
    if (difference < closestDifference) {
      closestIndex = i;
      closestDifference = difference;
    }
  }
  const takeProfitPrice = fibonacciLevels[closestIndex + TAKE_PROFIT_INDEX];
  const stopLossPrice = fibonacciLevels[closestIndex + STOP_LOSS_INDEX];
  return { takeProfitPrice, stopLossPrice };
};

export const getOrderQuantity = async () => {
  const investableQuantity = await getInvestableQuantity();
  const orderQuantity = investableQuantity * (ORDER_AMOUNT_PERCENTAGE / 100);
  return orderQuantity;
};

export const getIsLeverageAvailable = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol, timestamp: Date.now() };
  const notionalAndLeverageBrackets = await notionalAndLeverageBracketsAPI(
    totalParams
  );
  return notionalAndLeverageBrackets[0].brackets[0].initialLeverage >= LEVERAGE;
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
