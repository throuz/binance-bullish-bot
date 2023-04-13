import { sendLineNotify } from "./src/common.js";
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
    if (error.response) {
      await sendLineNotify(
        "The request was made and the server responded with a status code that falls out of the range of 2xx"
      );
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      await sendLineNotify("The request was made but no response was received");
      console.log(error.request);
    } else {
      await sendLineNotify(
        "Something happened in setting up the request that triggered an Error"
      );
      console.log("Error", error.message);
    }
    console.log(error.config);
  }
};

check();
setInterval(() => {
  check();
}, 60000);
