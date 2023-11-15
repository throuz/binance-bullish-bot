import {
  sma,
  ema,
  wma,
  wema,
  macd,
  rsi,
  bollingerbands,
  adx,
  roc,
  kst,
  psar,
  stochastic,
  williamsr,
  trix,
  cci,
  awesomeoscillator,
  stochasticrsi,
  ichimokucloud,
  keltnerchannels,
  chandelierexit
} from "technicalindicators";
import { getMarkPriceKlineData } from "./helpers.js";

export const smaSignal = async () => {
  const { closePrices } = await getMarkPriceKlineData();
  const shortTermResults = sma({ period: 50, values: closePrices });
  const longTermResults = sma({ period: 200, values: closePrices });
  const lastShortTermResult = shortTermResults[shortTermResults.length - 1];
  const lastLongTermResult = longTermResults[longTermResults.length - 1];
  return lastShortTermResult > lastLongTermResult;
};

export const emaSignal = async () => {
  const { closePrices } = await getMarkPriceKlineData();
  const shortTermResults = ema({ period: 50, values: closePrices });
  const longTermResults = ema({ period: 200, values: closePrices });
  const lastShortTermResult = shortTermResults[shortTermResults.length - 1];
  const lastLongTermResult = longTermResults[longTermResults.length - 1];
  return lastShortTermResult > lastLongTermResult;
};

export const wmaSignal = async () => {
  const { closePrices } = await getMarkPriceKlineData();
  const shortTermResults = wma({ period: 50, values: closePrices });
  const longTermResults = wma({ period: 200, values: closePrices });
  const lastShortTermResult = shortTermResults[shortTermResults.length - 1];
  const lastLongTermResult = longTermResults[longTermResults.length - 1];
  return lastShortTermResult > lastLongTermResult;
};

export const wemaSignal = async () => {
  const { closePrices } = await getMarkPriceKlineData();
  const shortTermResults = wema({ period: 50, values: closePrices });
  const longTermResults = wema({ period: 200, values: closePrices });
  const lastShortTermResult = shortTermResults[shortTermResults.length - 1];
  const lastLongTermResult = longTermResults[longTermResults.length - 1];
  return lastShortTermResult > lastLongTermResult;
};

export const macdSignal = async () => {
  const { closePrices } = await getMarkPriceKlineData();
  const results = macd({
    values: closePrices,
    SimpleMAOscillator: true,
    SimpleMASignal: true,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9
  });
  const lastResult = results[results.length - 1];
  return lastResult.histogram > 0;
};

export const rsiSignal = async () => {
  const { closePrices } = await getMarkPriceKlineData();
  const results = rsi({ period: 14, values: closePrices });
  const lastResult = results[results.length - 1];
  return lastResult < 30;
};

export const bollingerbandsSignal = async () => {
  const { closePrices } = await getMarkPriceKlineData();
  const results = bollingerbands({
    period: 20,
    stdDev: 2,
    values: closePrices
  });
  const lastResult = results[results.length - 1];
  return lastResult.pb < 0;
};

export const adxSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPriceKlineData();
  const results = adx({
    high: highPrices,
    low: lowPrices,
    close: closePrices,
    period: 14
  });
  const lastResult = results[results.length - 1];
  return lastResult.pdi > lastResult.mdi;
};

export const rocSignal = async () => {
  const { closePrices } = await getMarkPriceKlineData();
  const results = roc({ period: 9, values: closePrices });
  const lastResult = results[results.length - 1];
  return lastResult > 0;
};

export const kstSignal = async () => {
  const { closePrices } = await getMarkPriceKlineData();
  const results = kst({
    ROCPer1: 10,
    ROCPer2: 15,
    ROCPer3: 20,
    ROCPer4: 30,
    SMAROCPer1: 10,
    SMAROCPer2: 10,
    SMAROCPer3: 10,
    SMAROCPer4: 15,
    signalPeriod: 9,
    values: closePrices
  });
  const lastResult = results[results.length - 1];
  return lastResult.kst > lastResult.signal;
};

export const psarSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPriceKlineData();
  const results = psar({
    step: 0.02,
    max: 0.2,
    high: highPrices,
    low: lowPrices
  });
  const lastResult = results[results.length - 1];
  const lastclosePrice = closePrices[closePrices.length - 1];
  return lastResult > lastclosePrice;
};

export const stochasticSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPriceKlineData();
  const results = stochastic({
    period: 14,
    low: lowPrices,
    high: highPrices,
    close: closePrices,
    signalPeriod: 3
  });
  const lastResult = results[results.length - 1];
  return lastResult.k > lastResult.d;
};

export const williamsrSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPriceKlineData();
  const results = williamsr({
    low: lowPrices,
    high: highPrices,
    close: closePrices,
    period: 14
  });
  const lastResult = results[results.length - 1];
  return lastResult < 20;
};

export const trixSignal = async () => {
  const { closePrices } = await getMarkPriceKlineData();
  const results = trix({ values: closePrices, period: 15 });
  const lastResult = results[results.length - 1];
  return lastResult > 0;
};

export const cciSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPriceKlineData();
  const results = cci({
    high: highPrices,
    low: lowPrices,
    close: closePrices,
    period: 20
  });
  const lastResult = results[results.length - 1];
  const maxCci = Math.max(...results);
  const minCci = Math.min(...results);
  const signalCci = (maxCci - minCci) * 0.2 + minCci;
  return lastResult < signalCci;
};

export const awesomeoscillatorSignal = async () => {
  const { highPrices, lowPrices } = await getMarkPriceKlineData();
  const results = awesomeoscillator({
    high: highPrices,
    low: lowPrices,
    fastPeriod: 5,
    slowPeriod: 34
  });
  const lastResult = results[results.length - 1];
  return lastResult > 0;
};

export const stochasticrsiSignal = async () => {
  const { closePrices } = await getMarkPriceKlineData();
  const results = stochasticrsi({
    values: closePrices,
    rsiPeriod: 14,
    stochasticPeriod: 14,
    kPeriod: 3,
    dPeriod: 3
  });
  const lastResult = results[results.length - 1];
  const { stochRSI, k, d } = lastResult;
  return stochRSI < 20 && k > d;
};

export const ichimokucloudSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPriceKlineData();
  const results = ichimokucloud({
    high: highPrices,
    low: lowPrices,
    conversionPeriod: 9,
    basePeriod: 26,
    spanPeriod: 52,
    displacement: 26
  });
  const lastResult = results[results.length - 1];
  const lastclosePrice = closePrices[closePrices.length - 1];
  const { conversion, base, spanA, spanB } = lastResult;
  return (
    lastclosePrice > conversion &&
    lastclosePrice > base &&
    lastclosePrice > spanA &&
    lastclosePrice > spanB
  );
};

export const keltnerchannelsSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPriceKlineData();
  const results = keltnerchannels({
    maPeriod: 20,
    atrPeriod: 20,
    useSMA: false,
    multiplier: 2,
    high: highPrices,
    low: lowPrices,
    close: closePrices
  });
  const lastResult = results[results.length - 1];
  const lastclosePrice = closePrices[closePrices.length - 1];
  return lastclosePrice > lastResult.upper;
};

export const chandelierexitSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPriceKlineData();
  const results = chandelierexit({
    period: 22,
    multiplier: 3,
    high: highPrices,
    low: lowPrices,
    close: closePrices
  });
  const lastResult = results[results.length - 1];
  const lastclosePrice = closePrices[closePrices.length - 1];
  return lastclosePrice > lastResult.exitLong;
};

export const getSignal = async () => {
  const promiseArray = [
    smaSignal(),
    emaSignal(),
    wmaSignal(),
    wemaSignal(),
    macdSignal(),
    rsiSignal(),
    bollingerbandsSignal(),
    adxSignal(),
    rocSignal(),
    kstSignal(),
    psarSignal(),
    stochasticSignal(),
    williamsrSignal(),
    trixSignal(),
    cciSignal(),
    awesomeoscillatorSignal(),
    stochasticrsiSignal(),
    ichimokucloudSignal(),
    keltnerchannelsSignal(),
    chandelierexitSignal()
  ];
  const signalArray = await Promise.all(promiseArray);
  const trueSignalArray = signalArray.filter((signal) => signal === true);
  const falseSignalArray = signalArray.filter((signal) => signal === false);
  return trueSignalArray.length > falseSignalArray.length;
};
