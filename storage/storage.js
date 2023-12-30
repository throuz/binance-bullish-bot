import { readFile, writeFile } from "node:fs/promises";

export const filePath = new URL("./storage.json", import.meta.url);

export const getStorageData = async (key) => {
  const contents = await readFile(filePath, { encoding: "utf8" });
  const storageData = JSON.parse(contents);
  if (key) {
    return storageData[key];
  }
  return storageData;
};

export const setStorageData = async (key, value) => {
  const storageData = await getStorageData();
  storageData[key] = value;
  await writeFile(filePath, JSON.stringify(storageData));
};
