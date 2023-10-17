import {
  QUOTE_ASSET,
  LEVERAGE,
  KLINE_INTERVAL,
  KLINE_LIMIT,
  FIBONACCI_RATIOS,
  TAKE_PROFIT_INDEX,
  STOP_LOSS_INDEX,
  ORDER_AMOUNT_PERCENT,
  SAFE_ZONE_INDEX,
  MIN_VOLATILITY_PERCENT,
  TRADING_RATIOS_PERIOD,
  STOCK_RSI_UPPER_LIMIT
} from "../configs/trade-config.js";
import {
  exchangeInformationAPI,
  futuresAccountBalanceAPI,
  markPriceAPI,
  positionInformationAPI,
  markPriceKlineDataAPI,
  notionalAndLeverageBracketsAPI,
  currentAllOpenOrdersAPI,
  topLongShortAccountRatioAPI,
  topLongShortPositionRatioAPI,
  globalLongShortAccountRatioAPI
} from "./api.js";
import { nodeCache } from "./cache.js";
import { stochasticrsi } from "technicalindicators";

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

export const getHasPositions = async () => {
  const allPositionInformation = await getAllPositionInformation();
  for (const info of allPositionInformation) {
    if (info.positionAmt > 0) {
      return true;
    }
  }
  return false;
};

export const getAllowNewOrders = async () => {
  const hasPositions = await getHasPositions();
  if (hasPositions) {
    return false;
  }
  return true;
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

export const getTrendExtrema = async () => {
  const markPriceKlineData = await getMarkPriceKlineData();
  const highPriceArray = markPriceKlineData.map((kline) => Number(kline[2]));
  const highestPrice = Math.max(...highPriceArray);
  const highestPriceIndex = highPriceArray.findIndex(
    (price) => price === highestPrice
  );
  const lowPriceArray = markPriceKlineData.map((kline) => Number(kline[3]));
  const lowestPrice = Math.min(...lowPriceArray);
  const lowestPriceIndex = lowPriceArray.findIndex(
    (price) => price === lowestPrice
  );
  return { highestPriceIndex, highestPrice, lowestPriceIndex, lowestPrice };
};

export const getIsUptrend = async () => {
  const { highestPriceIndex, lowestPriceIndex } = await getTrendExtrema();
  return highestPriceIndex > lowestPriceIndex;
};

export const getIsPriceVolatilityEnough = async () => {
  const { highestPrice, lowestPrice } = await getTrendExtrema();
  const volatility = ((highestPrice - lowestPrice) / lowestPrice) * 100;
  return volatility > MIN_VOLATILITY_PERCENT;
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
  const orderQuantity = investableQuantity * (ORDER_AMOUNT_PERCENT / 100);
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

export const getIsAllTradingRatiosBullish = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol, period: TRADING_RATIOS_PERIOD, limit: 1 };
  const results = await Promise.all([
    topLongShortAccountRatioAPI(totalParams),
    topLongShortPositionRatioAPI(totalParams),
    globalLongShortAccountRatioAPI(totalParams)
  ]);
  for (const result of results) {
    if (result[0].longShortRatio < 1) {
      return false;
    }
  }
  return true;
};

export const getIsStockRsiUpper = async () => {
  const markPriceKlineData = await getMarkPriceKlineData();
  const closePriceArray = markPriceKlineData.map((kline) => Number(kline[4]));
  const stochRsiOutput = stochasticrsi({
    values: closePriceArray,
    rsiPeriod: 14,
    stochasticPeriod: 14,
    kPeriod: 3,
    dPeriod: 3
  });
  return stochRsiOutput[stochRsiOutput.length - 1].k > STOCK_RSI_UPPER_LIMIT;
};

export const getAllowPlaceOrders = async () => {
  const isLeverageAvailable = await getIsLeverageAvailable();
  if (!isLeverageAvailable) {
    return false;
  }
  const isAllTradingRatiosBullish = await getIsAllTradingRatiosBullish();
  if (!isAllTradingRatiosBullish) {
    return false;
  }
  const isUptrend = await getIsUptrend();
  if (!isUptrend) {
    return false;
  }
  const isPriceInSafeZone = await getIsPriceInSafeZone();
  if (!isPriceInSafeZone) {
    return false;
  }
  const isPriceVolatilityEnough = await getIsPriceVolatilityEnough();
  if (!isPriceVolatilityEnough) {
    return false;
  }
  const isStockRsiUpper = await getIsStockRsiUpper();
  if (!isStockRsiUpper) {
    return false;
  }
  return true;
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

export const getCurrentAllOpenOrders = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol, timestamp: Date.now() };
  const currentAllOpenOrders = await currentAllOpenOrdersAPI(totalParams);
  return currentAllOpenOrders;
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
