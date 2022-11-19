export interface TestBoxConfig {
  productId: string;
}

let _testboxConfig = undefined;

export function configureTestBox(config: TestBoxConfig) {
  _testboxConfig = config;
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
