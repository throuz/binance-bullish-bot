import crypto from "node:crypto";
import querystring from "node:querystring";
import { binanceFuturesAPI } from "./web-services.js";
import { SECRET_KEY } from "../configs/env-config.js";
import { nodeCache } from "./cache.js";

export const getSignature = (totalParams) => {
  const queryString = querystring.stringify(totalParams);
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(queryString)
    .digest("hex");
  return signature;
};

// GET

export const getBinanceFuturesAPI = async (totalParams, path) => {
  const signature = getSignature(totalParams);
  const key = path + "/" + signature;
  const cache = nodeCache.get(key);
  if (cache) {
    return cache;
  }
  const response = await binanceFuturesAPI.get(path, {
    params: { ...totalParams, signature }
  });
  nodeCache.set(key, response.data);
  return response.data;
};

export const exchangeInformationAPI = async () => {
  const responseData = await getBinanceFuturesAPI({}, "/fapi/v1/exchangeInfo");
  return responseData;
};

export const futuresAccountBalanceAPI = async (totalParams) => {
  const responseData = await getBinanceFuturesAPI(
    totalParams,
    "/fapi/v2/balance"
  );
  return responseData;
};

export const positionInformationAPI = async (totalParams) => {
  const responseData = await getBinanceFuturesAPI(
    totalParams,
    "/fapi/v2/positionRisk"
  );
  return responseData;
};

export const markPriceKlineDataAPI = async (totalParams) => {
  const responseData = await getBinanceFuturesAPI(
    totalParams,
    "/fapi/v1/markPriceKlines"
  );
  return responseData;
};

export const ticker24hrPriceChangeStatisticsAPI = async (totalParams) => {
  const responseData = await getBinanceFuturesAPI(
    totalParams,
    "/fapi/v1/ticker/24hr"
  );
  return responseData;
};

// POST

export const changeInitialLeverageAPI = async (totalParams) => {
  const signature = getSignature(totalParams);
  const response = await binanceFuturesAPI.post("/fapi/v1/leverage", {
    ...totalParams,
    signature
  });
  return response.data;
};

export const newOrderAPI = async (totalParams) => {
  const signature = getSignature(totalParams);
  const response = await binanceFuturesAPI.post("/fapi/v1/order", {
    ...totalParams,
    signature
  });
  return response.data;
};

// DELETE

export const cancelAllOpenOrdersAPI = async (totalParams) => {
  const signature = getSignature(totalParams);
  const response = await binanceFuturesAPI.post("/fapi/v1/allOpenOrders", {
    ...totalParams,
    signature
  });
  return response.data;
};
