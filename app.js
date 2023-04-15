import tradeConfig from "./configs/trade-config.js";
import { errorHandler } from "./src/common.js";
import { getSignal } from "./src/signal.js";
import { openPosition, closePosition } from "./src/trade.js";

const { INTERVAL_TIME } = tradeConfig;

const trade = async () => {
  try {
    const signal = await getSignal();
    if (signal !== "NONE") {
      await closePosition(signal);
      await openPosition(signal);
    }
  } catch (error) {
    await errorHandler(error);
  }
};

trade();
setInterval(() => {
  trade();
}, INTERVAL_TIME);
