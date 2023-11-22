import { lineNotifyAPI } from "./web-services.js";

export const sendLineNotify = async (msg, isLogWithTime = true) => {
  if (isLogWithTime) {
    logWithTime(msg);
  } else {
    console.log(msg);
  }
  await lineNotifyAPI.post("/api/notify", { message: msg });
};

export const logWithTime = (msg) => {
  console.log(`${msg} [${new Date().toLocaleString()}]`);
};

export const stringifySafe = (obj) => {
  const seen = new Set();
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular Reference]";
      }
      seen.add(value);
    }
    return value;
  });
};

export const errorHandler = async (error) => {
  if (error.response && error.response.data.code === -1021) {
    await sendLineNotify(error.response.data.msg);
    return;
  }
  if (error.response) {
    const { data, status } = error.response;
    await sendLineNotify("Response status code is outside the 2xx range");
    await sendLineNotify(`data: ${JSON.stringify(data)}`, false);
    await sendLineNotify(`status: ${status}`, false);
  } else if (error.request) {
    await sendLineNotify("No response was received");
    await sendLineNotify(`request: ${stringifySafe(error.request)}`, false);
  } else {
    await sendLineNotify("Error occurred during request setup");
    await sendLineNotify(`message: ${error.message}`, false);
  }
  if (error.config) {
    const { method, baseURL, url, data } = error.config;
    await sendLineNotify(`method: ${method}`, false);
    await sendLineNotify(`baseURL: ${baseURL}`, false);
    await sendLineNotify(`url: ${url}`, false);
    await sendLineNotify(`data: ${data}`, false);
  }
};
