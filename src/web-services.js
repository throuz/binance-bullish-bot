import axios from "axios";
import env from "../configs/env.js";
import tradeConfig from "../configs/trade-config.js";

const { LINE_NOTIFY_TOKEN, REST_BASEURL, API_KEY, TAAPI_SECRET } = env;
const { BASE_ASSET, QUOTE_ASSET } = tradeConfig;

const lineNotifyAPI = axios.create({
  baseURL: "https://notify-api.line.me",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Bearer ${LINE_NOTIFY_TOKEN}`
  }
});

const binanceFuturesAPI = axios.create({
  baseURL: REST_BASEURL,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "X-MBX-APIKEY": API_KEY
  }
});

const taAPI = axios.create({
  baseURL: "https://api.taapi.io",
  params: {
    secret: TAAPI_SECRET,
    exchange: "binance",
    symbol: `${BASE_ASSET}/${QUOTE_ASSET}`,
    interval: "1m"
  }
});

export { lineNotifyAPI, binanceFuturesAPI, taAPI };
