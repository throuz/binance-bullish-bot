import { lineNotifyAPI } from "./web-services.js";

const sendLineNotify = async (msg, isLogWithTime = true) => {
  await lineNotifyAPI.post("/api/notify", { message: msg });
  if (isLogWithTime) {
    logWithTime(msg);
  } else {
    console.log(msg);
  }
};

const logWithTime = (msg) => {
  console.log(`${msg} [${new Date().toLocaleString()}]`);
};

const errorHandler = async (error) => {
  if (error.response) {
    await sendLineNotify("Response status code is outside the 2xx range");
    await sendLineNotify(error.response.data, false);
    await sendLineNotify(error.response.status, false);
    await sendLineNotify(error.response.headers, false);
  } else if (error.request) {
    await sendLineNotify("No response was received");
    await sendLineNotify(error.request, false);
  } else {
    await sendLineNotify("Error occurred during request setup.");
    await sendLineNotify(error.message, false);
  }
  await sendLineNotify(error.config, false);
};

export { sendLineNotify, logWithTime, errorHandler };
