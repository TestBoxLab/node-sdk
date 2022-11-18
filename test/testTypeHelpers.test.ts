import * as typeHelpers from "../src/typeHelpers";

describe("only valid keys in object", () => {
  test("an object with extra keys", () => {
    const anObject = {
      hello: "world",
      "a bad key": "a very bad key",
      "a good key": "a very good key",
    };

    expect(
      typeHelpers.onlyValidKeysInObject(anObject, new Set(["hello"]))
    ).toBeFalsy();
  });

  test("an object with no extra keys", () => {
    const anObject = {
      hello: "world",
      "a good key": "a very good key",
    };

    expect(
      typeHelpers.onlyValidKeysInObject(
        anObject,
        new Set(["hello", "a good key"])
      )
    ).toBeTruthy();
  });

  test("an object with missing keys", () => {
    const anObject = {
      "a good key": "a very good key",
    };

    expect(
      typeHelpers.onlyValidKeysInObject(
        anObject,
        new Set(["hello", "a good key"])
      )
    ).toBeTruthy();
  });
});

describe("has all keys in object", () => {
  test("a truthy result", () => {
    const anObject = {
      hello: "world",
      "a good key": "a very good key",
    };

    expect(
      typeHelpers.hasAllKeysInObject(anObject, new Set(["hello", "a good key"]))
    ).toBeTruthy();
  });

  test("a falsey result", () => {
    const anObject = {
      "a good key": "a very good key",
    };

    expect(
      typeHelpers.hasAllKeysInObject(anObject, new Set(["hello", "a good key"]))
    ).toBeFalsy();
  });

  test("another falsey scenario", () => {
    const anObject = {
      "a bad key": "a very bad key",
    };

    expect(
      typeHelpers.hasAllKeysInObject(anObject, new Set(["hello", "a good key"]))
    ).toBeFalsy();
  });
});
