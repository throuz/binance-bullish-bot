import { lineNotifyAPI } from "./web-services.js";

const sendLineNotify = async (msg) => {
  await lineNotifyAPI.post("/api/notify", { message: `\n${msg}` });
};

const log = (msg) => {
  console.log(`${msg} [${new Date().toLocaleString()}]`);
};

export { sendLineNotify, log };
