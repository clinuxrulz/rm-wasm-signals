import { defineEngine, compileEngine } from "../src/engine.js";

defineEngine();
const wat = compileEngine();
console.log(wat);