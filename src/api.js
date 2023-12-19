import crypto from "node:crypto";
import querystring from "node:querystring";
import { SECRET_KEY } from "../configs/env-config.js";
import { nodeCache } from "./cache.js";
import { binanceFuturesAPI } from "./web-services.js";

export const getSignature = (totalParams) => {
  const queryString = querystring.stringify(totalParams);
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(queryString)
    .digest("hex");
  return signature;
};

export const getBinanceFuturesAPI = async (path, totalParams) => {
  const signature = getSignature(totalParams);
  const key = path + "/" + signature;
  if (nodeCache.has(key)) {
    return nodeCache.get(key);
  }
  const response = await binanceFuturesAPI.get(path, {
    params: { ...totalParams, signature }
  });
  nodeCache.set(key, response.data);
  return response.data;
};

// GET

export const exchangeInformationAPI = async () => {
  const responseData = await getBinanceFuturesAPI("/fapi/v1/exchangeInfo");
  return responseData;
};

export const futuresAccountBalanceAPI = async (totalParams) => {
  const responseData = await getBinanceFuturesAPI(
    "/fapi/v2/balance",
    totalParams
  );
  return responseData;
};

export const markPriceAPI = async (totalParams) => {
  const responseData = await getBinanceFuturesAPI(
    "/fapi/v1/premiumIndex",
    totalParams
  );
  return responseData;
};

export const positionInformationAPI = async (totalParams) => {
  const responseData = await getBinanceFuturesAPI(
    "/fapi/v2/positionRisk",
    totalParams
  );
  return responseData;
};

export const notionalAndLeverageBracketsAPI = async (totalParams) => {
  const responseData = await getBinanceFuturesAPI(
    "/fapi/v1/leverageBracket",
    totalParams
  );
  return responseData;
};

export const markPriceKlineDataAPI = async (totalParams) => {
  const responseData = await getBinanceFuturesAPI(
    "/fapi/v1/markPriceKlines",
    totalParams
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
  const response = await binanceFuturesAPI.delete("/fapi/v1/allOpenOrders", {
    params: { ...totalParams, signature }
  });
  return response.data;
};
