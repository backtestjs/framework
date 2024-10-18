import { StrategyMeta } from "../../../types/global";
export declare function scanStrategies(rootPath?: string): Promise<{
    error: boolean;
    data: string | StrategyMeta[];
} | {
    error: boolean;
    data: {
        [key: string]: {
            action: string;
            error: boolean;
            message?: string | undefined;
        };
    };
}>;
