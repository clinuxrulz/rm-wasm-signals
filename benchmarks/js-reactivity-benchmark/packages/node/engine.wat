(module
  (import "bridge" "recompute" (func $bridge_recompute (param i32) (result i32)))

  (memory (export "memory") 4096)
  (global $__stack_ptr (mut i32) (i32.const 268435448))


  (func $__sig_init
    (local $_v0 i32)
    (i32.store (i32.const 0) (i32.const 0))
    (i32.store (i32.const 4) (i32.const 0))
    (i32.store (i32.const 8) (i32.const 0))
    (i32.store (i32.const 12) (i32.const 0))
    (i32.store (i32.const 16) (i32.const 0))
    (i32.store (i32.const 20) (i32.const -1))
    (i32.store (i32.const 24) (i32.const 0))
    (local.set $_v0 (i32.const 0))
    (block $while_exit_0
      (loop $while_cont_0
        (br_if $while_exit_0 (i32.eqz (i32.lt_s (local.get $_v0) (i32.const 128))))
        (i32.store (i32.add (i32.const 64) (i32.mul (local.get $_v0) (i32.const 4))) (i32.const -1))
        (local.set $_v0 (i32.add (local.get $_v0) (i32.const 1)))
        (br $while_cont_0)
      )
    )
  )

  (func $__sig_alloc_signal (param $initialId i32) (result i32)
    (local $_v1 i32)
    (local.set $_v1 (i32.load (i32.const 8)))
    (i32.store (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (local.get $initialId))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 4)) (i32.const -1))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 8)) (i32.const -1))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 12)) (i32.const 0))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 16)) (i32.const 0))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 20)) (i32.const -1))
    (i32.store (i32.const 8) (i32.add (i32.load (i32.const 8)) (i32.const 1)))
    (local.get $_v1)
  )

  (func $__sig_alloc_effect (param $initialId i32) (result i32)
    (local $_v2 i32)
    (local.set $_v2 (i32.load (i32.const 8)))
    (i32.store (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (local.get $initialId))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 4)) (i32.const -1))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 8)) (i32.const -1))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 12)) (i32.const 1))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 16)) (i32.const 0))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 20)) (i32.const -1))
    (i32.store (i32.const 8) (i32.add (i32.load (i32.const 8)) (i32.const 1)))
    (local.get $_v2)
  )

  (func $__sig_alloc_computed (param $initialId i32) (result i32)
    (local $_v3 i32)
    (local.set $_v3 (i32.load (i32.const 8)))
    (i32.store (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (local.get $initialId))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 4)) (i32.const -1))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 8)) (i32.const -1))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 12)) (i32.const 2))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 16)) (i32.const 0))
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 8)) (i32.const 24))) (i32.const 20)) (i32.const -1))
    (i32.store (i32.const 8) (i32.add (i32.load (i32.const 8)) (i32.const 1)))
    (local.get $_v3)
  )

  (func $__heap_insert (param $sigIdx i32)
    (if
      (i32.eq (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12))) (i32.const 16)) (i32.const 0))
      (then
        (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12)) (i32.or (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12))) (i32.const 16)))
        (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 20)) (i32.load (i32.add (i32.const 64) (i32.mul (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 16))) (i32.const 4)))))
        (i32.store (i32.add (i32.const 64) (i32.mul (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 16))) (i32.const 4))) (local.get $sigIdx))
        (if
          (i32.gt_s (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 16))) (i32.load (i32.const 20)))
          (then
            (i32.store (i32.const 20) (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 16))))
          )
        )
        (if
          (i32.lt_s (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 16))) (i32.load (i32.const 16)))
          (then
            (i32.store (i32.const 16) (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 16))))
          )
        )
      )
    )
  )

  (func $__mark_dirty (param $sigIdx i32)
    (local $_v4 i32)
    (if
      (i32.lt_s (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12))) (i32.const 12)) (i32.const 4))
      (then
        (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12)) (i32.or (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12))) (i32.const 4)))
        (if
          (i32.ne (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12))) (i32.const 3)) (i32.const 0))
          (then
            (local.set $_v4 (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 4))))
            (block $while_exit_0
              (loop $while_cont_0
                (br_if $while_exit_0 (i32.eqz (i32.ge_s (local.get $_v4) (i32.const 0))))
                (if
                  (i32.lt_s (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v4) (i32.const 24))) (i32.const 4))) (i32.const 24))) (i32.const 12))) (i32.const 12)) (i32.const 8))
                  (then
                    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v4) (i32.const 24))) (i32.const 4))) (i32.const 24))) (i32.const 12)) (i32.or (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v4) (i32.const 24))) (i32.const 4))) (i32.const 24))) (i32.const 12))) (i32.const 8)))
                  )
                )
                (local.set $_v4 (i32.load (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v4) (i32.const 24))) (i32.const 16))))
                (br $while_cont_0)
              )
            )
          )
        )
      )
    )
  )

  (func $__sig_read (param $sigIdx i32) (result i32)
    (if
      (i32.ne (i32.load (i32.const 0)) (i32.const 0))
      (then
        (call $__sig_link_impl (i32.load (i32.const 0)) (local.get $sigIdx))
        (if
          (i32.ne (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12))) (i32.const 2)) (i32.const 0))
          (then
            (if
              (i32.ge_s (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 16))) (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 0)) (i32.const 24))) (i32.const 16))))
              (then
                (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 0)) (i32.const 24))) (i32.const 16)) (i32.add (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 16))) (i32.const 1)))
              )
            )
            (if
              (i32.ne (i32.or (i32.ge_s (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 16))) (i32.load (i32.const 16))) (i32.ne (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12))) (i32.const 12)) (i32.const 0))) (i32.const 0))
              (then
                (call $__sig_mark_heap)
                (call $__update_if_necessary (local.get $sigIdx))
              )
            )
          )
        )
      )
    )
    (i32.load (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))))
  )

  (func $__sig_track_store (param $sigIdx i32)
    (if
      (i32.ne (i32.load (i32.const 0)) (i32.const 0))
      (then
        (call $__sig_link_impl (i32.load (i32.const 0)) (local.get $sigIdx))
        (if
          (i32.ne (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12))) (i32.const 2)) (i32.const 0))
          (then
            (if
              (i32.ge_s (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 16))) (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 0)) (i32.const 24))) (i32.const 16))))
              (then
                (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 0)) (i32.const 24))) (i32.const 16)) (i32.add (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 16))) (i32.const 1)))
              )
            )
            (if
              (i32.ne (i32.or (i32.ge_s (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 16))) (i32.load (i32.const 16))) (i32.ne (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12))) (i32.const 12)) (i32.const 0))) (i32.const 0))
              (then
                (call $__sig_mark_heap)
                (call $__update_if_necessary (local.get $sigIdx))
              )
            )
          )
        )
      )
    )
    (i32.store (i32.const 28) (i32.load (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24)))))
  )

  (func $__sig_process_tracking (param $count i32)
    (local $_v5 i32)
    (local.set $_v5 (i32.const 0))
    (block $while_exit_0
      (loop $while_cont_0
        (br_if $while_exit_0 (i32.eqz (i32.lt_s (local.get $_v5) (local.get $count))))
        (if
          (i32.ne (i32.load (i32.const 0)) (i32.const 0))
          (then
            (call $__sig_link_impl (i32.load (i32.const 0)) (i32.load (i32.add (i32.const 262720) (i32.mul (local.get $_v5) (i32.const 4)))))
            (if
              (i32.ne (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.add (i32.const 262720) (i32.mul (local.get $_v5) (i32.const 4)))) (i32.const 24))) (i32.const 12))) (i32.const 2)) (i32.const 0))
              (then
                (if
                  (i32.ge_s (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.add (i32.const 262720) (i32.mul (local.get $_v5) (i32.const 4)))) (i32.const 24))) (i32.const 16))) (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 0)) (i32.const 24))) (i32.const 16))))
                  (then
                    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.const 0)) (i32.const 24))) (i32.const 16)) (i32.add (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.add (i32.const 262720) (i32.mul (local.get $_v5) (i32.const 4)))) (i32.const 24))) (i32.const 16))) (i32.const 1)))
                  )
                )
                (if
                  (i32.ne (i32.or (i32.ge_s (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.add (i32.const 262720) (i32.mul (local.get $_v5) (i32.const 4)))) (i32.const 24))) (i32.const 16))) (i32.load (i32.const 16))) (i32.ne (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (i32.load (i32.add (i32.const 262720) (i32.mul (local.get $_v5) (i32.const 4)))) (i32.const 24))) (i32.const 12))) (i32.const 12)) (i32.const 0))) (i32.const 0))
                  (then
                    (call $__sig_mark_heap)
                    (call $__update_if_necessary (i32.load (i32.add (i32.const 262720) (i32.mul (local.get $_v5) (i32.const 4)))))
                  )
                )
              )
            )
          )
        )
        (local.set $_v5 (i32.add (local.get $_v5) (i32.const 1)))
        (br $while_cont_0)
      )
    )
  )

  (func $__sig_write (param $sigIdx i32) (param $newVal i32)
    (local $_v6 i32)
    (local $_v7 i32)
    (local.set $_v6 (i32.load (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24)))))
    (if
      (i32.ne (local.get $_v6) (local.get $newVal))
      (then
        (i32.store (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (local.get $newVal))
        (local.set $_v7 (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 4))))
        (block $while_exit_0
          (loop $while_cont_0
            (br_if $while_exit_0 (i32.eqz (i32.ge_s (local.get $_v7) (i32.const 0))))
            (call $__mark_dirty (i32.load (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v7) (i32.const 24))) (i32.const 4))))
            (call $__heap_insert (i32.load (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v7) (i32.const 24))) (i32.const 4))))
            (local.set $_v7 (i32.load (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v7) (i32.const 24))) (i32.const 16))))
            (br $while_cont_0)
          )
        )
      )
    )
  )

  (func $__sig_link_impl (param $subIdx i32) (param $depIdx i32)
    (local $_v8 i32)
    (local $_v9 i32)
    (local.set $_v8 (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $subIdx) (i32.const 24))) (i32.const 8))))
    (if
      (i32.ge_s (local.get $_v8) (i32.const 0))
      (then
        (if
          (i32.eq (i32.load (i32.add (i32.const 100930112) (i32.mul (local.get $_v8) (i32.const 24)))) (local.get $depIdx))
          (then
            (return)
          )
        )
      )
    )
    (block $while_exit_0
      (loop $while_cont_0
        (br_if $while_exit_0 (i32.eqz (i32.ge_s (local.get $_v8) (i32.const 0))))
        (if
          (i32.eq (i32.load (i32.add (i32.const 100930112) (i32.mul (local.get $_v8) (i32.const 24)))) (local.get $depIdx))
          (then
            (return)
          )
        )
        (local.set $_v8 (i32.load (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v8) (i32.const 24))) (i32.const 8))))
        (br $while_cont_0)
      )
    )
    (local.set $_v9 (i32.load (i32.const 12)))
    (i32.store (i32.const 12) (i32.add (local.get $_v9) (i32.const 1)))
    (i32.store (i32.add (i32.const 100930112) (i32.mul (local.get $_v9) (i32.const 24))) (local.get $depIdx))
    (i32.store (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v9) (i32.const 24))) (i32.const 4)) (local.get $subIdx))
    (i32.store (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v9) (i32.const 24))) (i32.const 12)) (i32.const -1))
    (i32.store (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v9) (i32.const 24))) (i32.const 16)) (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $depIdx) (i32.const 24))) (i32.const 4))))
    (if
      (i32.ge_s (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $depIdx) (i32.const 24))) (i32.const 4))) (i32.const 0))
      (then
        (i32.store (i32.add (i32.add (i32.const 100930112) (i32.mul (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $depIdx) (i32.const 24))) (i32.const 4))) (i32.const 24))) (i32.const 12)) (local.get $_v9))
      )
    )
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $depIdx) (i32.const 24))) (i32.const 4)) (local.get $_v9))
    (i32.store (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v9) (i32.const 24))) (i32.const 20)) (i32.const -1))
    (i32.store (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v9) (i32.const 24))) (i32.const 8)) (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $subIdx) (i32.const 24))) (i32.const 8))))
    (if
      (i32.ge_s (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $subIdx) (i32.const 24))) (i32.const 8))) (i32.const 0))
      (then
        (i32.store (i32.add (i32.add (i32.const 100930112) (i32.mul (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $subIdx) (i32.const 24))) (i32.const 8))) (i32.const 24))) (i32.const 20)) (local.get $_v9))
      )
    )
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $subIdx) (i32.const 24))) (i32.const 8)) (local.get $_v9))
  )

  (func $__sig_mark_heap
    (local $_v10 i32)
    (local $_v11 i32)
    (local.set $_v10 (i32.load (i32.const 16)))
    (block $while_exit_0
      (loop $while_cont_0
        (br_if $while_exit_0 (i32.eqz (i32.le_s (local.get $_v10) (i32.load (i32.const 20)))))
        (local.set $_v11 (i32.load (i32.add (i32.const 64) (i32.mul (local.get $_v10) (i32.const 4)))))
        (block $while_exit_1
          (loop $while_cont_1
            (br_if $while_exit_1 (i32.eqz (i32.ge_s (local.get $_v11) (i32.const 0))))
            (call $__mark_dirty (local.get $_v11))
            (local.set $_v11 (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $_v11) (i32.const 24))) (i32.const 20))))
            (br $while_cont_1)
          )
        )
        (local.set $_v10 (i32.add (local.get $_v10) (i32.const 1)))
        (br $while_cont_0)
      )
    )
  )

  (func $__sig_flush
    (local $_v12 i32)
    (local $_v13 i32)
    (local $_v14 i32)
    (local $_v16 i32)
    (local $_v15 i32)
    (local.set $_v12 (i32.load (i32.const 16)))
    (local.set $_v13 (i32.load (i32.const 20)))
    (i32.store (i32.const 20) (i32.const -1))
    (i32.store (i32.const 16) (i32.const 0))
    (i32.store (i32.const 24) (i32.const 0))
    (block $while_exit_0
      (loop $while_cont_0
        (br_if $while_exit_0 (i32.eqz (i32.le_s (local.get $_v12) (local.get $_v13))))
        (local.set $_v14 (i32.load (i32.add (i32.const 64) (i32.mul (local.get $_v12) (i32.const 4)))))
        (i32.store (i32.add (i32.const 64) (i32.mul (local.get $_v12) (i32.const 4))) (i32.const -1))
        (block $while_exit_1
          (loop $while_cont_1
            (br_if $while_exit_1 (i32.eqz (i32.ge_s (local.get $_v14) (i32.const 0))))
            (local.set $_v15 (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $_v14) (i32.const 24))) (i32.const 20))))
            (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $_v14) (i32.const 24))) (i32.const 20)) (i32.const -1))
            (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $_v14) (i32.const 24))) (i32.const 12)) (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $_v14) (i32.const 24))) (i32.const 12))) (i32.const 3)))
            (if
              (i32.ne (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $_v14) (i32.const 24))) (i32.const 12))) (i32.const 1)) (i32.const 0))
              (then
                (i32.store (i32.add (i32.const 576) (i32.mul (i32.load (i32.const 24)) (i32.const 4))) (local.get $_v14))
                (i32.store (i32.const 24) (i32.add (i32.load (i32.const 24)) (i32.const 1)))
              )
            )
            (if
              (i32.ne (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $_v14) (i32.const 24))) (i32.const 12))) (i32.const 2)) (i32.const 0))
              (then
                (i32.store (i32.add (i32.const 266816) (i32.mul (local.get $_v14) (i32.const 24))) (call $bridge_recompute (local.get $_v14)))
                (if
                  (i32.ge_s (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $_v14) (i32.const 24))) (i32.const 4))) (i32.const 0))
                  (then
                    (local.set $_v16 (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $_v14) (i32.const 24))) (i32.const 4))))
                    (block $while_exit_2
                      (loop $while_cont_2
                        (br_if $while_exit_2 (i32.eqz (i32.ge_s (local.get $_v16) (i32.const 0))))
                        (call $__heap_insert (i32.load (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v16) (i32.const 24))) (i32.const 4))))
                        (local.set $_v16 (i32.load (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v16) (i32.const 24))) (i32.const 16))))
                        (br $while_cont_2)
                      )
                    )
                  )
                )
              )
            )
            (if
              (i32.gt_s (i32.load (i32.const 20)) (local.get $_v13))
              (then
                (local.set $_v13 (i32.load (i32.const 20)))
              )
            )
            (local.set $_v14 (local.get $_v15))
            (br $while_cont_1)
          )
        )
        (local.set $_v12 (i32.add (local.get $_v12) (i32.const 1)))
        (br $while_cont_0)
      )
    )
  )

  (func $__update_if_necessary (param $sigIdx i32)
    (local $_v17 i32)
    (local $_v18 i32)
    (if
      (i32.ne (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12))) (i32.const 8)) (i32.const 0))
      (then
        (local.set $_v17 (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 8))))
        (block $while_exit_0
          (loop $while_cont_0
            (br_if $while_exit_0 (i32.eqz (i32.ge_s (local.get $_v17) (i32.const 0))))
            (call $__update_if_necessary (i32.load (i32.add (i32.const 100930112) (i32.mul (local.get $_v17) (i32.const 24)))))
            (if
              (i32.ne (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12))) (i32.const 4)) (i32.const 0))
              (then
                (local.set $_v17 (i32.const -1))
              )
              (else
                (local.set $_v17 (i32.load (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v17) (i32.const 24))) (i32.const 8))))
              )
            )
            (br $while_cont_0)
          )
        )
      )
    )
    (if
      (i32.ne (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12))) (i32.const 4)) (i32.const 0))
      (then
        (i32.store (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (call $bridge_recompute (local.get $sigIdx)))
        (if
          (i32.ge_s (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 4))) (i32.const 0))
          (then
            (local.set $_v18 (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 4))))
            (block $while_exit_1
              (loop $while_cont_1
                (br_if $while_exit_1 (i32.eqz (i32.ge_s (local.get $_v18) (i32.const 0))))
                (call $__heap_insert (i32.load (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v18) (i32.const 24))) (i32.const 4))))
                (local.set $_v18 (i32.load (i32.add (i32.add (i32.const 100930112) (i32.mul (local.get $_v18) (i32.const 24))) (i32.const 16))))
                (br $while_cont_1)
              )
            )
          )
        )
      )
    )
    (i32.store (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12)) (i32.and (i32.load (i32.add (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))) (i32.const 12))) (i32.const 3)))
  )

  (func $__sig_get_value (param $sigIdx i32) (result i32)
    (i32.load (i32.add (i32.const 266816) (i32.mul (local.get $sigIdx) (i32.const 24))))
  )

  (func $__sig_set_observer (param $idx i32)
    (i32.store (i32.const 0) (local.get $idx))
  )

  (func $__sig_get_observer (result i32)
    (i32.load (i32.const 0))
  )
  (export "__sig_init" (func $__sig_init))
  (export "__sig_alloc_signal" (func $__sig_alloc_signal))
  (export "__sig_alloc_effect" (func $__sig_alloc_effect))
  (export "__sig_alloc_computed" (func $__sig_alloc_computed))
  (export "__sig_read" (func $__sig_read))
  (export "__sig_write" (func $__sig_write))
  (export "__sig_flush" (func $__sig_flush))
  (export "__sig_get_value" (func $__sig_get_value))
  (export "__sig_track_store" (func $__sig_track_store))
  (export "__sig_process_tracking" (func $__sig_process_tracking))
  (export "__sig_set_observer" (func $__sig_set_observer))
  (export "__sig_get_observer" (func $__sig_get_observer))
  (export "__sig_link_impl" (func $__sig_link_impl))
  (export "__heap_insert" (func $__heap_insert))
  (export "__mark_dirty" (func $__mark_dirty))
  (export "__sig_mark_heap" (func $__sig_mark_heap))
  (export "__update_if_necessary" (func $__update_if_necessary))
)