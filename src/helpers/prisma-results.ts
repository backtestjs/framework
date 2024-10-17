import { StrategyResult, GetStrategyResult, RunMetaData } from "../interfaces";
import { getCandles } from "./prisma-historical-data";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function insertResult(result: StrategyResult): Promise<{ error: boolean; data: string }> {
  try {
    // Create StrategyResult with historicalDataName (without allOrders and allWorths)
    const strategyResult = await prisma.strategyResult.create({
      data: {
        name: result.name,
        historicalDataName: result.historicalDataName,
        strategyName: result.strategyName,
        startTime: BigInt(result.startTime),
        endTime: BigInt(result.endTime),
        txFee: result.txFee,
        slippage: result.slippage,
        startingAmount: result.startingAmount,
        params: JSON.stringify(result.params),
      },
    });

    // Create runMetaData with StrategyResultId
    const runMetaData = await prisma.runMetaData.create({
      data: {
        ...result.runMetaData,
        highestAmountDate: BigInt(result.runMetaData.highestAmountDate),
        lowestAmountDate: BigInt(result.runMetaData.lowestAmountDate),
        startingAssetAmountDate: BigInt(result.runMetaData.startingAssetAmountDate),
        endingAssetAmountDate: BigInt(result.runMetaData.endingAssetAmountDate),
        highestAssetAmountDate: BigInt(result.runMetaData.highestAssetAmountDate),
        lowestAssetAmountDate: BigInt(result.runMetaData.lowestAssetAmountDate),
        StrategyResultId: strategyResult.id,
      },
    });

    const allOrders = result.allOrders.map((order) => ({
      ...order,
      note: order.note || "",
      time: BigInt(order.time),
    }));

    const allWorths = result.allWorths.map((worth) => ({
      ...worth,
      time: BigInt(worth.time),
    }));

    // Update StrategyResult with RunMetaDataId, allOrders, and allWorths
    await prisma.strategyResult.update({
      where: { id: strategyResult.id },
      data: {
        runMetaDataId: runMetaData.id,
        allOrders: {
          create: allOrders,
        },
        allWorths: {
          create: allWorths,
        },
      },
    });
    return { error: false, data: `Successfully inserted result: ${result.name}` };
  } catch (error) {
    return { error: true, data: `Problem inserting result with error: ${error}` };
  }
}

export async function getAllStrategyResults(): Promise<{ error: boolean; data: string | GetStrategyResult[] }> {
  try {
    // Get all the strategies names
    const strategyResults = await prisma.strategyResult.findMany({
      select: { name: true },
    });

    const results: GetStrategyResult[] = await Promise.all(
      strategyResults.map(async (result) => (await getResult(result.name))?.data as GetStrategyResult)
    );
    return { error: false, data: results };
  } catch (error) {
    return { error: true, data: `Problem getting results with error: ${error}` };
  }
}

export async function getAllStrategyResultNames(): Promise<{ error: boolean; data: string | string[] }> {
  try {
    // Get all the strategies names
    const strategyResults = await prisma.strategyResult.findMany({
      select: { name: true },
    });

    const names = strategyResults.map((result) => result.name);
    return { error: false, data: names };
  } catch (error) {
    return { error: true, data: `Problem getting results with error: ${error}` };
  }
}

export async function getResult(name: string): Promise<{ error: boolean; data: GetStrategyResult | string }> {
  try {
    // Get StrategyResult by name
    const strategyResult = await prisma.strategyResult.findUnique({
      where: { name },
      include: {
        runMetaData: true,
        allOrders: true,
        allWorths: true,
      },
    });

    if (!strategyResult) {
      return { error: true, data: `StrategyResult with name ${name} does not exist.` };
    }

    // Get Candles using historicalDataName
    const candlesResult = await getCandles(strategyResult.historicalDataName);

    if (candlesResult.error || typeof candlesResult.data === "string") {
      return {
        error: true,
        data: `Problem fetching candles with historicalDataName: ${strategyResult.historicalDataName}`,
      };
    }

    // Filter candles based on StrategyResult's startTime and endTime
    let filteredCandles = candlesResult.data.candles.filter(
      (candle) =>
        candle.openTime >= Number(strategyResult.startTime) && candle.closeTime <= Number(strategyResult.endTime)
    );

    // Convert BigInt to Number in allOrders and allWorths
    const allOrders = strategyResult.allOrders.map((order) => {
      const { id, StrategyResultId, ...rest } = order;
      return {
        ...rest,
        time: Number(rest.time),
      };
    });
    const allWorths = strategyResult.allWorths.map((worth) => {
      const { id, StrategyResultId, ...rest } = worth;
      return {
        ...rest,
        time: Number(rest.time),
      };
    });

    // Convert runMetaData
    if (strategyResult.runMetaData) {
      const { id, StrategyResultId, ...runMetaDataRest } = strategyResult.runMetaData;
      const runMetaData: RunMetaData = {
        ...runMetaDataRest,
        highestAmountDate: Number(runMetaDataRest.highestAmountDate),
        lowestAmountDate: Number(runMetaDataRest.lowestAmountDate),
        highestAssetAmountDate: Number(runMetaDataRest.highestAssetAmountDate),
        lowestAssetAmountDate: Number(runMetaDataRest.lowestAssetAmountDate),
        startingAssetAmountDate: Number(runMetaDataRest.startingAssetAmountDate),
        endingAssetAmountDate: Number(runMetaDataRest.endingAssetAmountDate),
      };

      // Form the GetStrategyResult object
      const { id: strategyResultId, ...strategyResultRest } = strategyResult;
      const getResult: GetStrategyResult = {
        ...strategyResultRest,
        startTime: Number(strategyResultRest.startTime),
        endTime: Number(strategyResultRest.endTime),
        params: JSON.parse(strategyResultRest.params),
        candleMetaData: candlesResult.data.metaCandles[0],
        candles: filteredCandles,
        allOrders,
        allWorths,
        runMetaData,
      };

      return { error: false, data: getResult };
    } else {
      return { error: true, data: "runMetaData is null" };
    }
  } catch (error) {
    return { error: true, data: `Failed to get result with error ${error}` };
  }
}

export async function deleteStrategyResult(name: string): Promise<{ error: boolean; data: string }> {
  try {
    // Find the strategy result
    const strategyResult = await prisma.strategyResult.findUnique({
      where: { name },
    });

    if (!strategyResult) {
      return { error: false, data: `StrategyResult with name ${name} does not exist.` };
    }

    const strategyResultId = strategyResult.id;

    try {
      // Delete related Order records
      await prisma.order.deleteMany({
        where: {
          StrategyResultId: strategyResultId,
        },
      });
    } catch (error) {
      return {
        error: true,
        data: `Failed to delete related Order records for StrategyResult with name: ${name}. Error: ${error}`,
      };
    }

    try {
      // Delete related Worth records
      await prisma.worth.deleteMany({
        where: {
          StrategyResultId: strategyResultId,
        },
      });
    } catch (error) {
      return {
        error: true,
        data: `Failed to delete related Worth records for StrategyResult with name: ${name}. Error: ${error}`,
      };
    }

    try {
      // Delete related RunMetaData records
      await prisma.runMetaData.deleteMany({
        where: {
          StrategyResultId: strategyResultId,
        },
      });
    } catch (error) {
      return {
        error: true,
        data: `Failed to delete related RunMetaData records for StrategyResult with name: ${name}. Error: ${error}`,
      };
    }

    // Delete the strategy result
    await prisma.strategyResult.delete({
      where: { id: strategyResultId },
    });

    // Return successfully deleted
    return { error: false, data: `Successfully deleted ${name}` };
  } catch (error) {
    return { error: true, data: `Failed to delete StrategyResult with name: ${name}. Error: ${error}` };
  }
}
