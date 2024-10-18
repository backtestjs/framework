import { insertStrategy, updateStrategy, deleteStrategy, getAllStrategies } from "../../helpers/prisma-strategies";
import { StrategyMeta } from "../../../types/global";

const path = require("path");
import * as fs from "fs";

export async function scanStrategies(rootPath?: string) {
  // Get strategies
  let allStrategies = await getAllStrategies();
  if (allStrategies.error) return allStrategies;

  let strategies: StrategyMeta[] | null = typeof allStrategies.data === "string" ? null : allStrategies.data;
  if (!strategies?.length) {
    strategies = [];
  }

  let isJS = false;
  const doneActions = {} as { [key: string]: { action: string; error: boolean; message?: string } };
  const extension = path.extname(__filename);
  if (extension === ".js") isJS = true;

  const importPath = !!rootPath ? rootPath : isJS ? `./dist/src/strategies` : `./src/strategies`;
  const importResolvedPath = path.resolve(importPath);

  let files = fs.readdirSync(importResolvedPath);
  if (!files?.length) {
    return {
      error: true,
      data: `No files found to scan`,
    };
  }

  files = files.filter((file) => [".js", ".ts"].includes(path.extname(file)) && !file.endsWith(".d.ts"));
  const fileStrategies = files.map((file) => path.basename(file, path.extname(file)));

  for (const [index, strategyName] of fileStrategies.entries()) {
    const registeredStrategy = strategies.find(({ name }) => name === strategyName);
    const strategy = await import(path.join(importResolvedPath, files[index]));
    const strategyProperties = strategy.properties || {};

    const meta = {
      name: strategyName,
      params: strategyProperties.params || registeredStrategy?.params || [],
      dynamicParams: strategyProperties.dynamicParams || registeredStrategy?.dynamicParams || false,
      creationTime: registeredStrategy?.creationTime || new Date().getTime(),
      lastRunTime: registeredStrategy?.lastRunTime || 0,
    };

    if (!!registeredStrategy?.name) {
      const saveResults = await updateStrategy(meta);
      doneActions[strategyName] = { error: saveResults.error, action: "update" };
      const message = saveResults.error ? saveResults.data : undefined;
      message && (doneActions[strategyName].message = message);
    } else {
      const saveResults = await insertStrategy(meta);
      doneActions[strategyName] = { error: saveResults.error, action: "insert" };
      const message = saveResults.error ? saveResults.data : undefined;
      message && (doneActions[strategyName].message = message);
    }
  }

  for (const { name: strategyName } of strategies) {
    if (!fileStrategies.includes(strategyName)) {
      const saveResults = await deleteStrategy(strategyName);
      doneActions[strategyName] = { error: saveResults.error, action: "delete" };
      const message = saveResults.error ? saveResults.data : undefined;
      message && (doneActions[strategyName].message = message);
    }
  }

  return {
    error: false,
    data: doneActions,
  };
}
