import { defineEngine, compileEngine, F_COMPUTED, F_DIRTY, F_CHECK, F_HAS_OBJECT } from "./engine.js";
import { ValueMap } from "./value-map.js";

type WasmExports = {
  __sig_init(): void;
  __sig_alloc_signal(initialId: number): number;
  __sig_alloc_effect(initialId: number): number;
  __sig_alloc_computed(initialId: number): number;
  __sig_flush(): void;
  __sig_process_tracking(count: number): void;
  __sig_process_and_flush(count: number): void;
  memory: WebAssembly.Memory;
};

const G_OBSERVER = 0;
const G_EFFECT_COUNT = 6;
const EFFECT_BUF = 144;
const TRACK_BUF = 65680;
const TRACK_BUF_SIZE = 1024;
const WRITE_BUF = 66704;
const WRITE_BUF_SIZE = 1024;
const POOL_BASE_I32 = 67728;
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
  let wasm: WasmExports;
  let trackPos = 0;
  let writePos = 0;

  const bridge = {
    recompute: (computedIdx: number): number => {
      const fn = computedFns.get(computedIdx);
      if (!fn) return 0;
      const u32 = view();
      const prevObserver = u32[G_OBSERVER];
      u32[G_OBSERVER] = computedIdx;
      trackPos = 0;
      const result = fn();
      if (trackPos > 0) {
        wasm.__sig_process_tracking(trackPos);
        trackPos = 0;
      }
      u32[G_OBSERVER] = prevObserver;
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

  const createSignal = <T>(initial: T): [() => T, (v: T) => void] => {
    let sigIdx: number;
    if (typeof initial === 'number') {
      sigIdx = wasm.__sig_alloc_signal(initial as number);
    } else {
      const id = valueMap.alloc(initial);
      sigIdx = wasm.__sig_alloc_signal(id);
      view()[POOL_BASE_I32 + sigIdx * SN + 3] |= F_HAS_OBJECT;
    }

    const getter = (): T => {
      const u32 = view();
      const depAddr = POOL_BASE_I32 + sigIdx * SN;
      if (u32[G_OBSERVER] !== 0) {
        u32[TRACK_BUF + (trackPos++)] = sigIdx;
        if (trackPos >= TRACK_BUF_SIZE) {
          wasm.__sig_process_tracking(trackPos);
          trackPos = 0;
        }
        const flags = u32[depAddr + 3];
        if ((flags & F_COMPUTED) && (flags & (F_DIRTY | F_CHECK))) {
          wasm.__sig_process_tracking(trackPos);
          trackPos = 0;
        }
      }
      const val = u32[depAddr];
      if (u32[depAddr + 3] & F_HAS_OBJECT) return valueMap.get(val) as T;
      return val as unknown as T;
    };

    const setter = (val: T): void => {
      const u32 = view();
      const depAddr = POOL_BASE_I32 + sigIdx * SN;
      const newId = u32[depAddr + 3] & F_HAS_OBJECT ? valueMap.alloc(val) : val as number;
      if (u32[depAddr] !== newId) {
        u32[depAddr] = newId;
        u32[WRITE_BUF + (writePos++)] = sigIdx;
        if (writePos >= WRITE_BUF_SIZE) {
          wasm.__sig_process_and_flush(writePos);
          writePos = 0;
        }
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
    trackPos = 0;
    const initial = fn();
    if (trackPos > 0) {
      wasm.__sig_process_tracking(trackPos);
      trackPos = 0;
    }
    view()[G_OBSERVER] = 0;
    if (typeof initial === 'number') {
      view()[POOL_BASE_I32 + idx * SN] = initial;
    } else {
      view()[POOL_BASE_I32 + idx * SN] = valueMap.alloc(initial);
      view()[POOL_BASE_I32 + idx * SN + 3] |= F_HAS_OBJECT;
    }

    return () => {
      const u32 = view();
      const depAddr = POOL_BASE_I32 + idx * SN;
      if (u32[G_OBSERVER] !== 0) {
        u32[TRACK_BUF + (trackPos++)] = idx;
        if (trackPos >= TRACK_BUF_SIZE) {
          wasm.__sig_process_tracking(trackPos);
          trackPos = 0;
        }
        const flags = u32[depAddr + 3];
        if ((flags & F_COMPUTED) && (flags & (F_DIRTY | F_CHECK))) {
          wasm.__sig_process_tracking(trackPos);
          trackPos = 0;
        }
      }
      const val = u32[depAddr];
      if (u32[depAddr + 3] & F_HAS_OBJECT) return valueMap.get(val) as T;
      return val as unknown as T;
    };
  };

  const createEffect = (fn: () => void): void => {
    const idx = wasm.__sig_alloc_effect(0);
    effectFns.set(idx, fn);

    view()[G_OBSERVER] = idx;
    trackPos = 0;
    fn();
    if (trackPos > 0) {
      wasm.__sig_process_tracking(trackPos);
      trackPos = 0;
    }
    view()[G_OBSERVER] = 0;
  };

  const flush = (): void => {
    if (writePos > 0) {
      wasm.__sig_process_and_flush(writePos);
      writePos = 0;
    } else {
      wasm.__sig_flush();
    }
    const u32 = view();
    const count = u32[G_EFFECT_COUNT];
    if (count > 0) {
      u32[G_EFFECT_COUNT] = 0;
      for (let i = 0; i < count; i++) {
        const effectIdx = u32[EFFECT_BUF + i];
        const fn = effectFns.get(effectIdx);
        if (!fn) continue;
        u32[G_OBSERVER] = effectIdx;
        trackPos = 0;
        fn();
        if (trackPos > 0) {
          wasm.__sig_process_tracking(trackPos);
          trackPos = 0;
        }
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
    writePos = 0;
    wasm.__sig_init();
  };

  return { createSignal, createMemo, createEffect, flush, batch, reset };
}