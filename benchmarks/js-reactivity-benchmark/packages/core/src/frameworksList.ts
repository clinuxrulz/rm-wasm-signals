import type { FrameworkInfo } from "./util/frameworkTypes";
import { alienFramework } from "./frameworks/alienSignals";
import { solidFramework } from "./frameworks/solid";
import { rmWasmSignalsFramework } from "./frameworks/rmWasmSignals";

export const frameworkInfo: FrameworkInfo[] = [
  { framework: alienFramework, testPullCounts: true },
  { framework: solidFramework },
  { framework: rmWasmSignalsFramework, testPullCounts: true },
];

export const allFrameworks: FrameworkInfo[] = [
  { framework: alienFramework, testPullCounts: true },
  { framework: solidFramework },
  { framework: rmWasmSignalsFramework, testPullCounts: true },
];
