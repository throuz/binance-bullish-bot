import { AsyncLocalStorage } from "node:async_hooks";

export const asyncLocalStorage = new AsyncLocalStorage();

export const getSymbol = () => {
  const store = asyncLocalStorage.getStore();
  return store.symbol;
};
