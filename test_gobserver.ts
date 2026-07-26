import { init } from "./src/index.js";

async function main() {
  const api = await init();

  let effectRunCount = 0;

  const [a, setA] = api.createSignal(1);
  const [b, setB] = api.createSignal(10);

  // C depends on A only
  const c = api.createMemo(() => a() * 2);

  // Effect: reads C (will be dirty after A update), then B
  let lastB = 0;
  let lastC = 0;
  api.createEffect(() => {
    lastC = c();
    lastB = b();
    effectRunCount++;
  });

  await new Promise(r => setTimeout(r, 0));
  console.log("Initial: effectRunCount:", effectRunCount, "lastB:", lastB, "lastC:", lastC);
  effectRunCount = 0;

  // Update A (makes C dirty) AND B in the same batch
  // The effect should re-run because C changed, and it should ALSO track B
  api.batch(() => {
    setA(5);
    setB(20);
  });
  await new Promise(r => setTimeout(r, 0));

  console.log("After A+B update: effectRunCount:", effectRunCount, "lastB:", lastB, "lastC:", lastC);

  if (effectRunCount === 1 && lastB === 20) {
    console.log("Partial PASS: Both updates triggered effect");
  }

  effectRunCount = 0;

  // Now change B ONLY — effect should re-run if B was tracked
  setB(30);
  api.batch(() => {});
  await new Promise(r => setTimeout(r, 0));

  console.log("After B-only update: effectRunCount:", effectRunCount, "lastB:", lastB);
  console.log("lastB === 30?", lastB === 30);

  if (effectRunCount > 0) {
    console.log("PASS: B was tracked through dirty computed path");
  } else {
    console.log("FAIL: B was NOT tracked (G_OBSERVER bug)");
  }
}
main().catch(e => console.error("ERROR:", e));
