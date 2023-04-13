import { envConfigDev, envConfigProd } from "./env-configs.js";

const envConfig =
  process.env.NODE_ENV === "production" ? envConfigProd : envConfigDev;

export default envConfig;
