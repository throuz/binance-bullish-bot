import crypto from "node:crypto";
import querystring from "node:querystring";
import env from "../configs/env.js";
import tradeConfig from "../configs/trade-config.js";
import { binanceFuturesAPI } from "./web-services.js";
import { handleAPIError } from "./common.js";

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
  try {
    const totalParams = { timestamp: Date.now() };
    const signature = getSignature(totalParams);

    const response = await binanceFuturesAPI.get("/fapi/v1/balance", {
      params: { ...totalParams, signature }
    });
    const availableBalance = response.data.find(
      ({ asset }) => asset === QUOTE_ASSET
    ).withdrawAvailable;
    return availableBalance;
  } catch (error) {
    await handleAPIError(error);
  }
};

const getMarkPrice = async () => {
  try {
    const totalParams = { symbol: SYMBOL };

    const response = await binanceFuturesAPI.get("/fapi/v1/premiumIndex", {
      params: totalParams
    });
    return response.data.markPrice;
  } catch (error) {
    await handleAPIError(error);
  }
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
  try {
    const totalParams = { symbol: SYMBOL, timestamp: Date.now() };
    const signature = getSignature(totalParams);

    const response = await binanceFuturesAPI.get("/fapi/v2/positionRisk", {
      params: { ...totalParams, signature }
    });
    return response.data[0].positionAmt;
  } catch (error) {
    await handleAPIError(error);
  }
};

const getAllowableQuantity = async () => {
  try {
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
  } catch (error) {
    await handleAPIError(error);
  }
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
