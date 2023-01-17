export enum TestboxConfigFramework {
  EXPRESS = "express",
  FASTIFY = "fastify",
}
export interface TestBoxConfig {
  productId: string;
  framework?: TestboxConfigFramework;
}

let _testboxConfig = undefined;

export function configureTestBox(config: TestBoxConfig) {
  _testboxConfig = {
    framework: TestboxConfigFramework.EXPRESS,
    ...config,
  };
}

export function getConfigItem<K extends keyof TestBoxConfig>(
  key: K,
  fallback?: TestBoxConfig[K]
): TestBoxConfig[K] {
  if (_testboxConfig) {
    return _testboxConfig[key] || fallback;
  }
  return fallback;
}
