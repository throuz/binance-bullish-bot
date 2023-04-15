import envConfig from "../configs/env-config.js";
import tradeConfig from "../configs/trade-config.js";
import { taAPI } from "./web-services.js";

const { TAAPI_SECRET } = envConfig;
const { BASE_ASSET, QUOTE_ASSET, INTERVAL } = tradeConfig;

const getSignals = async () => {
  const response = await taAPI.post("/bulk", {
    secret: TAAPI_SECRET,
    construct: {
      exchange: "binance",
      symbol: `${BASE_ASSET}/${QUOTE_ASSET}`,
      interval: INTERVAL,
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
    switch (id) {
      case "cci":
        if (result.value > 100) {
          return "BUY";
        }
        if (result.value < -100) {
          return "SELL";
        }

      case "cmf":
        if (result.value > 0) {
          return "BUY";
        }
        if (result.value < 0) {
          return "SELL";
        }

      case "fibonacciretracement":
        if (result.trend === "UPTREND") {
          return "BUY";
        }
        if (result.trend === "DOWNTREND") {
          return "SELL";
        }

      case "mfi":
        if (result.value < 20) {
          return "BUY";
        }
        if (result.value > 80) {
          return "SELL";
        }

      case "mom":
        if (result.value > 0) {
          return "BUY";
        }
        if (result.value < 0) {
          return "SELL";
        }

      case "rsi":
        if (result.value < 30) {
          return "BUY";
        }
        if (result.value > 70) {
          return "SELL";
        }

      case "stoch":
        if (result.valueK < 20 && result.valueD < 20) {
          return "BUY";
        }
        if (result.valueK > 80 && result.valueD > 80) {
          return "SELL";
        }

      case "stochrsi":
        if (result.valueK < 20 && result.valueD < 20) {
          return "BUY";
        }
        if (result.valueK > 80 && result.valueD > 80) {
          return "SELL";
        }

      case "supertrend":
        if (result.valueAdvice === "long") {
          return "BUY";
        }
        if (result.valueAdvice === "short") {
          return "SELL";
        }

      case "trix":
        if (result.value > 0) {
          return "BUY";
        }
        if (result.value < 0) {
          return "SELL";
        }

      case "ultosc":
        if (result.value < 30) {
          return "BUY";
        }
        if (result.value > 70) {
          return "SELL";
        }

      default:
        return "NONE";
    }
  });

  return signals;
};

const getSignal = async () => {
  const signals = await getSignals();
  const buyCount = signals.filter((signal) => signal === "BUY").length;
  const sellCount = signals.filter((signal) => signal === "SELL").length;
  const halfLengthOfSignals = signals.length / 2;
  if (buyCount > halfLengthOfSignals) {
    return "BUY";
  }
  if (sellCount > halfLengthOfSignals) {
    return "SELL";
  }
  return "NONE";
};

export { getSignals, getSignal };
