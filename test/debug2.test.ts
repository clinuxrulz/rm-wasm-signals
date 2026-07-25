import { describe, it, expect } from "vitest";
import { init } from "../src/index.js";

describe("debug", () => {
  it("all tests pass through real init", async () => {
    const { createSignal, createMemo, createEffect, flush, batch } = await init();
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const sum = createMemo(() => a() + b());
    expect(sum()).toBe(3);
    setA(10);
    flush();
    expect(sum()).toBe(12);
  });
});