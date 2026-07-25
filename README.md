# rm-wasm-signals

A fine-grained reactive signals library that runs its core engine in **WebAssembly** (WAT), compiled via the [`rm-wasm`](https://github.com/anomalyco/rm-wasm) DSL. The scheduling algorithm is based on [R3](https://github.com/milomg/r3)'s topological height-ordered approach with lazy marking (Check/Dirty flags) and a heap-based flush.

## Motivation

Most JS signal libraries run entirely in JavaScript. By compiling the scheduling engine to WebAssembly, the core signal propagation (dirty marking, heap management, topological sorting) executes in a lower-level runtime, decoupling the reactive core from the JS VM's optimization patterns.

## API

```ts
import { init } from "rm-wasm-signals";

const { createSignal, createMemo, createEffect, flush, batch } = await init();
```

Only `init()` is async (compiles the WAT module). All returned functions are synchronous.

### `createSignal<T>(initial: T): [getter, setter]`

Creates a reactive signal with an initial value. Returns a getter/setter tuple.

```ts
const [count, setCount] = createSignal(0);
count();           // => 0
setCount(5);       // updates value, schedules flush
```

### `createMemo<T>(fn: () => T): () => T`

Creates a derived/computed value. The function is re-run automatically when its dependencies change (tracked during read). Returns a getter.

```ts
const doubled = createMemo(() => count() * 2);
doubled();  // => 10
```

### `createEffect(fn: () => void): void`

Creates a side-effect that re-runs when its dependencies change.

```ts
createEffect(() => console.log("count:", count()));
```

### `flush(): void`

Explicitly processes all pending updates in the dirty heap. Effects and computeds are processed in topological (height) order.

### `batch<T>(fn: () => T): T`

Groups multiple writes into a single flush cycle. All dependent computeds/effects update once after the batch completes.

```ts
batch(() => {
  setA(10);
  setB(20);
});
// sum() is now 30, updated once
```

## How It Works

### Memory Layout

The WASM linear memory is partitioned into:

| Region | Contents |
|---|---|
| `[0, 64)` | Globals (observer, epoch, signal count, link count, heap min/max) |
| `[64, 576)` | Heap buckets (`HEAP_CAP=128` buckets × 4 bytes each) |
| `[576, 98880)` | Signal pool (`4096` slots × `SN_BYTES=24` each) |
| `[98880, ~)` | Link records (`4096` links × `LN_BYTES=24` each) |

Each signal pool slot (24 bytes):
| Offset | Field |
|---|---|
| 0 | `valueId` — index into the JS `ValueMap` |
| 4 | `subHead` — linked list of subscriber links |
| 8 | `depHead` — linked list of dependency links |
| 12 | `flags` — `F_EFFECT`(1), `F_COMPUTED`(2), `F_DIRTY`(4), `F_CHECK`(8), `F_IN_HEAP`(16) |
| 16 | `height` — topological height for scheduling |
| 20 | `heapNext` — next node in the heap bucket linked list |

### Algorithm (R3-style)

1. **On write** (`__sig_write`): stores the new value, then iterates the signal's subscriber list calling `__mark_dirty` and `__heap_insert` on each subscriber.

2. **On read** (`__sig_read`): if called within an observer context (computed/effect), dynamically links the observer to the dependency (the `__sig_link_impl` function). If the dependency is a computed with pending dirty/check flags, calls `__update_if_necessary` to lazily recompute it.

3. **Flush** (`__sig_flush`): iterates heap buckets from `heap_min` to `heap_max`. For each node, clears flags and runs the effect or recomputes the computed. Recomputing a computed calls `bridge_recompute` (JS), which re-runs the user function, creating new dependency links. Stale dependency links are cleaned up by `removeStaleDepsFwd`.

4. **Dirty marking** (`__mark_dirty`): sets the `F_DIRTY` flag on a node. If the node is observable (computed or effect), propagates `F_CHECK` to its subscribers (transitive check marking).

5. **Lazy update** (`__update_if_necessary`): recursively visits dependencies marked with `F_CHECK`. If any dependency is dirty, recomputes the current node.

### JS Bridge

Four functions cross the WASM/JS boundary:

- `bridge_equals(sigIdx, oldId, newId)` — compares old and new JS values (1 if equal, 0 otherwise)
- `bridge_recompute(computedIdx)` — runs the user's computed function, returns a new valueId
- `bridge_run_effect(effectIdx)` — runs the user's effect function
- `bridge_free(valueId)` — releases a value from the `ValueMap`

The `ValueMap` bridges WASM `i32` valueIds to actual JavaScript values.

## Development

```bash
npm install
npx vitest        # run tests
npx tsc --noEmit  # typecheck
```

## Tests

- Basic signal get/set
- Memo derivation and recomputation
- Effect lifecycle
- JS object values
- Diamond dependencies (a → b,c → d)
- Chained computeds
- Dynamic dependency switching
- Batch updates
- No-op on equal values (equals check)

## License

MIT