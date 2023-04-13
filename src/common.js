import { lineNotifyAPI } from "./web-services.js";

const sendLineNotify = async (msg) => {
  await lineNotifyAPI.post("/api/notify", { message: msg });
};

const logWithTime = (msg) => {
  console.log(`${msg} [${new Date().toLocaleString()}]`);
};

export { sendLineNotify, logWithTime };
