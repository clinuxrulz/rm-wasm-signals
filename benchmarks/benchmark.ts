import { Bench } from 'tinybench';
import { init } from '../src/index';
import { describe, it } from 'vitest';

async function runBenchmarks() {
  const api = await init();
  const bench = new Bench({ time: 100 });

  // Benchmarks for your library
  bench.add('Your Library: Signal Creation', () => {
    api.createSignal(10);
  });

  bench.add('Your Library: Signal Update', () => {
    const [, setter] = api.createSignal(10);
    setter(20);
  });

  // Placeholder for other libraries to compare against
  // You can install and import other reactive libraries here.
  // Example: 
  // import { signal } from 'some-other-library';
  // bench.add('Other Library: Signal Creation', () => { signal(10); });

  await bench.run();
  console.table(bench.table());
}

describe('Reactivity Benchmarks', () => {
  it('should run benchmarks', async () => {
    await runBenchmarks();
  });
});

if (!process.env.VITEST) {
  runBenchmarks().catch(err => {
    console.error('Benchmark failed:', err);
    process.exit(1);
  });
}
