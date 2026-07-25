import { defineEngine, compileEngine } from "./engine.js";
import { ValueMap } from "./value-map.js";

type WasmExports = {
  __sig_init(): void;
  __sig_alloc_signal(initialId: number): number;
  __sig_alloc_effect(initialId: number): number;
  __sig_alloc_computed(initialId: number): number;
  __sig_read(sigIdx: number): number;
  __sig_write(sigIdx: number, valueId: number): void;
  __sig_flush(): void;
  __sig_track_store(sigIdx: number): void;
  __sig_process_tracking(count: number): void;
  __sig_get_value(sigIdx: number): number;
  __sig_set_observer(idx: number): void;
  __sig_get_observer(): number;
  memory: WebAssembly.Memory;
};

const G_OBSERVER = 0;
const G_EFFECT_COUNT = 6;
const G_TRACKED_VALUE = 7;
const EFFECT_BUF = 144;
const TRACK_BUF = 65680;
const POOL_BASE_I32 = 66704;
const SN = 6;

export interface ReactiveAPI {
  createSignal<T>(initial: T): [() => T, (v: T) => void];
  createMemo<T>(fn: () => T): () => T;
  createEffect(fn: () => void): void;
  flush(): void;
  batch<T>(fn: () => T): T;
  reset(): void;
}

export async function init(): Promise<ReactiveAPI> {
  defineEngine();
  const wat = compileEngine();

  const computedFns = new Map<number, () => any>();
  const effectFns = new Map<number, () => void>();
  const valueMap = new ValueMap();
  const objectSignals = new Set<number>();
  let wasm: WasmExports;

  const bridge = {
    recompute: (computedIdx: number): number => {
      const fn = computedFns.get(computedIdx);
      if (!fn) return 0;
      view()[G_OBSERVER] = computedIdx;
      const result = fn();
      view()[G_OBSERVER] = 0;
      if (typeof result === 'number') return result;
      return valueMap.alloc(result);
    },
  };

  const wabt = await import("wabt");
  const wabtApi = await wabt.default();
  const bin = wabtApi.parseWat("engine.wat", wat).toBinary({});
  const mod = new WebAssembly.Module(bin.buffer as unknown as ArrayBuffer);
  const inst = new WebAssembly.Instance(mod, { bridge });
  wasm = inst.exports as unknown as WasmExports;
  wasm.__sig_init();

  let batching = 0;
  let memoryView: Int32Array;

  const view = (): Int32Array => {
    if (!memoryView || memoryView.buffer !== wasm.memory.buffer) {
      memoryView = new Int32Array(wasm.memory.buffer);
    }
    return memoryView;
  };

  const readValue = <T>(sigIdx: number): T => {
    const val = view()[POOL_BASE_I32 + sigIdx * SN];
    if (objectSignals.has(sigIdx)) return valueMap.get(val) as T;
    return val as unknown as T;
  };

  const readTracked = <T>(sigIdx: number): T => {
    wasm.__sig_track_store(sigIdx);
    const val = view()[G_TRACKED_VALUE];
    if (objectSignals.has(sigIdx)) return valueMap.get(val) as T;
    return val as unknown as T;
  };

  const createSignal = <T>(initial: T): [() => T, (v: T) => void] => {
    let sigIdx: number;
    if (typeof initial === 'number') {
      sigIdx = wasm.__sig_alloc_signal(initial as number);
    } else {
      const id = valueMap.alloc(initial);
      sigIdx = wasm.__sig_alloc_signal(id);
      objectSignals.add(sigIdx);
    }

    const getter = (): T => {
      if (view()[G_OBSERVER] !== 0) return readTracked<T>(sigIdx);
      return readValue<T>(sigIdx);
    };

    const setter = (val: T): void => {
      if (objectSignals.has(sigIdx)) {
        wasm.__sig_write(sigIdx, valueMap.alloc(val));
      } else {
        wasm.__sig_write(sigIdx, val as number);
      }
      if (batching === 0) {
        queueMicrotask(() => flush());
      }
    };

    return [getter, setter];
  };

  const createMemo = <T>(fn: () => T): () => T => {
    const idx = wasm.__sig_alloc_computed(0);
    computedFns.set(idx, fn);

    view()[G_OBSERVER] = idx;
    const initial = fn();
    view()[G_OBSERVER] = 0;
    if (typeof initial === 'number') {
      wasm.__sig_write(idx, initial);
    } else {
      objectSignals.add(idx);
      wasm.__sig_write(idx, valueMap.alloc(initial));
    }

    return () => {
      if (view()[G_OBSERVER] !== 0) return readTracked<T>(idx);
      return readValue<T>(idx);
    };
  };

  const createEffect = (fn: () => void): void => {
    const idx = wasm.__sig_alloc_effect(0);
    effectFns.set(idx, fn);

    view()[G_OBSERVER] = idx;
    fn();
    view()[G_OBSERVER] = 0;
  };

  const flush = (): void => {
    wasm.__sig_flush();
    const u32 = view();
    const count = u32[G_EFFECT_COUNT];
    if (count > 0) {
      u32[G_EFFECT_COUNT] = 0;
      for (let i = 0; i < count; i++) {
        const effectIdx = u32[EFFECT_BUF + i];
        const fn = effectFns.get(effectIdx);
        if (!fn) continue;
        u32[G_OBSERVER] = effectIdx;
        fn();
        u32[G_OBSERVER] = 0;
      }
    }
  };

  const batch = <T>(fn: () => T): T => {
    batching++;
    try {
      const result = fn();
      flush();
      return result;
    } finally {
      batching--;
    }
  };

  const reset = (): void => {
    computedFns.clear();
    effectFns.clear();
    valueMap.clear();
    objectSignals.clear();
    wasm.__sig_init();
  };

  return { createSignal, createMemo, createEffect, flush, batch, reset };
}