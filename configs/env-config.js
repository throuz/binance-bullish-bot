import * as envConfigDev from "./env-config-dev.js";
import * as envConfigProd from "./env-config-prod.js";

const envConfig =
  process.env.NODE_ENV === "production" ? envConfigProd : envConfigDev;

const { API_KEY, SECRET_KEY, REST_BASEURL, LINE_NOTIFY_TOKEN } = envConfig;

export { API_KEY, LINE_NOTIFY_TOKEN, REST_BASEURL, SECRET_KEY };
