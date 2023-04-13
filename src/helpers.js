import crypto from "node:crypto";
import querystring from "node:querystring";
import env from "../configs/env.js";
import tradeConfig from "../configs/trade-config.js";
import { binanceFuturesAPI } from "./web-services.js";

const { SECRET_KEY } = env;
const { QUOTE_ASSET, SYMBOL, LEVERAGE } = tradeConfig;

const getSignature = (totalParams) => {
  const queryString = querystring.stringify(totalParams);
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(queryString)
    .digest("hex");
  return signature;
};

const getAvailableBalance = async () => {
  const totalParams = { timestamp: Date.now() };
  const signature = getSignature(totalParams);

  const response = await binanceFuturesAPI.get("/fapi/v1/balance", {
    params: { ...totalParams, signature }
  });
  const availableBalance = response.data.find(
    ({ asset }) => asset === QUOTE_ASSET
  ).withdrawAvailable;
  return availableBalance;
};

const getMarkPrice = async () => {
  const totalParams = { symbol: SYMBOL };

  const response = await binanceFuturesAPI.get("/fapi/v1/premiumIndex", {
    params: totalParams
  });
  return response.data.markPrice;
};

const getOppositeSide = (side) => {
  if (side === "BUY") {
    return "SELL";
  }
  if (side === "SELL") {
    return "BUY";
  }
};

const getAvailableQuantity = async () => {
  const [availableBalance, markPrice] = await Promise.all([
    getAvailableBalance(),
    getMarkPrice()
  ]);
  const availableFunds = availableBalance * LEVERAGE;
  return Math.trunc((availableFunds / markPrice) * 1000) / 1000;
};

const getPositionAmount = async () => {
  const totalParams = { symbol: SYMBOL, timestamp: Date.now() };
  const signature = getSignature(totalParams);

  const response = await binanceFuturesAPI.get("/fapi/v2/positionRisk", {
    params: { ...totalParams, signature }
  });
  return response.data[0].positionAmt;
};

const getAllowableQuantity = async () => {
  const totalParams = { symbol: SYMBOL, timestamp: Date.now() };
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

const getPositionDirection = (positionAmount) => {
  if (positionAmount > 0) {
    return "BUY";
  }
  if (positionAmount < 0) {
    return "SELL";
  }
  return "NONE";
};

export {
  getSignature,
  getAvailableBalance,
  getMarkPrice,
  getOppositeSide,
  getAvailableQuantity,
  getPositionAmount,
  getAllowableQuantity,
  getPositionDirection
};
