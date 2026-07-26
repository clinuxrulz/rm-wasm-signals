import {
  Fn, If, While, i32, compileWAT, clearRegistry, asm, asmExpr, Node
} from "@random-mesh/rm-wasm";

export const G_OBSERVER = 0;
export const G_EPOCH = 4;
export const G_SIG_COUNT = 8;
export const G_LINK_COUNT = 12;
export const G_HEAP_MIN = 16;
export const G_HEAP_MAX = 20;
export const G_EFFECT_COUNT = 24;
export const G_TRACKED_VALUE = 28;
export const GLOBALS_END = 64;

export const HEAP_BASE = 64;
export const HEAP_CAP = 128;
export const EFFECT_BUF_SIZE = 65536;
export const EFFECT_BUF = HEAP_BASE + HEAP_CAP * 4;
export const TRACK_BUF_SIZE = 1024;
export const TRACK_BUF = EFFECT_BUF + EFFECT_BUF_SIZE * 4;
export const WRITE_BUF_SIZE = 1024;
export const WRITE_BUF = TRACK_BUF + TRACK_BUF_SIZE * 4;
export const POOL_CAP = 1 << 22;
export const MEMORY_PAGES = 4096;

export const POOL_BASE = WRITE_BUF + WRITE_BUF_SIZE * 4;
export const SN_BYTES = 24;

const LINK_BASE = POOL_BASE + POOL_CAP * SN_BYTES;
const LN_BYTES = 24;

export const F_EFFECT = 1;
export const F_COMPUTED = 2;
export const F_DIRTY = 4;
export const F_CHECK = 8;
export const F_IN_HEAP = 16;
export const F_HAS_OBJECT = 32;

export function defineEngine() {
  clearRegistry();

  Fn("__sig_init", { result: "void" }, () => {
    asm(`(i32.store (i32.const ${G_OBSERVER}) (i32.const 0))`);
    asm(`(i32.store (i32.const ${G_EPOCH}) (i32.const 0))`);
    asm(`(i32.store (i32.const ${G_SIG_COUNT}) (i32.const 0))`);
    asm(`(i32.store (i32.const ${G_LINK_COUNT}) (i32.const 0))`);
    asm(`(i32.store (i32.const ${G_HEAP_MIN}) (i32.const 0))`);
    asm(`(i32.store (i32.const ${G_HEAP_MAX}) (i32.const -1))`);
    asm(`(i32.store (i32.const ${G_EFFECT_COUNT}) (i32.const 0))`);
    let i = i32(0).toVar();
    While(i.lt(i32(128)), () => {
      asm(`(i32.store (i32.add (i32.const ${HEAP_BASE}) (i32.mul $0 (i32.const 4))) (i32.const -1))`, i);
      i.assign(i.add(i32(1)));
    });
  });

  function allocCommon(initialId: Node<"i32">, extraFlags: Node<"i32">): Node<"i32"> {
    let cnt = asmExpr(`(i32.load (i32.const ${G_SIG_COUNT}))`, "i32");
    let idx = cnt.toVar();
    let addr = i32(POOL_BASE).add(cnt.mul(i32(SN_BYTES)));
    asm(`(i32.store $0 $1)`, addr, initialId);
    asm(`(i32.store $0 (i32.const -1))`, addr.add(i32(4)));
    asm(`(i32.store $0 (i32.const -1))`, addr.add(i32(8)));
    asm(`(i32.store $0 $1)`, addr.add(i32(12)), extraFlags);
    asm(`(i32.store $0 (i32.const 0))`, addr.add(i32(16)));
    asm(`(i32.store $0 (i32.const -1))`, addr.add(i32(20)));
    asm(`(i32.store (i32.const ${G_SIG_COUNT}) $0)`, cnt.add(i32(1)));
    return idx;
  }

  Fn("__sig_alloc_signal", {
    params: [{ name: "initialId", type: "i32" }],
    result: "i32",
  }, (initialId) => allocCommon(initialId, i32(0)));

  Fn("__sig_alloc_effect", {
    params: [{ name: "initialId", type: "i32" }],
    result: "i32",
  }, (initialId) => allocCommon(initialId, i32(F_EFFECT)));

  Fn("__sig_alloc_computed", {
    params: [{ name: "initialId", type: "i32" }],
    result: "i32",
  }, (initialId) => allocCommon(initialId, i32(F_COMPUTED)));

  Fn("__heap_insert", {
    params: [{ name: "sigIdx", type: "i32" }],
    result: "void",
  }, (sigIdx) => {
    let addr = i32(POOL_BASE).add(sigIdx.mul(i32(SN_BYTES)));
    let flagsNode = asmExpr(`(i32.load $0)`, "i32", addr.add(i32(12)));
    let inHeap = flagsNode.and(i32(F_IN_HEAP));
    If(inHeap.eq(i32(0)), () => {
      asm(`(i32.store $0 $1)`, addr.add(i32(12)), flagsNode.or(i32(F_IN_HEAP)));
      let h = asmExpr(`(i32.load $0)`, "i32", addr.add(i32(16)));
      let headAddr = i32(HEAP_BASE).add(h.mul(i32(4)));
      let curHead = asmExpr(`(i32.load $0)`, "i32", headAddr);
      asm(`(i32.store $0 $1)`, addr.add(i32(20)), curHead);
      asm(`(i32.store $0 $1)`, headAddr, sigIdx);
      let max = asmExpr(`(i32.load (i32.const ${G_HEAP_MAX}))`, "i32");
      If(h.gt(max), () => { asm(`(i32.store (i32.const ${G_HEAP_MAX}) $0)`, h); });
      let min = asmExpr(`(i32.load (i32.const ${G_HEAP_MIN}))`, "i32");
      If(h.lt(min), () => { asm(`(i32.store (i32.const ${G_HEAP_MIN}) $0)`, h); });
    });
  });

  Fn("__mark_dirty", {
    params: [{ name: "sigIdx", type: "i32" }],
    result: "void",
  }, (sigIdx) => {
    let addr = i32(POOL_BASE).add(sigIdx.mul(i32(SN_BYTES)));
    let flags = asmExpr(`(i32.load $0)`, "i32", addr.add(i32(12)));
    let already = flags.and(i32(F_CHECK | F_DIRTY));
    If(already.lt(i32(F_DIRTY)), () => {
      asm(`(i32.store $0 $1)`, addr.add(i32(12)), flags.or(i32(F_DIRTY)));
      let observable = flags.and(i32(F_EFFECT | F_COMPUTED));
      If(observable.ne(i32(0)), () => {
        let subHead = asmExpr(`(i32.load $0)`, "i32", addr.add(i32(4))).toVar();
        While(subHead.ge(i32(0)), () => {
          let lnk = i32(LINK_BASE).add(subHead.mul(i32(LN_BYTES)));
          let subIdx = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(4)));
          let subAddr = i32(POOL_BASE).add(subIdx.mul(i32(SN_BYTES)));
          let subFlags = asmExpr(`(i32.load $0)`, "i32", subAddr.add(i32(12)));
          let subAlready = subFlags.and(i32(F_CHECK | F_DIRTY));
          If(subAlready.lt(i32(F_CHECK)), () => {
            asm(`(i32.store $0 $1)`, subAddr.add(i32(12)), subFlags.or(i32(F_CHECK)));
          });
          let nxt = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(16)));
          subHead.assign(nxt);
        });
      });
    });
  });

  Fn("__sig_read", {
    params: [{ name: "sigIdx", type: "i32" }],
    result: "i32",
  }, (sigIdx) => {
    let obs = asmExpr(`(i32.load (i32.const ${G_OBSERVER}))`, "i32");
    If(obs.ne(i32(0)), () => {
      asm(`(call $__sig_link_impl $0 $1)`, obs, sigIdx);
      let depAddr = i32(POOL_BASE).add(sigIdx.mul(i32(SN_BYTES)));
      let depFlags = asmExpr(`(i32.load $0)`, "i32", depAddr.add(i32(12)));
      let depIsComputed = depFlags.and(i32(F_COMPUTED));
      If(depIsComputed.ne(i32(0)), () => {
        let depHeight = asmExpr(`(i32.load $0)`, "i32", depAddr.add(i32(16)));
        let obsAddr = i32(POOL_BASE).add(obs.mul(i32(SN_BYTES)));
        let obsHeight = asmExpr(`(i32.load $0)`, "i32", obsAddr.add(i32(16)));
        If(depHeight.ge(obsHeight), () => {
          asm(`(i32.store $0 $1)`, obsAddr.add(i32(16)), depHeight.add(i32(1)));
        });
        let heapMin = asmExpr(`(i32.load (i32.const ${G_HEAP_MIN}))`, "i32");
        let mayBeDirty = depHeight.ge(heapMin).or(depFlags.and(i32(F_DIRTY | F_CHECK)).ne(i32(0)));
        If(mayBeDirty.ne(i32(0)), () => {
          asm(`(call $__sig_mark_heap)`);
          asm(`(call $__update_if_necessary $0)`, sigIdx);
        });
      });
    });
    let addr = i32(POOL_BASE).add(sigIdx.mul(i32(SN_BYTES)));
    return asmExpr(`(i32.load $0)`, "i32", addr);
  });

  Fn("__sig_track_store", {
    params: [{ name: "sigIdx", type: "i32" }],
    result: "void",
  }, (sigIdx) => {
    let obs = asmExpr(`(i32.load (i32.const ${G_OBSERVER}))`, "i32");
    If(obs.ne(i32(0)), () => {
      asm(`(call $__sig_link_impl $0 $1)`, obs, sigIdx);
      let depAddr = i32(POOL_BASE).add(sigIdx.mul(i32(SN_BYTES)));
      let depFlags = asmExpr(`(i32.load $0)`, "i32", depAddr.add(i32(12)));
      let depIsComputed = depFlags.and(i32(F_COMPUTED));
      If(depIsComputed.ne(i32(0)), () => {
        let depHeight = asmExpr(`(i32.load $0)`, "i32", depAddr.add(i32(16)));
        let obsAddr = i32(POOL_BASE).add(obs.mul(i32(SN_BYTES)));
        let obsHeight = asmExpr(`(i32.load $0)`, "i32", obsAddr.add(i32(16)));
        If(depHeight.ge(obsHeight), () => {
          asm(`(i32.store $0 $1)`, obsAddr.add(i32(16)), depHeight.add(i32(1)));
        });
        let heapMin = asmExpr(`(i32.load (i32.const ${G_HEAP_MIN}))`, "i32");
        let mayBeDirty = depHeight.ge(heapMin).or(depFlags.and(i32(F_DIRTY | F_CHECK)).ne(i32(0)));
        If(mayBeDirty.ne(i32(0)), () => {
          asm(`(call $__sig_mark_heap)`);
          asm(`(call $__update_if_necessary $0)`, sigIdx);
        });
      });
    });
    let valAddr = i32(POOL_BASE).add(sigIdx.mul(i32(SN_BYTES)));
    asm(`(i32.store (i32.const ${G_TRACKED_VALUE}) $0)`, asmExpr(`(i32.load $0)`, "i32", valAddr));
  });

  Fn("__sig_process_tracking", {
    params: [{ name: "count", type: "i32" }],
    result: "void",
  }, (count) => {
    let i = i32(0).toVar();
    While(i.lt(count), () => {
      let sigIdx = asmExpr(`(i32.load (i32.add (i32.const ${TRACK_BUF}) (i32.mul $0 (i32.const 4))))`, "i32", i);
      let obs = asmExpr(`(i32.load (i32.const ${G_OBSERVER}))`, "i32");
      If(obs.ne(i32(0)), () => {
        asm(`(call $__sig_link_impl $0 $1)`, obs, sigIdx);
        let depAddr = i32(POOL_BASE).add(sigIdx.mul(i32(SN_BYTES)));
        let depFlags = asmExpr(`(i32.load $0)`, "i32", depAddr.add(i32(12)));
        let depIsComputed = depFlags.and(i32(F_COMPUTED));
        If(depIsComputed.ne(i32(0)), () => {
          let depHeight = asmExpr(`(i32.load $0)`, "i32", depAddr.add(i32(16)));
          let obsAddr = i32(POOL_BASE).add(obs.mul(i32(SN_BYTES)));
          let obsHeight = asmExpr(`(i32.load $0)`, "i32", obsAddr.add(i32(16)));
          If(depHeight.ge(obsHeight), () => {
            asm(`(i32.store $0 $1)`, obsAddr.add(i32(16)), depHeight.add(i32(1)));
          });
          let heapMin = asmExpr(`(i32.load (i32.const ${G_HEAP_MIN}))`, "i32");
          let mayBeDirty = depHeight.ge(heapMin).or(depFlags.and(i32(F_DIRTY | F_CHECK)).ne(i32(0)));
          If(mayBeDirty.ne(i32(0)), () => {
            asm(`(call $__sig_mark_heap)`);
            asm(`(call $__update_if_necessary $0)`, sigIdx);
          });
        });
      });
      i.assign(i.add(i32(1)));
    });
  });

  Fn("__sig_process_writes", {
    params: [{ name: "count", type: "i32" }],
    result: "void",
  }, (count) => {
    let i = i32(0).toVar();
    While(i.lt(count), () => {
      let sigIdx = asmExpr(`(i32.load (i32.add (i32.const ${WRITE_BUF}) (i32.mul $0 (i32.const 4))))`, "i32", i);
      let addr = i32(POOL_BASE).add(sigIdx.mul(i32(SN_BYTES)));
      let subHead = asmExpr(`(i32.load $0)`, "i32", addr.add(i32(4))).toVar();
      While(subHead.ge(i32(0)), () => {
        let lnk = i32(LINK_BASE).add(subHead.mul(i32(LN_BYTES)));
        let subIdx = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(4)));
        asm(`(call $__mark_dirty $0)`, subIdx);
        asm(`(call $__heap_insert $0)`, subIdx);
        let nxt = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(16)));
        subHead.assign(nxt);
      });
      i.assign(i.add(i32(1)));
    });
  });

  Fn("__sig_process_and_flush", {
    params: [{ name: "count", type: "i32" }],
    result: "void",
  }, (count) => {
    asm(`(call $__sig_process_writes $0)`, count);
    asm(`(call $__sig_flush)`);
  });

  Fn("__sig_write", {
    params: [{ name: "sigIdx", type: "i32" }, { name: "newVal", type: "i32" }],
    result: "void",
  }, (sigIdx, newVal) => {
    let addr = i32(POOL_BASE).add(sigIdx.mul(i32(SN_BYTES)));
    let old = asmExpr(`(i32.load $0)`, "i32", addr).toVar();
    If(old.ne(newVal), () => {
      asm(`(i32.store $0 $1)`, addr, newVal);
      let subHead = asmExpr(`(i32.load $0)`, "i32", addr.add(i32(4))).toVar();
      While(subHead.ge(i32(0)), () => {
        let lnk = i32(LINK_BASE).add(subHead.mul(i32(LN_BYTES)));
        let subIdx = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(4)));
        asm(`(call $__mark_dirty $0)`, subIdx);
        asm(`(call $__heap_insert $0)`, subIdx);
        let nxt = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(16)));
        subHead.assign(nxt);
      });
    });
  });

  Fn("__sig_link_impl", {
    params: [{ name: "subIdx", type: "i32" }, { name: "depIdx", type: "i32" }],
    result: "void",
  }, (subIdx, depIdx) => {
    let subAddr = i32(POOL_BASE).add(subIdx.mul(i32(SN_BYTES)));
    let depHead = asmExpr(`(i32.load $0)`, "i32", subAddr.add(i32(8))).toVar();
    If(depHead.ge(i32(0)), () => {
      let headLnk = i32(LINK_BASE).add(depHead.mul(i32(LN_BYTES)));
      let headDep = asmExpr(`(i32.load $0)`, "i32", headLnk);
      If(headDep.eq(depIdx), () => { asm(`(return)`); });
    });
    While(depHead.ge(i32(0)), () => {
      let lnk = i32(LINK_BASE).add(depHead.mul(i32(LN_BYTES)));
      let existingDep = asmExpr(`(i32.load $0)`, "i32", lnk);
      If(existingDep.eq(depIdx), () => { asm(`(return)`); });
      let nxt = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(8)));
      depHead.assign(nxt);
    });
    let lc = asmExpr(`(i32.load (i32.const ${G_LINK_COUNT}))`, "i32").toVar();
    asm(`(i32.store (i32.const ${G_LINK_COUNT}) $0)`, lc.add(i32(1)));
    let laddr = i32(LINK_BASE).add(lc.mul(i32(LN_BYTES)));
    asm(`(i32.store $0 $1)`, laddr, depIdx);
    asm(`(i32.store $0 $1)`, laddr.add(i32(4)), subIdx);
    let depAddr = i32(POOL_BASE).add(depIdx.mul(i32(SN_BYTES)));
    let curSubHead = asmExpr(`(i32.load $0)`, "i32", depAddr.add(i32(4)));
    asm(`(i32.store $0 $1)`, laddr.add(i32(12)), i32(-1));
    asm(`(i32.store $0 $1)`, laddr.add(i32(16)), curSubHead);
    If(curSubHead.ge(i32(0)), () => {
      asm(`(i32.store $0 $1)`,
        i32(LINK_BASE).add(curSubHead.mul(i32(LN_BYTES))).add(i32(12)), lc);
    });
    asm(`(i32.store $0 $1)`, depAddr.add(i32(4)), lc);
    let curSubDeps = asmExpr(`(i32.load $0)`, "i32", subAddr.add(i32(8)));
    asm(`(i32.store $0 $1)`, laddr.add(i32(20)), i32(-1));
    asm(`(i32.store $0 $1)`, laddr.add(i32(8)), curSubDeps);
    If(curSubDeps.ge(i32(0)), () => {
      asm(`(i32.store $0 $1)`,
        i32(LINK_BASE).add(curSubDeps.mul(i32(LN_BYTES))).add(i32(20)), lc);
    });
    asm(`(i32.store $0 $1)`, subAddr.add(i32(8)), lc);
  });

  Fn("__sig_mark_heap", { result: "void" }, () => {
    let h = asmExpr(`(i32.load (i32.const ${G_HEAP_MIN}))`, "i32").toVar();
    let maxH = asmExpr(`(i32.load (i32.const ${G_HEAP_MAX}))`, "i32");
    While(h.le(maxH), () => {
      let headAddr = i32(HEAP_BASE).add(h.mul(i32(4)));
      let node = asmExpr(`(i32.load $0)`, "i32", headAddr).toVar();
      While(node.ge(i32(0)), () => {
        asm(`(call $__mark_dirty $0)`, node);
        let nxt = asmExpr(`(i32.load $0)`, "i32", i32(POOL_BASE).add(node.mul(i32(SN_BYTES))).add(i32(20)));
        node.assign(nxt);
      });
      h.assign(h.add(i32(1)));
    });
  });

  function removeStaleDepsFwd(stale: Node<"i32">, sigIdx: Node<"i32">, addr: Node<"i32">): void {
    let s = stale.toVar();
    While(s.ge(i32(0)), () => {
      let lnk = i32(LINK_BASE).add(s.mul(i32(LN_BYTES)));
      let linkSub = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(4)));
      let stillNeeded = linkSub.eq(sigIdx).ne(i32(0));
      If(stillNeeded, () => {
        let nxt = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(8)));
        s.assign(nxt);
      }).Else(() => {
        let depIdx = asmExpr(`(i32.load $0)`, "i32", lnk);
        let prevSub = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(12)));
        let nextSub = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(16)));
        let prevDep = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(20)));
        let nextDep = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(8)));
        let nxt = nextDep;
        let depAddr = i32(POOL_BASE).add(depIdx.mul(i32(SN_BYTES)));
        If(prevSub.ge(i32(0)), () => {
          asm(`(i32.store $0 $1)`, i32(LINK_BASE).add(prevSub.mul(i32(LN_BYTES))).add(i32(16)), nextSub);
        }).Else(() => {
          asm(`(i32.store $0 $1)`, depAddr.add(i32(4)), nextSub);
        });
        If(nextSub.ge(i32(0)), () => {
          asm(`(i32.store $0 $1)`, i32(LINK_BASE).add(nextSub.mul(i32(LN_BYTES))).add(i32(12)), prevSub);
        });
        If(prevDep.ge(i32(0)), () => {
          asm(`(i32.store $0 $1)`, i32(LINK_BASE).add(prevDep.mul(i32(LN_BYTES))).add(i32(8)), nextDep);
        }).Else(() => {
          asm(`(i32.store $0 $1)`, addr.add(i32(8)), nextDep);
        });
        If(nextDep.ge(i32(0)), () => {
          asm(`(i32.store $0 $1)`, i32(LINK_BASE).add(nextDep.mul(i32(LN_BYTES))).add(i32(20)), prevDep);
        });
        s.assign(nxt);
      });
    });
  }

  function recomputeAndNotify(node: Node<"i32">, addr: Node<"i32">): void {
    let newVal = asmExpr(`(call $bridge_recompute $0)`, "i32", node);
    asm(`(i32.store $0 $1)`, addr, newVal);
    let newSubs = asmExpr(`(i32.load $0)`, "i32", addr.add(i32(4)));
    If(newSubs.ge(i32(0)), () => {
      let sl = newSubs.toVar();
      While(sl.ge(i32(0)), () => {
        let lnk = i32(LINK_BASE).add(sl.mul(i32(LN_BYTES)));
        let si = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(4)));
        asm(`(call $__heap_insert $0)`, si);
        let nxt = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(16)));
        sl.assign(nxt);
      });
    });
  }

  Fn("__sig_flush", { result: "void" }, () => {
    let h = asmExpr(`(i32.load (i32.const ${G_HEAP_MIN}))`, "i32").toVar();
    let maxH = asmExpr(`(i32.load (i32.const ${G_HEAP_MAX}))`, "i32").toVar();
    asm(`(i32.store (i32.const ${G_HEAP_MAX}) (i32.const -1))`);
    asm(`(i32.store (i32.const ${G_HEAP_MIN}) (i32.const 0))`);
    asm(`(i32.store (i32.const ${G_EFFECT_COUNT}) (i32.const 0))`);
    let nextMax = maxH;
    While(h.le(nextMax), () => {
      let headAddr = i32(HEAP_BASE).add(h.mul(i32(4)));
      let node = asmExpr(`(i32.load $0)`, "i32", headAddr).toVar();
      asm(`(i32.store $0 (i32.const -1))`, headAddr);
      While(node.ge(i32(0)), () => {
        let addr = i32(POOL_BASE).add(node.mul(i32(SN_BYTES)));
        let nxt = asmExpr(`(i32.load $0)`, "i32", addr.add(i32(20))).toVar();
        asm(`(i32.store $0 (i32.const -1))`, addr.add(i32(20)));
        let flags = asmExpr(`(i32.load $0)`, "i32", addr.add(i32(12)));
        asm(`(i32.store $0 $1)`, addr.add(i32(12)), flags.and(i32(F_EFFECT | F_COMPUTED | F_HAS_OBJECT)));
        If(flags.and(i32(F_EFFECT)).ne(i32(0)), () => {
          let ec = asmExpr(`(i32.load (i32.const ${G_EFFECT_COUNT}))`, "i32");
          asm(`(i32.store (i32.add (i32.const ${EFFECT_BUF}) (i32.mul $0 (i32.const 4))) $1)`, ec, node);
          asm(`(i32.store (i32.const ${G_EFFECT_COUNT}) (i32.add $0 (i32.const 1)))`, ec);
        });
        If(flags.and(i32(F_COMPUTED)).ne(i32(0)), () => { recomputeAndNotify(node, addr); });
        let curMax = asmExpr(`(i32.load (i32.const ${G_HEAP_MAX}))`, "i32");
        If(curMax.gt(nextMax), () => { nextMax.assign(curMax); });
        node.assign(nxt);
      });
      h.assign(h.add(i32(1)));
    });
  });

  Fn("__update_if_necessary", {
    params: [{ name: "sigIdx", type: "i32" }],
    result: "void",
  }, (sigIdx) => {
    let addr = i32(POOL_BASE).add(sigIdx.mul(i32(SN_BYTES)));
    let flags = asmExpr(`(i32.load $0)`, "i32", addr.add(i32(12)));
    If(flags.and(i32(F_CHECK)).ne(i32(0)), () => {
      let dep = asmExpr(`(i32.load $0)`, "i32", addr.add(i32(8))).toVar();
      While(dep.ge(i32(0)), () => {
        let lnk = i32(LINK_BASE).add(dep.mul(i32(LN_BYTES)));
        let depIdx = asmExpr(`(i32.load $0)`, "i32", lnk);
        asm(`(call $__update_if_necessary $0)`, depIdx);
        let curFlags = asmExpr(`(i32.load $0)`, "i32", addr.add(i32(12)));
        If(curFlags.and(i32(F_DIRTY)).ne(i32(0)), () => { dep.assign(i32(-1)); }).Else(() => {
          let nxt = asmExpr(`(i32.load $0)`, "i32", lnk.add(i32(8)));
          dep.assign(nxt);
        });
      });
    });
    If(asmExpr(`(i32.load $0)`, "i32", addr.add(i32(12))).and(i32(F_DIRTY)).ne(i32(0)), () => {
      recomputeAndNotify(sigIdx, addr);
    });
    let clearFlags = asmExpr(`(i32.load $0)`, "i32", addr.add(i32(12)));
    asm(`(i32.store $0 $1)`, addr.add(i32(12)), clearFlags.and(i32(F_EFFECT | F_COMPUTED | F_HAS_OBJECT)));
  });

  Fn("__sig_get_value", {
    params: [{ name: "sigIdx", type: "i32" }],
    result: "i32",
  }, (sigIdx) => {
    let addr = i32(POOL_BASE).add(sigIdx.mul(i32(SN_BYTES)));
    return asmExpr(`(i32.load $0)`, "i32", addr);
  });

  Fn("__sig_set_observer", {
    params: [{ name: "idx", type: "i32" }],
    result: "void",
  }, (idx) => {
    asm(`(i32.store (i32.const ${G_OBSERVER}) $0)`, idx);
  });

  Fn("__sig_get_observer", { result: "i32" }, () => {
    return asmExpr(`(i32.load (i32.const ${G_OBSERVER}))`, "i32");
  });
}

export function compileEngine(): string {
  let wat = compileWAT({
    exports: [
      "__sig_init", "__sig_alloc_signal", "__sig_alloc_effect", "__sig_alloc_computed",
      "__sig_read", "__sig_flush", "__sig_get_value",
      "__sig_track_store", "__sig_process_tracking", "__sig_process_and_flush",
      "__sig_set_observer", "__sig_get_observer",
      "__sig_link_impl", "__heap_insert", "__mark_dirty",
      "__sig_mark_heap", "__update_if_necessary",
    ],
    memoryPages: MEMORY_PAGES,
  });
  const imports = `
  (import "bridge" "recompute" (func $bridge_recompute (param i32) (result i32)))
`;
  return wat.replace("(module", `(module${imports}`);
}
