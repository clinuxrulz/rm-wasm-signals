import { defineEngine, compileEngine } from "./engine.js";
import { writeFileSync } from "fs";

defineEngine();
const wat = compileEngine();
writeFileSync("/data/data/com.termux/files/home/GitHub/rm-wasm-signals/benchmarks/js-reactivity-benchmark/packages/node/engine.wat", wat);
console.log("WAT written, length:", wat.length);
