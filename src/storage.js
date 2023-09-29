import { AsyncLocalStorage } from "node:async_hooks";

const asyncLocalStorage = new AsyncLocalStorage();

const getSymbol = () => {
  const store = asyncLocalStorage.getStore();
  return store.symbol;
};

export { asyncLocalStorage, getSymbol };
