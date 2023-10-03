import { lineNotifyAPI } from "./web-services.js";

export const sendLineNotify = async (msg, isLogWithTime = true) => {
  await lineNotifyAPI.post("/api/notify", { message: msg });
  if (isLogWithTime) {
    logWithTime(msg);
  } else {
    console.log(msg);
  }
};

export const logWithTime = (msg) => {
  console.log(`${msg} [${new Date().toLocaleString()}]`);
};

export const errorHandler = async (error) => {
  if (error.response) {
    await sendLineNotify("Response status code is outside the 2xx range");
    await sendLineNotify(
      `error.response.data: ${JSON.stringify(error.response.data)}`,
      false
    );
    await sendLineNotify(
      `error.response.status: ${JSON.stringify(error.response.status)}`,
      false
    );
    await sendLineNotify(
      `error.response.headers: ${JSON.stringify(error.response.headers)}`,
      false
    );
  } else if (error.request) {
    await sendLineNotify("No response was received");
    await sendLineNotify(
      `error.request: ${JSON.stringify(error.request)}`,
      false
    );
  } else {
    await sendLineNotify("Error occurred during request setup");
    await sendLineNotify(
      `error.message: ${JSON.stringify(error.message)}`,
      false
    );
  }
  await sendLineNotify(`error.config: ${JSON.stringify(error.config)}`, false);
};
