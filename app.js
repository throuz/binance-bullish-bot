import { errorHandler } from "./src/common.js";
import getSignal from "./src/getSignal.js";
import { openPosition, closePosition } from "./src/trade.js";

const check = async () => {
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

check();
setInterval(() => {
  check();
}, 60000);
