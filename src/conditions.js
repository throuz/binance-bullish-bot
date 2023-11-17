import {
  MINIMUM_LEVERAGE,
  STOP_LOSS_PERCENT,
  TAKE_PROFIT_PERCENT,
  TRADING_RATIOS_PERIOD
} from "../configs/trade-config.js";
import {
  globalLongShortAccountRatioAPI,
  topLongShortAccountRatioAPI,
  topLongShortPositionRatioAPI
} from "./api.js";
import { nodeCache } from "./cache.js";
import { getMaxLeverage, getPNLPercent } from "./helpers.js";
import { getSignal } from "./signals.js";
import { getRandomSixyao, hexagrams } from "./yi-jing.js";

// Open conditions

export const getIsMaxLeverageEnough = async () => {
  const maxLeverage = await getMaxLeverage();
  return maxLeverage >= MINIMUM_LEVERAGE;
};

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
    getIsMaxLeverageEnough(),
    getIsAllTradingRatiosBullish(),
    getIsHexagramIndicateInvestmentPossible(),
    getSignal()
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
