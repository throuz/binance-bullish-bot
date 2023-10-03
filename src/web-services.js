import axios from "axios";
import envConfig from "../configs/env-config.js";

const { LINE_NOTIFY_TOKEN, REST_BASEURL, API_KEY } = envConfig;

export const lineNotifyAPI = axios.create({
  baseURL: "https://notify-api.line.me",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Bearer ${LINE_NOTIFY_TOKEN}`
  }
});

export const binanceFuturesAPI = axios.create({
  baseURL: REST_BASEURL,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "X-MBX-APIKEY": API_KEY
  }
});
