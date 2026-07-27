import { describe, it, expect } from "vitest";
import { init } from "../src/index.js";

describe("rm-wasm-signals", () => {
  it("createSignal stores and retrieves a value", async () => {
    const { createSignal } = await init();
    const [count] = createSignal(42);
    expect(count()).toBe(42);
  });

  it("setter updates the value", async () => {
    const { createSignal, flush } = await init();
    const [count, setCount] = createSignal(0);
    setCount(99);
    flush();
    expect(count()).toBe(99);
  });

  it("createMemo derives from a signal", async () => {
    const { createSignal, createMemo } = await init();
    const [count] = createSignal(3);
    const doubled = createMemo(() => count() * 2);
    expect(doubled()).toBe(6);
  });

  it("createMemo recomputes when dependency changes", async () => {
    const { createSignal, createMemo, flush } = await init();
    const [count, setCount] = createSignal(1);
    const doubled = createMemo(() => count() * 2);
    expect(doubled()).toBe(2);
    setCount(5);
    flush();
    expect(doubled()).toBe(10);
  });

  it("createEffect runs on signal change", async () => {
    const { createSignal, createEffect, flush } = await init();
    const [count, setCount] = createSignal(0);
    let lastValue = -1;
    createEffect(() => { lastValue = count(); });
    expect(lastValue).toBe(0);
    setCount(7);
    flush();
    expect(lastValue).toBe(7);
  });

  it("holds JS objects via value map", async () => {
    const { createSignal, flush } = await init();
    const [user, setUser] = createSignal({ name: "Alice" });
    expect(user().name).toBe("Alice");
    setUser({ name: "Bob" });
    flush();
    expect(user().name).toBe("Bob");
  });

  it("multiple signals and computed", async () => {
    const { createSignal, createMemo, flush } = await init();
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const sum = createMemo(() => a() + b());
    expect(sum()).toBe(3);
    setA(10);
    flush();
    expect(sum()).toBe(12);
    setB(20);
    flush();
    expect(sum()).toBe(30);
  });

  it("batch flushes only once after multiple writes", async () => {
    const { createSignal, createMemo, batch } = await init();
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const sum = createMemo(() => a() + b());
    batch(() => {
      setA(10);
      setB(20);
    });
    expect(sum()).toBe(30);
  });

  it("diamond dependency recomputes correctly", async () => {
    const { createSignal, createMemo, flush } = await init();
    const [x, setX] = createSignal(1);
    const a = createMemo(() => x() * 2);
    const b = createMemo(() => x() * 3);
    const sum = createMemo(() => a() + b());
    expect(sum()).toBe(5);
    setX(2);
    flush();
    expect(sum()).toBe(10);
  });

  it("chained computeds propagate correctly", async () => {
    const { createSignal, createMemo, flush } = await init();
    const [x, setX] = createSignal(2);
    const squared = createMemo(() => x() * x());
    const doubled = createMemo(() => squared() * 2);
    const incremented = createMemo(() => doubled() + 1);
    expect(incremented()).toBe(9);
    setX(3);
    flush();
    expect(incremented()).toBe(19);
  });

  it("dynamic dependencies work", async () => {
    const { createSignal, createMemo, flush } = await init();
    const [toggle, setToggle] = createSignal(true);
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(10);
    const computed = createMemo(() => toggle() ? a() : b());
    expect(computed()).toBe(1);
    setA(5);
    flush();
    expect(computed()).toBe(5);
    setToggle(false);
    flush();
    expect(computed()).toBe(10);
    setB(20);
    flush();
    expect(computed()).toBe(20);
    setA(999);
    flush();
    expect(computed()).toBe(20);
  });

  it("dynamic dependencies switch correctly", async () => {
    const { createSignal, createMemo, flush } = await init();
    const [toggle, setToggle] = createSignal(true);
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(10);
    const ma = createMemo(() => a());
    const mb = createMemo(() => b());
    const result = createMemo(() => toggle() ? ma() : mb());
    expect(result()).toBe(1);
    setToggle(false);
    flush();
    expect(result()).toBe(10);
    setA(5);
    flush();
    expect(result()).toBe(10);
    setB(20);
    flush();
    expect(result()).toBe(20);
  });

  it("effect does not run on unrelated signal change", async () => {
    const { createSignal, createEffect, flush } = await init();
    const [a, setA] = createSignal(0);
    const [b, setB] = createSignal(0);
    let effectRuns = 0;
    createEffect(() => { a(); effectRuns++; });
    expect(effectRuns).toBe(1);
    setB(99);
    flush();
    expect(effectRuns).toBe(1);
    setA(5);
    flush();
    expect(effectRuns).toBe(2);
  });

  it("multiple effects on same signal", async () => {
    const { createSignal, createEffect, flush } = await init();
    const [x, setX] = createSignal(0);
    let a = -1, b = -1;
    createEffect(() => { a = x(); });
    createEffect(() => { b = x(); });
    expect(a).toBe(0);
    expect(b).toBe(0);
    setX(42);
    flush();
    expect(a).toBe(42);
    expect(b).toBe(42);
  });

  it("setter with same value does not trigger recompute", async () => {
    const { createSignal, createMemo, flush } = await init();
    const [x, setX] = createSignal(5);
    let recomputeCount = 0;
    const m = createMemo(() => { recomputeCount++; return x() * 2; });
    expect(m()).toBe(10);
    expect(recomputeCount).toBe(1);
    setX(5);
    flush();
    expect(recomputeCount).toBe(1);
  });

  it("createRoot disposes owned signals on dispose", async () => {
    const { createSignal, createRoot } = await init();
    let sig: () => number;
    createRoot((dispose) => {
      const [count] = createSignal(42);
      sig = count;
      expect(count()).toBe(42);
      dispose();
      expect(() => count()).not.toThrow();
    });
  });

  it("onCleanup runs when root is disposed", async () => {
    const { createRoot, onCleanup } = await init();
    let cleaned = false;
    createRoot((dispose) => {
      onCleanup(() => { cleaned = true; });
      expect(cleaned).toBe(false);
      dispose();
      expect(cleaned).toBe(true);
    });
  });

  it("createRoot returns the value from fn", async () => {
    const { createRoot } = await init();
    const result = createRoot(() => "hello");
    expect(result).toBe("hello");
  });

  it("nested createRoot: inner dispose does not affect outer", async () => {
    const { createRoot, createSignal, onCleanup } = await init();
    let outerCleaned = false;
    let innerSig: () => number;
    let outerSig: () => number;

    createRoot((outerDispose) => {
      [outerSig] = createSignal(1);
      onCleanup(() => { outerCleaned = true; });

      createRoot((innerDispose) => {
        [innerSig] = createSignal(2);
        innerDispose();
      });

      expect(outerCleaned).toBe(false);
      outerDispose();
      expect(outerCleaned).toBe(true);
    });
  });

  it("memo auto-cleans inner signals on recompute", async () => {
    const { createSignal, createMemo, flush } = await init();
    const [x, setX] = createSignal(0);
    let createdCount = 0;

    const m = createMemo(() => {
      // Each recompute creates a new signal owned by the memo
      const [inner] = createSignal(x());
      createdCount++;
      return inner();
    });

    expect(m()).toBe(0);
    expect(createdCount).toBe(1);

    setX(1);
    flush();
    expect(m()).toBe(1);
    // createdCount increments each recompute as old signal is cleaned, new one created
    expect(createdCount).toBe(2);
  });

  it("effect auto-cleans inner signals on re-run", async () => {
    const { createSignal, createEffect, onCleanup, flush } = await init();
    const [x, setX] = createSignal(0);
    let innerValue = -1;
    let cleanupRan = false;

    createEffect(() => {
      const [inner] = createSignal(x());
      onCleanup(() => { cleanupRan = true; });
      innerValue = inner();
    });

    expect(innerValue).toBe(0);
    expect(cleanupRan).toBe(false);

    setX(1);
    flush();
    expect(innerValue).toBe(1);
    expect(cleanupRan).toBe(true);
  });

  it("stale dynamic deps are cleaned up on recompute", async () => {
    const { createSignal, createMemo, flush } = await init();
    const [toggle, setToggle] = createSignal(true);
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(10);
    let recomputeCount = 0;
    const c = createMemo(() => {
      recomputeCount++;
      return toggle() ? a() : b();
    });
    expect(c()).toBe(1);
    expect(recomputeCount).toBe(1);
    setToggle(false);
    flush();
    expect(c()).toBe(10);
    expect(recomputeCount).toBe(2);
    // a is no longer a dep — changing it should NOT trigger recompute
    setA(999);
    flush();
    expect(recomputeCount).toBe(2);
    expect(c()).toBe(10);
    // b is still a dep — changing it should trigger recompute
    setB(20);
    flush();
    expect(recomputeCount).toBe(3);
    expect(c()).toBe(20);
  });
});