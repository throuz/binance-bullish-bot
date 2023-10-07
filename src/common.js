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
    const { data, status } = error.response;
    await sendLineNotify("Response status code is outside the 2xx range");
    await sendLineNotify(`data: ${JSON.stringify(data)}`, false);
    await sendLineNotify(`status: ${status}`, false);
  } else if (error.request) {
    await sendLineNotify("No response was received");
    await sendLineNotify(`request: ${JSON.stringify(error.request)}`, false);
  } else {
    await sendLineNotify("Error occurred during request setup");
    await sendLineNotify(`message: ${message}`, false);
  }
  if (error.config) {
    const { method, baseURL, url, data } = error.config;
    await sendLineNotify(`method: ${method}`, false);
    await sendLineNotify(`baseURL: ${baseURL}`, false);
    await sendLineNotify(`url: ${url}`, false);
    await sendLineNotify(`data: ${data}`, false);
  }
};
