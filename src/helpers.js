import crypto from "node:crypto";
import querystring from "node:querystring";
import envConfig from "../configs/env-config.js";
import tradeConfig from "../configs/trade-config.js";
import { binanceFuturesAPI } from "./web-services.js";
import { asyncLocalStorage } from "./storage.js";

const { SECRET_KEY } = envConfig;
const {
  QUOTE_ASSET,
  LEVERAGE,
  INTERVAL,
  KLINE_LIMIT,
  FIBONACCI_RATIOS,
  ORDER_AMOUNT_PERCENTAGE
} = tradeConfig;

const getSymbol = () => {
  const store = asyncLocalStorage.getStore();
  return store.symbol;
};

const getSignature = (totalParams) => {
  const queryString = querystring.stringify(totalParams);
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(queryString)
    .digest("hex");
  return signature;
};

const getPrecisions = async () => {
  const symbol = getSymbol();
  const response = await binanceFuturesAPI.get("/fapi/v1/exchangeInfo");
  const symbolData = response.data.symbols.find(
    (item) => item.symbol === symbol
  );
  const { quantityPrecision } = symbolData;
  const priceFilterData = symbolData.filters.find(
    (filter) => filter.filterType === "PRICE_FILTER"
  );
  const tickSizeString = String(Number(priceFilterData.tickSize));
  const pricePrecision = tickSizeString.split(".")[1].length;
  return { quantityPrecision, pricePrecision };
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
  const totalParams = { symbol: symbol };
  const response = await binanceFuturesAPI.get("/fapi/v1/premiumIndex", {
    params: totalParams
  });
  return response.data.markPrice;
};

const getAllMarkPrice = async () => {
  const response = await binanceFuturesAPI.get("/fapi/v1/premiumIndex");
  return response.data;
};

const getAvailableQuantity = async () => {
  const [availableBalance, markPrice] = await Promise.all([
    getAvailableBalance(),
    getMarkPrice()
  ]);
  const availableFunds = availableBalance * LEVERAGE;
  return Math.trunc((availableFunds / markPrice) * 1000) / 1000;
};

const getAllowableQuantity = async () => {
  const symbol = getSymbol();
  const totalParams = { symbol: symbol, timestamp: Date.now() };
  const signature = getSignature(totalParams);
  const response = await binanceFuturesAPI.get("/fapi/v2/positionRisk", {
    params: { ...totalParams, signature }
  });
  const { maxNotionalValue, positionAmt } = response.data[0];
  const markPrice = await getMarkPrice();
  const maxAllowableQuantity =
    Math.trunc((maxNotionalValue / markPrice) * 1000) / 1000;
  return maxAllowableQuantity - Math.abs(positionAmt);
};

const getInvestableQuantity = async () => {
  const [availableQuantity, allowableQuantity] = await Promise.all([
    getAvailableQuantity(),
    getAllowableQuantity()
  ]);
  return Math.min(availableQuantity, allowableQuantity);
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

const getHasLimitOrder = async () => {
  const totalParams = { timestamp: Date.now() };
  const signature = getSignature(totalParams);
  const response = await binanceFuturesAPI.get("/fapi/v1/openOrders", {
    params: { ...totalParams, signature }
  });
  return response.data.some((order) => order.type === "LIMIT");
};

const getAllowNewOrders = async () => {
  const hasPosition = await getHasPosition();
  if (hasPosition) {
    return false;
  }
  const hasLimitOrder = await getHasLimitOrder();
  if (hasLimitOrder) {
    return false;
  }
  return true;
};

const getTrendExtrema = async () => {
  const symbol = getSymbol();
  const totalParams = {
    symbol: symbol,
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

const roundToDecimalPlace = (number, decimalPlaces) => {
  const multiplier = Math.pow(10, decimalPlaces);
  return Math.round(number * multiplier) / multiplier;
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

export {
  getSymbol,
  getSignature,
  getPrecisions,
  getAvailableBalance,
  getMarkPrice,
  getAllMarkPrice,
  getAvailableQuantity,
  getAllowableQuantity,
  getInvestableQuantity,
  getPositionInformation,
  getAllPositionInformation,
  getHasPosition,
  getHasLimitOrder,
  getAllowNewOrders,
  getTrendExtrema,
  getPrice24hrAgo,
  getFibonacciLevels,
  getTPSL,
  roundToDecimalPlace,
  getOrderQuantity,
  getAllPriceChangeRatio,
  getHighestGainsSymbol
};
