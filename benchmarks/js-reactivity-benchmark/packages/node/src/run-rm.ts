import {
  formatPerfResult,
  PerfResult,
  perfResultHeaders,
  runTests,
} from "js-reactivity-benchmark/src/index";
import { ReactiveFramework } from "js-reactivity-benchmark/src/util/reactiveFramework";
import { init, type ReactiveAPI } from "../../../../../src/index";

async function createFramework(): Promise<ReactiveFramework> {
  const api = await init();

  return {
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
}

function logLine(line: string): void {
  console.log(line);
}

function logPerfResult(result: PerfResult): void {
  logLine(
    formatPerfResult({
      framework: result.framework,
      test: result.test,
      time: result.time.toFixed(2),
    }),
  );
}

async function main() {
  const framework = await createFramework();
  logLine(formatPerfResult(perfResultHeaders()));
  await runTests([{ framework }], logPerfResult);
}

main();
