import { init, type ReactiveAPI } from "../../../../../../src/index";
import { ReactiveFramework } from "../util/reactiveFramework";

let api: ReactiveAPI;

const initPromise = init().then((a) => {
  api = a;
});

export const rmWasmSignalsFramework: ReactiveFramework = {
  name: "rm-wasm-signals",
  signal: (initialValue) => {
    const [getter, setter] = api.createSignal(initialValue);
    return {
      read: () => getter(),
      write: (v) => setter(v),
    };
  },
  computed: (fn) => {
    const memo = api.createMemo(fn);
    return { read: () => memo() };
  },
  effect: (fn) => {
    api.createEffect(fn);
  },
  withBatch: (fn) => {
    api.batch(fn);
  },
  withBuild: (fn) => fn(),
  cleanup: () => {
    api.reset();
  },
};

initPromise.catch((err) => {
  console.error("Failed to initialize rm-wasm-signals:", err);
  process.exit(1);
});
