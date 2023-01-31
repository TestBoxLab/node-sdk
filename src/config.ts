import {ITestBoxTrial} from "./payloads";
import {Request, Response} from "express";
import TestBoxTrialRequest from "./trialRequest";

export enum TestboxConfigFramework {
    EXPRESS = "express",
    FASTIFY = "fastify",
}

export interface TestBoxConfig {
    productId?: string;
    framework?: TestboxConfigFramework;
}

export interface FrameworkDefinition {
    fulfill: (
        trial: ITestBoxTrial,
        resp?: Response
    ) => Response | undefined;
    fromRequest: (req: Request) => TestBoxTrialRequest;
}

const _testboxConfig: TestBoxConfig = {};

export function configureTestBox(config: TestBoxConfig) {
    _testboxConfig.framework = config.framework || TestboxConfigFramework.EXPRESS
    _testboxConfig.productId = config.productId;
}

export function getConfigItem<K extends keyof TestBoxConfig>(
    key: K,
    fallback?: TestBoxConfig[K]
): TestBoxConfig[K] {
    return _testboxConfig[key] || fallback;
}
