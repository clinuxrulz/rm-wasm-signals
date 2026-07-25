import { init } from "../../../../../src/index";
async function main() {
  process._rawDebug('BEFORE');
  const api = await init();
  process._rawDebug('AFTER INIT');
  const [get, set] = api.createSignal(0);
  process._rawDebug('AFTER SIGNAL');
  const result = get();
  process._rawDebug(`AFTER READ: ${result}`);
}
main();
