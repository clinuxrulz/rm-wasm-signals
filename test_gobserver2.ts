// Test: effect writes to a dependency, making a computed dirty mid-evaluation
import { init } from "./src/index.js";

async function main() {
  const api = await init();

  const [x, setX] = api.createSignal(1);
  const [y, setY] = api.createSignal(100);
  const c = api.createMemo(() => x() * 2);

  let trackedY = false;
  
  // Effect reads C (might be dirty), writes to X (making C dirty again), reads Y  
  // This simulates an anti-pattern where an effect both reads and writes
  const unsub = api.createEffect(() => {
    c();        // read computed
    setX(x() + 1); // write to signal — goes to write buffer
    // After this write: C's dependency X changed, so C should be dirty
    // But with batched writes, C won't be notified until next flush
    
    y();        // read Y — should be tracked
    trackedY = true;
  });

  await new Promise(r => setTimeout(r, 0));
  
  // Now change Y and see if effect re-runs
  trackedY = false;
  setY(200);
  api.batch(() => {});
  await new Promise(r => setTimeout(r, 0));

  if (trackedY) {
    console.log("PASS: Y is tracked through dirty computed + effect-write scenario");
  } else {
    console.log("FAIL: Y was NOT tracked (G_OBSERVER bug)");
  }
}
main().catch(e => console.error("ERROR:", e));
