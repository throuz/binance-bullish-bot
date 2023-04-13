import envDev from "./env-dev.js";
import envProd from "./env-prod.js";

const envConfig = process.env.NODE_ENV === "production" ? envProd : envDev;

export default envConfig;
