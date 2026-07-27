import { defineEngine, compileEngine, F_COMPUTED, F_DIRTY, F_CHECK } from "./engine.js";

type WasmExports = {
  __sig_init(): void;
  __sig_alloc_signal(initialId: number): number;
  __sig_alloc_effect(initialId: number): number;
  __sig_alloc_computed(initialId: number): number;
  __sig_flush(): void;
  __sig_process_tracking(count: number): void;
  __sig_process_and_flush(count: number): void;
  __sig_clear_deps(sigIdx: number): void;
  memory: WebAssembly.Memory;
};

const G_OBSERVER = 0;
const G_EFFECT_COUNT = 6;
const EFFECT_BUF = 144;
const TRACK_BUF = 65680;
const TRACK_BUF_SIZE = 1024;
const WRITE_BUF = 66704;
const WRITE_BUF_SIZE = 1024;
const COMPUTE_BUF_I32 = 67728;
const COMPUTE_BUF_SIZE = 1024;
const COMPUTE_RESULT_BUF_I32 = 68752;
const POOL_BASE_I32 = 69776;
const SN = 6;

interface Owner {
  owned: number[];
  cleanups: (() => void)[];
  owner: Owner | null;
}

export interface ReactiveAPI {
  createSignal<T>(initial: T): [() => T, (v: T) => void];
  createMemo<T>(fn: () => T): () => T;
  createEffect(fn: () => void): void;
  createRoot<T>(fn: (dispose: () => void) => T): T;
  onCleanup(fn: () => void): void;
  flush(): void;
  batch<T>(fn: () => T): T;
  reset(): void;
}

export async function init(): Promise<ReactiveAPI> {
  defineEngine();
  const wat = compileEngine();

  const signalValues: any[] = [undefined];
  const computedFns: (() => any)[] = [];
  const effectFns: (() => void)[] = [];
  const signalOwners: (Owner | undefined)[] = [];
  let currentOwner: Owner | null = null;
  let wasm: WasmExports;
  let trackPos = 0;
  let writePos = 0;

  function cleanNode(owner: Owner): void {
    for (let i = owner.owned.length - 1; i >= 0; i--) {
      const idx = owner.owned[i];
      const childOwner = signalOwners[idx];
      if (childOwner) cleanNode(childOwner);
      signalValues[idx] = undefined;
      computedFns[idx] = undefined;
      effectFns[idx] = undefined;
    }
    owner.owned = [];
    for (let i = owner.cleanups.length - 1; i >= 0; i--) {
      owner.cleanups[i]();
    }
    owner.cleanups = [];
  }

  const bridge = {
    recompute: (computedIdx: number): number => {
      const fn = computedFns[computedIdx];
      if (!fn) return 0;
      const owner = signalOwners[computedIdx];
      if (owner) cleanNode(owner);
      const prevOwner = currentOwner;
      currentOwner = owner;
      const u32 = view();
      const prevObserver = u32[G_OBSERVER];
      u32[G_OBSERVER] = computedIdx;
      trackPos = 0;
      wasm.__sig_clear_deps(computedIdx);
      const result = fn();
      if (trackPos > 0) {
        wasm.__sig_process_tracking(trackPos);
        trackPos = 0;
      }
      u32[G_OBSERVER] = prevObserver;
      currentOwner = prevOwner;
      const oldValue = signalValues[computedIdx];
      if (Object.is(oldValue, result)) return 0;
      signalValues[computedIdx] = result;
      return 1;
    },
    recompute_batch: (count: number): void => {
      const u32 = view();
      for (let i = 0; i < count; i++) {
        const sigIdx = u32[COMPUTE_BUF_I32 + i];
        const fn = computedFns[sigIdx];
        if (!fn) {
          u32[COMPUTE_RESULT_BUF_I32 + i] = 0;
          continue;
        }
        const owner = signalOwners[sigIdx];
        if (owner) cleanNode(owner);
        const prevOwner = currentOwner;
        currentOwner = owner;
        const prevObserver = u32[G_OBSERVER];
        u32[G_OBSERVER] = sigIdx;
        trackPos = 0;
        wasm.__sig_clear_deps(sigIdx);
        const result = fn();
        if (trackPos > 0) {
          wasm.__sig_process_tracking(trackPos);
          trackPos = 0;
        }
        u32[G_OBSERVER] = prevObserver;
        currentOwner = prevOwner;
        const oldValue = signalValues[sigIdx];
        if (Object.is(oldValue, result)) {
          u32[COMPUTE_RESULT_BUF_I32 + i] = 0;
        } else {
          signalValues[sigIdx] = result;
          u32[COMPUTE_RESULT_BUF_I32 + i] = 1;
        }
      }
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
    const sigIdx = wasm.__sig_alloc_signal(0);
    signalValues[sigIdx] = initial;
    if (currentOwner) currentOwner.owned.push(sigIdx);

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
      return signalValues[sigIdx];
    };

    const setter = (val: T): void => {
      const oldValue = signalValues[sigIdx];
      if (Object.is(oldValue, val)) return;
      signalValues[sigIdx] = val;
      const u32 = view();
      u32[WRITE_BUF + (writePos++)] = sigIdx;
      if (writePos >= WRITE_BUF_SIZE) {
        wasm.__sig_process_and_flush(writePos);
        writePos = 0;
      }
      if (batching === 0) {
        queueMicrotask(() => flush());
      }
    };

    return [getter, setter];
  };

  const createMemo = <T>(fn: () => T): () => T => {
    const idx = wasm.__sig_alloc_computed(0);
    computedFns[idx] = fn;
    const owner: Owner = { owned: [], cleanups: [], owner: currentOwner };
    signalOwners[idx] = owner;
    if (currentOwner) currentOwner.owned.push(idx);
    const prevOwner = currentOwner;
    currentOwner = owner;

    const u32 = view();
    u32[G_OBSERVER] = idx;
    trackPos = 0;
    const initial = fn();
    if (trackPos > 0) {
      wasm.__sig_process_tracking(trackPos);
      trackPos = 0;
    }
    u32[G_OBSERVER] = 0;
    signalValues[idx] = initial;
    currentOwner = prevOwner;

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
      return signalValues[idx];
    };
  };

  const createEffect = (fn: () => void): void => {
    const idx = wasm.__sig_alloc_effect(0);
    effectFns[idx] = fn;
    const owner: Owner = { owned: [], cleanups: [], owner: currentOwner };
    signalOwners[idx] = owner;
    if (currentOwner) currentOwner.owned.push(idx);
    const prevOwner = currentOwner;
    currentOwner = owner;

    view()[G_OBSERVER] = idx;
    trackPos = 0;
    fn();
    if (trackPos > 0) {
      wasm.__sig_process_tracking(trackPos);
      trackPos = 0;
    }
    view()[G_OBSERVER] = 0;
    currentOwner = prevOwner;
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
        const fn = effectFns[effectIdx];
        if (!fn) continue;
        const owner = signalOwners[effectIdx];
        if (owner) cleanNode(owner);
        const prevOwner = currentOwner;
        currentOwner = owner;
        u32[G_OBSERVER] = effectIdx;
        trackPos = 0;
        wasm.__sig_clear_deps(effectIdx);
        fn();
        if (trackPos > 0) {
          wasm.__sig_process_tracking(trackPos);
          trackPos = 0;
        }
        u32[G_OBSERVER] = 0;
        currentOwner = prevOwner;
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

  const createRoot = <T>(fn: (dispose: () => void) => T): T => {
    const prev = currentOwner;
    const owner: Owner = { owned: [], cleanups: [], owner: prev };
    currentOwner = owner;
    try {
      return fn(() => cleanNode(owner));
    } finally {
      currentOwner = prev;
    }
  };

  const onCleanup = (fn: () => void): void => {
    if (currentOwner) currentOwner.cleanups.push(fn);
  };

  const reset = (): void => {
    currentOwner = null;
    signalOwners.length = 0;
    signalValues.length = 0;
    signalValues[0] = undefined;
    computedFns.length = 0;
    effectFns.length = 0;
    trackPos = 0;
    writePos = 0;
    wasm.__sig_init();
  };

  return { createSignal, createMemo, createEffect, createRoot, onCleanup, flush, batch, reset };
}