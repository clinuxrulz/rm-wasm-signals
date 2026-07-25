import { init } from "../../../../../src/index";

async function main() {
  const api = await init();
  const COUNT = 1e5;
  function signal(v: number) { const [g,s]=api.createSignal(v); return {read:()=>g(),write:(v:number)=>s(v)}; }
  function effect(fn:()=>void) { api.createEffect(fn); }
  function cleanup() { api.reset(); }

  const tests = [
    ["update1to1",    COUNT*4,     1,  (n:number,s:any[])=>{const{w:set1}=s[0];effect(()=>s[0].read());return()=>{for(let i=0;i<n;i++){set1(i);api.flush();}}; }],
    ["update2to1",    COUNT*2,     2,  (n:number,s:any[])=>{const{w:set1}=s[0];effect(()=>s[0].read()+s[1].read());return()=>{for(let i=0;i<n;i++){set1(i);api.flush();}}; }],
    ["update4to1",    COUNT,       4,  (n:number,s:any[])=>{const{w:set1}=s[0];effect(()=>s[0].read()+s[1].read()+s[2].read()+s[3].read());return()=>{for(let i=0;i<n;i++){set1(i);api.flush();}}; }],
    ["update1000to1", COUNT/250,1000, (n:number,s:any[])=>{effect(()=>{let sum=0;for(let i=0;i<1000;i++)sum+=s[i].read();});const{w:set1}=s[0];return()=>{for(let i=0;i<n;i++){set1(i);api.flush();}}; }],
    ["update1to2",    COUNT,       1,  (n:number,s:any[])=>{const{w:set1}=s[0];effect(()=>s[0].read());effect(()=>s[0].read());return()=>{for(let i=0;i<n;i++){set1(i);api.flush();}}; }],
    ["update1to4",    COUNT,       1,  (n:number,s:any[])=>{const{w:set1}=s[0];effect(()=>s[0].read());effect(()=>s[0].read());effect(()=>s[0].read());effect(()=>s[0].read());return()=>{for(let i=0;i<n;i++){set1(i);api.flush();}}; }],
    ["update1to1000", COUNT,       1,  (n:number,s:any[])=>{const{w:set1}=s[0];for(let i=0;i<1000;i++)effect(()=>s[0].read());return()=>{for(let i=0;i<n/10;i++){set1(i);api.flush();}}; }],
  ];

  for (const [name, n, scount, runFn] of tests) {
    console.log(`\n=== ${name} (n=${n}, scount=${scount}) ===`);
    try {
      // warmup
      for (let i = 0; i < 3; i++) {
        const src: any[] = [];
        for (let j = 0; j < scount; j++) src.push(signal(j));
        const upd = (runFn as any)(n / 100, src);
        upd();
      }
      cleanup();

      // actual (single iter with 10s timeout)
      const src: any[] = [];
      for (let j = 0; j < scount; j++) src.push(signal(j));
      const start = performance.now();
      const timedOut = { current: false };
      const timeout = setTimeout(() => { timedOut.current = true; }, 10000);
      const upd = (runFn as any)(n, src);
      upd();
      clearTimeout(timeout);

      if (timedOut.current) {
        console.log(`  TIMED OUT (>10s)`);
      } else {
        console.log(`  OK: ${(performance.now() - start).toFixed(1)}ms`);
      }
      cleanup();
    } catch(e) {
      console.log(`  ERROR: ${e}`);
    }
  }
}
main();
