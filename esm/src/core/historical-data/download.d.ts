export declare function downloadHistoricalData(symbol: string, data: {
    interval: string;
    startDate: number | string | Date;
    endDate: number | string | Date;
}): Promise<{
    error: boolean;
    data: any;
}>;
