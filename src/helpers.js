import crypto from "node:crypto";
import querystring from "node:querystring";
import envConfig from "../configs/env-config.js";
import tradeConfig from "../configs/trade-config.js";
import { binanceFuturesAPI } from "./web-services.js";
import { getSymbol } from "./storage.js";

const { SECRET_KEY } = envConfig;
const {
  QUOTE_ASSET,
  LEVERAGE,
  INTERVAL,
  KLINE_LIMIT,
  FIBONACCI_RATIOS,
  ORDER_AMOUNT_PERCENTAGE
} = tradeConfig;

const getSignature = (totalParams) => {
  const queryString = querystring.stringify(totalParams);
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(queryString)
    .digest("hex");
  return signature;
};

const getSizes = async () => {
  const symbol = getSymbol();
  const response = await binanceFuturesAPI.get("/fapi/v1/exchangeInfo");
  const symbolData = response.data.symbols.find(
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

const getAvailableBalance = async () => {
  const totalParams = { timestamp: Date.now() };
  const signature = getSignature(totalParams);
  const response = await binanceFuturesAPI.get("/fapi/v2/balance", {
    params: { ...totalParams, signature }
  });
  const availableBalance = response.data.find(
    ({ asset }) => asset === QUOTE_ASSET
  ).availableBalance;
  return availableBalance;
};

const getMarkPrice = async () => {
  const symbol = getSymbol();
  const totalParams = { symbol };
  const response = await binanceFuturesAPI.get("/fapi/v1/premiumIndex", {
    params: totalParams
  });
  return response.data.markPrice;
};

const getAllMarkPrice = async () => {
  const response = await binanceFuturesAPI.get("/fapi/v1/premiumIndex");
  return response.data.filter((item) => item.symbol.includes(QUOTE_ASSET));
};

const getAvailableQuantity = async () => {
  const [availableBalance, markPrice] = await Promise.all([
    getAvailableBalance(),
    getMarkPrice()
  ]);
  const availableFunds = availableBalance * LEVERAGE;
  return availableFunds / markPrice;
};

const getPositionInformation = async () => {
  const symbol = getSymbol();
  const totalParams = { symbol, timestamp: Date.now() };
  const signature = getSignature(totalParams);
  const response = await binanceFuturesAPI.get("/fapi/v2/positionRisk", {
    params: { ...totalParams, signature }
  });
  return response.data[0];
};

const getAllowableQuantity = async () => {
  const [positionInformation, markPrice] = await Promise.all([
    getPositionInformation(),
    getMarkPrice()
  ]);
  const { maxNotionalValue, positionAmt } = positionInformation;
  const maxAllowableQuantity = maxNotionalValue / markPrice;
  return maxAllowableQuantity - positionAmt;
};

const getInvestableQuantity = async () => {
  const [availableQuantity, allowableQuantity] = await Promise.all([
    getAvailableQuantity(),
    getAllowableQuantity()
  ]);
  return Math.min(availableQuantity, allowableQuantity);
};

const getAllPositionInformation = async () => {
  const totalParams = { timestamp: Date.now() };
  const signature = getSignature(totalParams);
  const response = await binanceFuturesAPI.get("/fapi/v2/positionRisk", {
    params: { ...totalParams, signature }
  });
  return response.data;
};

const getHasPosition = async () => {
  const allPositionInformation = await getAllPositionInformation();
  for (const info of allPositionInformation) {
    if (info.positionAmt > 0) {
      return true;
    }
  }
  return false;
};

const getAllowNewOrders = async () => {
  const hasPosition = await getHasPosition();
  if (hasPosition) {
    return false;
  }
  return true;
};

const getTrendExtrema = async () => {
  const symbol = getSymbol();
  const totalParams = {
    symbol,
    interval: INTERVAL,
    limit: KLINE_LIMIT
  };
  const response = await binanceFuturesAPI.get("/fapi/v1/markPriceKlines", {
    params: totalParams
  });
  const highPriceArray = response.data.map((kline) => kline[2]);
  const highestPrice = Math.max(...highPriceArray);
  const lowPriceArray = response.data.map((kline) => kline[3]);
  const lowestPrice = Math.min(...lowPriceArray);
  return { highestPrice, lowestPrice };
};

const getPrice24hrAgo = async (symbol) => {
  const totalParams = {
    symbol,
    interval: "1m",
    startTime: Date.now() - 24 * 60 * 60 * 1000,
    limit: 1
  };
  const response = await binanceFuturesAPI.get("/fapi/v1/markPriceKlines", {
    params: totalParams
  });
  return { symbol, price24hrAgo: response.data[0][1] };
};

const getFibonacciLevels = async () => {
  const { highestPrice, lowestPrice } = await getTrendExtrema();
  const priceDifference = highestPrice - lowestPrice;
  const fibonacciLevels = FIBONACCI_RATIOS.map(
    (ratio) => lowestPrice + priceDifference * ratio
  );
  return fibonacciLevels;
};

const getTPSL = (price, levels) => {
  const differenceArray = levels.map((level) => Math.abs(level - price));
  const minDifference = Math.min(...differenceArray);
  const targetIndex = differenceArray.findIndex(
    (diff) => diff === minDifference
  );
  const takeProfitPrice = levels[targetIndex + 2];
  const stopLossPrice = levels[targetIndex - 1];
  return { takeProfitPrice, stopLossPrice };
};

const getOrderQuantity = async () => {
  const investableQuantity = await getInvestableQuantity();
  const orderQuantity = investableQuantity * (ORDER_AMOUNT_PERCENTAGE / 100);
  return orderQuantity;
};

const getAllPriceChangeRatio = async () => {
  const allMarkPrice = await getAllMarkPrice();
  const promiseAllArray = allMarkPrice.map((item) =>
    getPrice24hrAgo(item.symbol)
  );
  const findMarkPrice = (symbol) =>
    allMarkPrice.find((element) => element.symbol === symbol).markPrice;
  const allPrice24hrAgo = await Promise.all(promiseAllArray);
  const allPriceChangeRatio = allPrice24hrAgo
    .filter((item) => findMarkPrice(item.symbol) > item.price24hrAgo)
    .map((item) => ({
      symbol: item.symbol,
      priceChangeRatio:
        (findMarkPrice(item.symbol) - item.price24hrAgo) / item.price24hrAgo
    }));
  return allPriceChangeRatio;
};

const getHighestGainsSymbol = async () => {
  const allPriceChangeRatio = await getAllPriceChangeRatio();
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

const getPrecision = (numberString) => {
  const decimalIndex = numberString.indexOf(".");
  if (decimalIndex === -1) {
    return 0;
  } else {
    return numberString.length - decimalIndex - 1;
  }
};

const formatBySize = (number, size) => {
  const precision = getPrecision(size);
  return Number(number.toFixed(precision));
};

export {
  getSymbol,
  getSignature,
  getSizes,
  getAvailableBalance,
  getMarkPrice,
  getAllMarkPrice,
  getAvailableQuantity,
  getAllowableQuantity,
  getInvestableQuantity,
  getPositionInformation,
  getAllPositionInformation,
  getHasPosition,
  getAllowNewOrders,
  getTrendExtrema,
  getPrice24hrAgo,
  getFibonacciLevels,
  getTPSL,
  getOrderQuantity,
  getAllPriceChangeRatio,
  getHighestGainsSymbol,
  getPrecision,
  formatBySize
};
