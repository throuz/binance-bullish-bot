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
import { MIN_WIN_RATE } from "../configs/trade-config.js";
import { getMarkPrices } from "./helpers.js";

export const getCombinedPriceData = async (results) => {
  const { closePrices } = await getMarkPrices();
  const trimmedPrices = closePrices.slice(-results.length);
  const combinedPriceData = [];
  for (let i = 0; i < trimmedPrices.length; i++) {
    combinedPriceData.push({
      price: trimmedPrices[i],
      nextPrice: trimmedPrices[i + 1],
      result: results[i]
    });
  }
  return combinedPriceData;
};

export const getWinRate = (convertedData) => {
  const lastData = convertedData.pop();
  const filteredByTypeData = convertedData.filter(
    (item) => item.type === lastData.type
  );
  const winTimes = filteredByTypeData.filter(
    (item) => item.nextPrice > item.price
  ).length;
  const totalTimes = filteredByTypeData.length;
  const winRate = winTimes / totalTimes;
  return winRate;
};

export const getIsWinRateEnough = (convertedData) => {
  const winRate = getWinRate(convertedData);
  return winRate > MIN_WIN_RATE;
};

export const smaSignal = async () => {
  const { closePrices } = await getMarkPrices();
  const results = sma({ period: 7, values: closePrices });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const type = (() => {
        if (price > result) {
          return "A";
        }
        if (price < result) {
          return "B";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "sma", signal: isWinRateEnough };
};

export const emaSignal = async () => {
  const { closePrices } = await getMarkPrices();
  const results = ema({ period: 9, values: closePrices });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const type = (() => {
        if (price > result) {
          return "A";
        }
        if (price < result) {
          return "B";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "ema", signal: isWinRateEnough };
};

export const wmaSignal = async () => {
  const { closePrices } = await getMarkPrices();
  const results = wma({ period: 9, values: closePrices });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const type = (() => {
        if (price > result) {
          return "A";
        }
        if (price < result) {
          return "B";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "wma", signal: isWinRateEnough };
};

export const wemaSignal = async () => {
  const { closePrices } = await getMarkPrices();
  const results = wema({ period: 9, values: closePrices });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const type = (() => {
        if (price > result) {
          return "A";
        }
        if (price < result) {
          return "B";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "wema", signal: isWinRateEnough };
};

export const macdSignal = async () => {
  const { closePrices } = await getMarkPrices();
  const results = macd({
    values: closePrices,
    SimpleMAOscillator: true,
    SimpleMASignal: true,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9
  });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const { MACD, signal, histogram } = result;
      const type = (() => {
        if (MACD < 0 && signal < 0 && histogram < 0) {
          return "A";
        }
        if (MACD < 0 && signal < 0 && histogram > 0) {
          return "B";
        }
        if (MACD > 0 && signal > 0 && histogram > 0) {
          return "C";
        }
        if (MACD > 0 && signal > 0 && histogram < 0) {
          return "D";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "macd", signal: isWinRateEnough };
};

export const rsiSignal = async () => {
  const { closePrices } = await getMarkPrices();
  const results = rsi({ period: 14, values: closePrices });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const type = (() => {
        if (result < 30) {
          return "A";
        }
        if (result > 30 && result < 50) {
          return "B";
        }
        if (result > 50 && result < 70) {
          return "C";
        }
        if (result > 70) {
          return "D";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "rsi", signal: isWinRateEnough };
};

export const bollingerbandsSignal = async () => {
  const { closePrices } = await getMarkPrices();
  const results = bollingerbands({
    period: 20,
    stdDev: 2,
    values: closePrices
  });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const { pb } = result;
      const type = (() => {
        if (pb < 0) {
          return "A";
        }
        if (pb > 0 && pb < 0.5) {
          return "B";
        }
        if (pb > 0.5 && pb < 1) {
          return "C";
        }
        if (pb > 1) {
          return "D";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "bollingerbands", signal: isWinRateEnough };
};

export const adxSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPrices();
  const results = adx({
    high: highPrices,
    low: lowPrices,
    close: closePrices,
    period: 14
  });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const { pdi, mdi } = result;
      const type = (() => {
        if (pdi > mdi) {
          return "A";
        }
        if (pdi < mdi) {
          return "B";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "adx", signal: isWinRateEnough };
};

export const rocSignal = async () => {
  const { closePrices } = await getMarkPrices();
  const results = roc({ period: 9, values: closePrices });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const type = (() => {
        if (result < -3) {
          return "A";
        }
        if (result > -3 && result < 0) {
          return "B";
        }
        if (result > 0 && result < 3) {
          return "C";
        }
        if (result > 3) {
          return "D";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "roc", signal: isWinRateEnough };
};

export const kstSignal = async () => {
  const { closePrices } = await getMarkPrices();
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
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const { kst, signal } = result;
      const type = (() => {
        if (kst < 0 && signal < 0 && kst < signal) {
          return "A";
        }
        if (kst < 0 && signal < 0 && kst > signal) {
          return "B";
        }
        if (kst > 0 && signal > 0 && kst < signal) {
          return "C";
        }
        if (kst > 0 && signal > 0 && kst > signal) {
          return "D";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "kst", signal: isWinRateEnough };
};

export const psarSignal = async () => {
  const { highPrices, lowPrices } = await getMarkPrices();
  const results = psar({
    step: 0.02,
    max: 0.2,
    high: highPrices,
    low: lowPrices
  });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const type = (() => {
        if (result > price) {
          return "A";
        }
        if (result < price) {
          return "B";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "psar", signal: isWinRateEnough };
};

export const stochasticSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPrices();
  const results = stochastic({
    period: 14,
    low: lowPrices,
    high: highPrices,
    close: closePrices,
    signalPeriod: 3
  });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const { k, d } = result;
      const type = (() => {
        if (k < 20 && d < 20) {
          return "A";
        }
        if (k > 20 && k < 50 && d > 20 && d < 50) {
          return "B";
        }
        if (k > 50 && k < 80 && d > 50 && d < 80) {
          return "C";
        }
        if (k > 80 && d > 80) {
          return "D";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "stochastic", signal: isWinRateEnough };
};

export const williamsrSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPrices();
  const results = williamsr({
    low: lowPrices,
    high: highPrices,
    close: closePrices,
    period: 14
  });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const type = (() => {
        if (result < -80) {
          return "A";
        }
        if (result > -80 && result < -50) {
          return "B";
        }
        if (result > -50 && result < -20) {
          return "C";
        }
        if (result > -20) {
          return "D";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "williamsr", signal: isWinRateEnough };
};

export const trixSignal = async () => {
  const { closePrices } = await getMarkPrices();
  const results = trix({ values: closePrices, period: 18 });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const type = (() => {
        if (result < -6) {
          return "A";
        }
        if (result > -6 && result < 0) {
          return "B";
        }
        if (result > 0 && result < 6) {
          return "C";
        }
        if (result > 6) {
          return "D";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "trix", signal: isWinRateEnough };
};

export const cciSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPrices();
  const results = cci({
    high: highPrices,
    low: lowPrices,
    close: closePrices,
    period: 20
  });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const type = (() => {
        if (result < -100) {
          return "A";
        }
        if (result > -100 && result < 0) {
          return "B";
        }
        if (result > 0 && result < 100) {
          return "C";
        }
        if (result > 100) {
          return "D";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "cci", signal: isWinRateEnough };
};

export const awesomeoscillatorSignal = async () => {
  const { highPrices, lowPrices } = await getMarkPrices();
  const results = awesomeoscillator({
    high: highPrices,
    low: lowPrices,
    fastPeriod: 5,
    slowPeriod: 34
  });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const type = (() => {
        if (result < -400) {
          return "A";
        }
        if (result > -400 && result < 0) {
          return "B";
        }
        if (result > 0 && result < 400) {
          return "C";
        }
        if (result > 400) {
          return "D";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "awesomeoscillator", signal: isWinRateEnough };
};

export const stochasticrsiSignal = async () => {
  const { closePrices } = await getMarkPrices();
  const results = stochasticrsi({
    values: closePrices,
    rsiPeriod: 14,
    stochasticPeriod: 14,
    kPeriod: 3,
    dPeriod: 3
  });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const { k, d } = result;
      const type = (() => {
        if (k < 20 && d < 20) {
          return "A";
        }
        if (k > 20 && k < 50 && d > 20 && d < 50) {
          return "B";
        }
        if (k > 50 && k < 80 && d > 50 && d < 80) {
          return "C";
        }
        if (k > 80 && d > 80) {
          return "D";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "stochasticrsi", signal: isWinRateEnough };
};

export const ichimokucloudSignal = async () => {
  const { highPrices, lowPrices } = await getMarkPrices();
  const results = ichimokucloud({
    high: highPrices,
    low: lowPrices,
    conversionPeriod: 9,
    basePeriod: 26,
    spanPeriod: 52,
    displacement: 26
  });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const { conversion, spanA, spanB } = result;
      const type = (() => {
        if (conversion > spanA && conversion > spanB) {
          return "A";
        }
        if (conversion < spanA && conversion < spanB) {
          return "B";
        }
        if (spanA > spanB && conversion < spanA && conversion > spanB) {
          return "C";
        }
        if (spanB > spanA && conversion < spanB && conversion > spanA) {
          return "D";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "ichimokucloud", signal: isWinRateEnough };
};

export const keltnerchannelsSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPrices();
  const results = keltnerchannels({
    maPeriod: 20,
    atrPeriod: 20,
    useSMA: false,
    multiplier: 1,
    high: highPrices,
    low: lowPrices,
    close: closePrices
  });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const { middle, upper, lower } = result;
      const type = (() => {
        if (price < lower) {
          return "A";
        }
        if (price > lower && price < middle) {
          return "B";
        }
        if (price > middle && price < upper) {
          return "C";
        }
        if (price > upper) {
          return "D";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "keltnerchannels", signal: isWinRateEnough };
};

export const chandelierexitSignal = async () => {
  const { highPrices, lowPrices, closePrices } = await getMarkPrices();
  const results = chandelierexit({
    period: 22,
    multiplier: 3,
    high: highPrices,
    low: lowPrices,
    close: closePrices
  });
  const combinedPriceData = await getCombinedPriceData(results);
  const convertedData = combinedPriceData.map(
    ({ price, nextPrice, result }) => {
      const { exitLong, exitShort } = result;
      const type = (() => {
        if (price > exitLong && price > exitShort) {
          return "A";
        }
        if (price < exitLong && price < exitShort) {
          return "B";
        }
        if (exitLong > exitShort && price < exitLong && price > exitShort) {
          return "C";
        }
        if (exitShort > exitLong && price < exitShort && price > exitLong) {
          return "D";
        }
        return "other";
      })();
      return { price, nextPrice, type };
    }
  );
  const isWinRateEnough = getIsWinRateEnough(convertedData);
  return { name: "chandelierexit", signal: isWinRateEnough };
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

export const getSignal = async () => {
  const signals = await getSignals();
  const trueSignals = signals.filter((item) => item.signal === true);
  const winRate = trueSignals.length / signals.length;
  return winRate > MIN_WIN_RATE;
};
