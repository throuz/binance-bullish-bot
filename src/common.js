import { lineNotifyAPI } from "./web-services.js";

const sendLineNotify = async (msg) => {
  await lineNotifyAPI.post("/api/notify", { message: msg });
  logWithTime(msg);
};

const logWithTime = (msg) => {
  console.log(`${msg} [${new Date().toLocaleString()}]`);
};

const errorHandler = async (error) => {
  if (error.response) {
    await sendLineNotify("Response status code is outside the 2xx range");
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    await sendLineNotify("No response was received");
    console.log(error.request);
  } else {
    await sendLineNotify("Error occurred during request setup.");
    console.log("Error", error.message);
  }
  console.log(error.config);
};

export { sendLineNotify, logWithTime, errorHandler };
