import { TRADING_RATIOS_PERIOD } from "../configs/trade-config.js";
import {
  topLongShortAccountRatioAPI,
  topLongShortPositionRatioAPI,
  globalLongShortAccountRatioAPI
} from "./api.js";
import { nodeCache } from "./cache.js";
import { hexagrams, getRandomSixyao } from "./yi-jing.js";
import { getPNLPercent } from "./helpers.js";

// Open conditions

export const getIsAllTradingRatiosBullish = async () => {
  const symbol = nodeCache.get("symbol");
  const totalParams = { symbol, period: TRADING_RATIOS_PERIOD, limit: 1 };
  const results = await Promise.all([
    topLongShortAccountRatioAPI(totalParams),
    topLongShortPositionRatioAPI(totalParams),
    globalLongShortAccountRatioAPI(totalParams)
  ]);
  return results.every((result) => result[0].longShortRatio > 1);
};

export const getIsHexagramIndicateInvestmentPossible = () => {
  const randomSixyao = getRandomSixyao();
  const foundHexagram = hexagrams.find(
    (hexagram) => hexagram.sixyao === randomSixyao
  );
  return foundHexagram.result;
};

export const getIsOpenConditionsMet = async () => {
  const results = await Promise.all([
    getIsAllTradingRatiosBullish(),
    getIsHexagramIndicateInvestmentPossible
  ]);
  return results.every((result) => result);
};

// Close conditions

export const getIsNotAllTradingRatiosBullish = async () => {
  const isAllTradingRatiosBullish = await getIsAllTradingRatiosBullish();
  return !isAllTradingRatiosBullish;
};

export const getIsTakeProfitReached = async () => {
  const PNLPercent = await getPNLPercent();
  return PNLPercent > TAKE_PROFIT_PERCENT;
};

export const getIsStopLossReached = async () => {
  const PNLPercent = await getPNLPercent();
  return PNLPercent < STOP_LOSS_PERCENT;
};

export const getIsCloseConditionsMet = async () => {
  const results = await Promise.all([
    getIsNotAllTradingRatiosBullish(),
    getIsTakeProfitReached(),
    getIsStopLossReached()
  ]);
  return results.some((result) => result);
};
