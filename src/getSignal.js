import env from "../configs/env.js";
import tradeConfig from "../configs/trade-config.js";
import { taAPI } from "./web-services.js";

const { TAAPI_SECRET } = env;
const { BASE_ASSET, QUOTE_ASSET } = tradeConfig;

const getSignal = async () => {
  const response = await taAPI.post("/bulk", {
    secret: TAAPI_SECRET,
    construct: {
      exchange: "binance",
      symbol: `${BASE_ASSET}/${QUOTE_ASSET}`,
      interval: "1m",
      indicators: [
        { id: "cci", indicator: "cci" },
        { id: "cmf", indicator: "cmf" },
        { id: "fibonacciretracement", indicator: "fibonacciretracement" },
        { id: "mfi", indicator: "mfi" },
        { id: "mom", indicator: "mom" },
        { id: "rsi", indicator: "rsi" },
        { id: "stoch", indicator: "stoch" },
        { id: "stochrsi", indicator: "stochrsi" },
        { id: "supertrend", indicator: "supertrend" },
        { id: "trix", indicator: "trix" },
        { id: "ultosc", indicator: "ultosc" }
      ]
    }
  });

  const signals = response.data.data.map(({ id, result }) => {
    if (id === "cci") {
      if (result.value > 100) {
        return "BUY";
      }
      if (result.value < -100) {
        return "SELL";
      }
    }

    if (id === "cmf") {
      if (result.value > 0) {
        return "BUY";
      }
      if (result.value < 0) {
        return "SELL";
      }
    }

    if (id === "fibonacciretracement") {
      if (result.trend === "UPTREND") {
        return "BUY";
      }
      if (result.trend === "DOWNTREND") {
        return "SELL";
      }
    }

    if (id === "mfi") {
      if (result.value < 20) {
        return "BUY";
      }
      if (result.value > 80) {
        return "SELL";
      }
    }

    if (id === "mom") {
      if (result.value > 0) {
        return "BUY";
      }
      if (result.value < 0) {
        return "SELL";
      }
    }

    if (id === "rsi") {
      if (result.value < 30) {
        return "BUY";
      }
      if (result.value > 70) {
        return "SELL";
      }
    }

    if (id === "stoch") {
      if (result.valueK < 20 && result.valueD < 20) {
        return "BUY";
      }
      if (result.valueK > 80 && result.valueD > 80) {
        return "SELL";
      }
    }

    if (id === "stochrsi") {
      if (result.valueK < 20 && result.valueD < 20) {
        return "BUY";
      }
      if (result.valueK > 80 && result.valueD > 80) {
        return "SELL";
      }
    }

    if (id === "supertrend") {
      if (result.valueAdvice === "long") {
        return "BUY";
      }
      if (result.valueAdvice === "short") {
        return "SELL";
      }
    }

    if (id === "trix") {
      if (result.value > 0) {
        return "BUY";
      }
      if (result.value < 0) {
        return "SELL";
      }
    }

    if (id === "ultosc") {
      if (result.value < 30) {
        return "BUY";
      }
      if (result.value > 70) {
        return "SELL";
      }
    }

    return "NONE";
  });

  const buyCount = signals.filter((signal) => signal === "BUY").length;
  const sellCount = signals.filter((signal) => signal === "SELL").length;

  if (buyCount >= 6) {
    return "BUY";
  }
  if (sellCount >= 6) {
    return "SELL";
  }
  return "NONE";
};

export default getSignal;
