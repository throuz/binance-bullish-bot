import crypto from "node:crypto";
import querystring from "node:querystring";
import { binanceFuturesAPI } from "./web-services.js";
import { SECRET_KEY } from "../configs/env-config.js";

const getSignature = (totalParams) => {
  const queryString = querystring.stringify(totalParams);
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(queryString)
    .digest("hex");
  return signature;
};

// GET

export const exchangeInformationAPI = async () => {
  const response = await binanceFuturesAPI.get("/fapi/v1/exchangeInfo");
  return response.data;
};

export const futuresAccountBalanceAPI = async (totalParams) => {
  const signature = getSignature(totalParams);
  const response = await binanceFuturesAPI.get("/fapi/v2/balance", {
    params: { ...totalParams, signature }
  });
  return response.data;
};

export const markPriceAPI = async (totalParams) => {
  const response = await binanceFuturesAPI.get("/fapi/v1/premiumIndex", {
    params: { ...totalParams }
  });
  return response.data;
};

export const positionInformationAPI = async (totalParams) => {
  const signature = getSignature(totalParams);
  const response = await binanceFuturesAPI.get("/fapi/v2/positionRisk", {
    params: { ...totalParams, signature }
  });
  return response.data;
};

export const markPriceKlineDataAPI = async (totalParams) => {
  const response = await binanceFuturesAPI.get("/fapi/v1/markPriceKlines", {
    params: { ...totalParams }
  });
  return response.data;
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
