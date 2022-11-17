export function onlyValidKeysInObject(
  obj: Object,
  allowedKeys: Set<string>
): boolean {
  const actualKeys = new Set(Object.keys(obj));
  const disallowedKeys = new Set(
    [...actualKeys].filter((x) => !allowedKeys.has(x))
  );
  return !(disallowedKeys.size > 0);
}

export function hasAllKeysInObject(
  obj: Object,
  keysRequired: Set<string>
): boolean {
  const actualKeys = new Set(Object.keys(obj));
  return Array.from(keysRequired).every((key) => actualKeys.has(key));
}
