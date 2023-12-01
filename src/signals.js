import { readFile, writeFile } from "node:fs/promises";
import {
  adx,
  awesomeoscillator,
  bollingerbands,
  cci,
  chandelierexit,
  ema,
  ichimokucloud,
  keltnerchannels,
  kst,
  macd,
  psar,
  roc,
  rsi,
  sma,
  stochastic,
  stochasticrsi,
  trix,
  wema,
  williamsr,
  wma
} from "technicalindicators";
import { nodeCache } from "./cache.js";
import { getMarkPrices } from "./helpers.js";

export const smaSignal = async () => {
  const { closePrices } = await getMarkPrices("1d");
  const results = sma({ period: 7, values: closePrices });
  const lastResult = results[results.length - 1];
  const secondLastResult = results[results.length - 2];
  const lastClosePrice = closePrices[closePrices.length - 1];
  const sencondLastClosePrice = closePrices[closePrices.length - 2];
  return {
    name: "sma",
    signal:
      sencondLastClosePrice < secondLastResult && lastClosePrice > lastResult
  };
};

export const emaSignal = async () => {
  const { closePrices } = await getMarkPrices("1d");
  const results = ema({ period: 9, values: closePrices });
  const lastResult = results[results.length - 1];
  const secondLastResult = results[results.length - 2];
  const lastClosePrice = closePrices[closePrices.length - 1];
  const sencondLastClosePrice = closePrices[closePrices.length - 2];
  return {
    name: "ema",
    signal:
      sencondLastClosePrice < secondLastResult && lastClosePrice > lastResult
  };
};

export const wmaSignal = async () => {
  const { closePrices } = await getMarkPrices("1d");
  const results = wma({ period: 9, values: closePrices });
  const lastResult = results[results.length - 1];
  const secondLastResult = results[results.length - 2];
  const lastClosePrice = closePrices[closePrices.length - 1];
  const sencondLastClosePrice = closePrices[closePrices.length - 2];
  return {
    name: "wma",
    signal:
      sencondLastClosePrice < secondLastResult && lastClosePrice > lastResult
  };
};

export const wemaSignal = async () => {
  const { closePrices } = await getMarkPrices("1d");
  const results = wema({ period: 9, values: closePrices });
  const lastResult = results[results.length - 1];
  const secondLastResult = results[results.length - 2];
  const lastClosePrice = closePrices[closePrices.length - 1];
  const sencondLastClosePrice = closePrices[closePrices.length - 2];
  return {
    name: "wema",
    signal:
      sencondLastClosePrice < secondLastResult && lastClosePrice > lastResult
  };
};

export const macdSignal = async () => {
  const { closePrices } = await getMarkPrices("1d");
  const results = macd({
    values: closePrices,
    SimpleMAOscillator: true,
    SimpleMASignal: true,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9
  });
  const lastResult = results[results.length - 1];
  const secondlLastResult = results[results.length - 2];
  const { MACD, signal, histogram } = lastResult;
  return {
    name: "macd",
    signal:
      MACD < 0 &&
      signal < 0 &&
      histogram > 0 &&
      histogram > secondlLastResult.histogram
  };
};

export const rsiSignal = async () => {
  const { closePrices } = await getMarkPrices("1h");
  const results = rsi({ period: 14, values: closePrices });
  const lastResult = results[results.length - 1];
  return { name: "rsi", signal: lastResult > 50 };
};

export const bollingerbandsSignal = async () => {
  const { closePrices } = await getMarkPrices("1h");
  const results = bollingerbands({
    period: 20,
    stdDev: 2,
    values: closePrices
  });
  const lastResult = results[results.length - 1];
  return { name: "bollingerbands", signal: lastResult.pb > 0.5 };
};

export const adxSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPrices("1d");
  const results = adx({
    high: highPrices,
    low: lowPrices,
    close: closePrices,
    period: 14
  });
  const lastResult = results[results.length - 1];
  return {
    name: "adx",
    signal: lastResult.pdi > lastResult.mdi && lastResult.adx > 40
  };
};

export const rocSignal = async () => {
  const { closePrices } = await getMarkPrices("1d");
  const results = roc({ period: 9, values: closePrices });
  const lastResult = results[results.length - 1];
  const secondLastResult = results[results.length - 2];
  return {
    name: "roc",
    signal: lastResult < -3 && lastResult > secondLastResult
  };
};

export const kstSignal = async () => {
  const { closePrices } = await getMarkPrices("1d");
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
  const secondLastResult = results[results.length - 2];
  return {
    name: "kst",
    signal:
      lastResult.kst < 0 &&
      lastResult.signal < 0 &&
      lastResult.kst > lastResult.signal &&
      lastResult.kst > secondLastResult.kst &&
      lastResult.signal > secondLastResult.signal
  };
};

export const psarSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPrices("1d");
  const results = psar({
    step: 0.02,
    max: 0.2,
    high: highPrices,
    low: lowPrices
  });
  const lastResult = results[results.length - 1];
  const lastclosePrice = closePrices[closePrices.length - 1];
  return { name: "psar", signal: lastclosePrice > lastResult };
};

export const stochasticSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPrices("1d");
  const results = stochastic({
    period: 14,
    low: lowPrices,
    high: highPrices,
    close: closePrices,
    signalPeriod: 3
  });
  const lastResult = results[results.length - 1];
  return { name: "stochastic", signal: lastResult.k > 95 };
};

export const williamsrSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPrices("1d");
  const results = williamsr({
    low: lowPrices,
    high: highPrices,
    close: closePrices,
    period: 14
  });
  const lastResult = results[results.length - 1];
  return { name: "williamsr", signal: lastResult < -5 };
};

export const trixSignal = async () => {
  const { closePrices } = await getMarkPrices("1d");
  const results = trix({ values: closePrices, period: 18 });
  const lastResult = results[results.length - 1];
  const secondLastResult = results[results.length - 2];
  return {
    name: "trix",
    signal:
      lastResult < 0 && secondLastResult < 0 && lastResult > secondLastResult
  };
};

export const cciSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPrices("1h");
  const results = cci({
    high: highPrices,
    low: lowPrices,
    close: closePrices,
    period: 20
  });
  const lastResult = results[results.length - 1];
  return { name: "cci", signal: lastResult > 0 };
};

export const awesomeoscillatorSignal = async () => {
  const { highPrices, lowPrices } = await getMarkPrices("1d");
  const results = awesomeoscillator({
    high: highPrices,
    low: lowPrices,
    fastPeriod: 5,
    slowPeriod: 34
  });
  const lastResult = results[results.length - 1];
  const secondLastResult = results[results.length - 2];
  return {
    name: "awesomeoscillator",
    signal: secondLastResult < 0 && lastResult > 0
  };
};

export const stochasticrsiSignal = async () => {
  const { closePrices } = await getMarkPrices("1d");
  const results = stochasticrsi({
    values: closePrices,
    rsiPeriod: 14,
    stochasticPeriod: 14,
    kPeriod: 3,
    dPeriod: 3
  });
  const lastResult = results[results.length - 1];
  return { name: "stochasticrsi", signal: lastResult.k > 95 };
};

export const ichimokucloudSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPrices("1h");
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
  const { conversion, base } = lastResult;
  return {
    name: "ichimokucloud",
    signal: lastclosePrice > conversion && lastclosePrice > base
  };
};

export const keltnerchannelsSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPrices("1h");
  const results = keltnerchannels({
    maPeriod: 20,
    atrPeriod: 20,
    useSMA: false,
    multiplier: 1,
    high: highPrices,
    low: lowPrices,
    close: closePrices
  });
  const lastResult = results[results.length - 1];
  const secondLastResult = results[results.length - 2];
  const lastclosePrice = closePrices[closePrices.length - 1];
  return {
    name: "keltnerchannels",
    signal:
      lastResult.middle > secondLastResult.middle &&
      lastclosePrice > lastResult.middle
  };
};

export const chandelierexitSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPrices("1h");
  const results = chandelierexit({
    period: 22,
    multiplier: 3,
    high: highPrices,
    low: lowPrices,
    close: closePrices
  });
  const lastResult = results[results.length - 1];
  const lastclosePrice = closePrices[closePrices.length - 1];
  return {
    name: "chandelierexit",
    signal: lastclosePrice > lastResult.exitShort
  };
};

export const signalFunctionArray = [
  smaSignal,
  emaSignal,
  wmaSignal,
  wemaSignal,
  macdSignal,
  rsiSignal,
  bollingerbandsSignal,
  adxSignal,
  rocSignal,
  kstSignal,
  psarSignal,
  stochasticSignal,
  williamsrSignal,
  trixSignal,
  cciSignal,
  awesomeoscillatorSignal,
  stochasticrsiSignal,
  ichimokucloudSignal,
  keltnerchannelsSignal,
  chandelierexitSignal
];

export const getSignals = async () => {
  const signalPromiseArray = signalFunctionArray.map((func) => func());
  const signals = await Promise.all(signalPromiseArray);
  return signals;
};

export const getTrueSignals = async () => {
  const signals = await getSignals();
  const trueSignals = signals.filter((item) => item.signal === true);
  return trueSignals;
};

export const getFalseSignals = async () => {
  const signals = await getSignals();
  const falseSignals = signals.filter((item) => item.signal === false);
  return falseSignals;
};

export const signalsJsonPath = new URL("../signals.json", import.meta.url);

export const readSignalsJson = async () => {
  const contents = await readFile(signalsJsonPath, { encoding: "utf8" });
  const parsedContents = JSON.parse(contents);
  return parsedContents;
};

export const addTradesInSignalsJson = async () => {
  const signalsJsonData = await readSignalsJson();
  const trueSignals = await getTrueSignals();
  const trueSignalNames = trueSignals.map((item) => item.name);
  nodeCache.set("trueSignalNames", trueSignalNames, 0);
  for (const name of trueSignalNames) {
    const foundIndex = signalsJsonData.findIndex((item) => item.name === name);
    signalsJsonData[foundIndex].trades++;
  }
  await writeFile(signalsJsonPath, JSON.stringify(signalsJsonData));
};

export const addWinsInSignalsJson = async () => {
  if (nodeCache.has("trueSignalNames")) {
    const signalsJsonData = await readSignalsJson();
    const trueSignalNames = nodeCache.get("trueSignalNames");
    for (const name of trueSignalNames) {
      const foundIndex = signalsJsonData.findIndex(
        (item) => item.name === name
      );
      signalsJsonData[foundIndex].wins++;
    }
    await writeFile(signalsJsonPath, JSON.stringify(signalsJsonData));
  }
};

export const getSignal = async () => {
  const trueSignals = await getTrueSignals();
  const trueSignalNames = trueSignals.map((item) => item.name);
  const signalsJsonData = await readSignalsJson();
  const filteredSignalsJsonData = signalsJsonData.filter((item) =>
    trueSignalNames.includes(item.name)
  );
  const scores = filteredSignalsJsonData.map((item) => item.wins / item.trades);
  const totalScore = scores.reduce((partialSum, a) => partialSum + a, 0);
  const fullScore = signalFunctionArray.length * 0.5;
  return totalScore / fullScore > 0.5;
};
