(module
 (import "env" "memory" (memory $0 32 256))
 (import "ext" "hpbTranslateOffset" (global $hpbTranslateOffset$asm2wasm$import i32))
 (import "ext" "hpbPatternsOffset" (global $hpbPatternsOffset$asm2wasm$import i32))
 (import "ext" "patternsLength" (global $patternsLength$asm2wasm$import i32))
 (import "ext" "charMapOffset" (global $charMapOffset$asm2wasm$import i32))
 (import "ext" "valueStoreOffset" (global $valueStoreOffset$asm2wasm$import i32))
 (import "ext" "patternTrieOffset" (global $patternTrieOffset$asm2wasm$import i32))
 (import "ext" "wordOffset" (global $wordOffset$asm2wasm$import i32))
 (import "ext" "hyphenPointsOffset" (global $hyphenPointsOffset$asm2wasm$import i32))
 (global $hpbTranslateOffset (mut i32) (get_global $hpbTranslateOffset$asm2wasm$import))
 (global $hpbPatternsOffset (mut i32) (get_global $hpbPatternsOffset$asm2wasm$import))
 (global $patternsLength (mut i32) (get_global $patternsLength$asm2wasm$import))
 (global $charMapOffset (mut i32) (get_global $charMapOffset$asm2wasm$import))
 (global $valueStoreOffset (mut i32) (get_global $valueStoreOffset$asm2wasm$import))
 (global $patternTrieOffset (mut i32) (get_global $patternTrieOffset$asm2wasm$import))
 (global $wordOffset (mut i32) (get_global $wordOffset$asm2wasm$import))
 (global $hyphenPointsOffset (mut i32) (get_global $hyphenPointsOffset$asm2wasm$import))
 (global $trieRowLength (mut i32) (i32.const 0))
 (export "convert" (func $convert))
 (export "hyphenate" (func $hyphenate))
 (func $createTranslateLookUpTable (; 0 ;)
  (local $0 i32)
  (local $1 i32)
  (set_local $0
   (i32.add
    (get_global $hpbTranslateOffset)
    (i32.const 2)
   )
  )
  (set_local $1
   (i32.const 12)
  )
  (set_global $trieRowLength
   (i32.shl
    (i32.load16_u
     (get_global $hpbTranslateOffset)
    )
    (i32.const 1)
   )
  )
  (loop $while-in
   (if
    (i32.lt_s
     (get_local $0)
     (get_global $hpbPatternsOffset)
    )
    (block
     (if
      (i32.load16_u
       (i32.add
        (get_global $charMapOffset)
        (i32.shl
         (i32.load16_u offset=2
          (get_local $0)
         )
         (i32.const 1)
        )
       )
      )
      (i32.store16
       (i32.add
        (get_global $charMapOffset)
        (i32.shl
         (i32.load16_u
          (get_local $0)
         )
         (i32.const 1)
        )
       )
       (i32.load16_u
        (i32.add
         (get_global $charMapOffset)
         (i32.shl
          (i32.load16_u offset=2
           (get_local $0)
          )
          (i32.const 1)
         )
        )
       )
      )
      (block
       (i32.store16
        (i32.add
         (get_global $charMapOffset)
         (i32.shl
          (i32.load16_u
           (get_local $0)
          )
          (i32.const 1)
         )
        )
        (get_local $1)
       )
       (if
        (i32.load16_u offset=2
         (get_local $0)
        )
        (i32.store16
         (i32.add
          (get_global $charMapOffset)
          (i32.shl
           (i32.load16_u offset=2
            (get_local $0)
           )
           (i32.const 1)
          )
         )
         (get_local $1)
        )
       )
       (set_local $1
        (i32.add
         (get_local $1)
         (i32.const 1)
        )
       )
      )
     )
     (set_local $0
      (i32.add
       (get_local $0)
       (i32.const 4)
      )
     )
     (br $while-in)
    )
   )
  )
 )
 (func $convert (; 1 ;)
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  (local $13 i32)
  (set_local $9
   (tee_local $0
    (i32.add
     (get_global $valueStoreOffset)
     (i32.const 1)
    )
   )
  )
  (set_local $1
   (get_local $0)
  )
  (call $createTranslateLookUpTable)
  (set_local $13
   (get_global $hpbPatternsOffset)
  )
  (set_local $7
   (i32.add
    (get_global $hpbPatternsOffset)
    (get_global $patternsLength)
   )
  )
  (loop $while-in
   (if
    (i32.lt_s
     (get_local $13)
     (get_local $7)
    )
    (block
     (if
      (i32.eq
       (tee_local $4
        (i32.load8_u
         (get_local $13)
        )
       )
       (i32.const 58)
      )
      (set_local $8
       (i32.eqz
        (get_local $8)
       )
      )
      (if
       (i32.eq
        (get_local $8)
        (i32.const 1)
       )
       (set_local $2
        (get_local $4)
       )
       (block
        (set_local $12
         (i32.add
          (get_local $12)
          (i32.const 1)
         )
        )
        (if
         (i32.gt_s
          (get_local $4)
          (i32.const 11)
         )
         (block
          (if
           (i32.eqz
            (get_local $11)
           )
           (set_local $1
            (i32.add
             (get_local $1)
             (i32.const 1)
            )
           )
          )
          (set_local $11
           (i32.const 0)
          )
          (if
           (i32.eq
            (get_local $5)
            (i32.const -1)
           )
           (i32.store
            (i32.add
             (i32.add
              (get_global $patternTrieOffset)
              (get_local $3)
             )
             (get_local $10)
            )
            (tee_local $5
             (tee_local $6
              (i32.add
               (get_local $6)
               (i32.shl
                (i32.add
                 (get_global $trieRowLength)
                 (i32.const 1)
                )
                (i32.const 2)
               )
              )
             )
            )
           )
          )
          (if
           (i32.eqz
            (tee_local $5
             (i32.load
              (i32.add
               (i32.add
                (get_global $patternTrieOffset)
                (tee_local $3
                 (get_local $5)
                )
               )
               (tee_local $10
                (i32.shl
                 (i32.sub
                  (get_local $4)
                  (i32.const 12)
                 )
                 (i32.const 3)
                )
               )
              )
             )
            )
           )
           (block
            (i32.store
             (i32.add
              (i32.add
               (get_global $patternTrieOffset)
               (get_local $3)
              )
              (get_local $10)
             )
             (i32.const -1)
            )
            (set_local $5
             (i32.const -1)
            )
           )
          )
         )
         (block
          (i32.store8
           (get_local $1)
           (get_local $4)
          )
          (set_local $1
           (i32.add
            (tee_local $0
             (get_local $1)
            )
            (i32.const 1)
           )
          )
          (set_local $11
           (i32.const 1)
          )
         )
        )
        (if
         (i32.eq
          (get_local $12)
          (get_local $2)
         )
         (block
          (i32.store8 offset=1
           (get_local $0)
           (i32.const 255)
          )
          (i32.store offset=4
           (i32.add
            (i32.add
             (get_global $patternTrieOffset)
             (get_local $3)
            )
            (get_local $10)
           )
           (i32.sub
            (get_local $9)
            (get_global $valueStoreOffset)
           )
          )
          (set_local $1
           (tee_local $9
            (i32.add
             (get_local $0)
             (i32.const 2)
            )
           )
          )
          (set_local $12
           (i32.const 0)
          )
          (set_local $3
           (i32.const 0)
          )
          (set_local $5
           (i32.const 0)
          )
          (set_local $11
           (i32.const 0)
          )
         )
        )
       )
      )
     )
     (set_local $13
      (i32.add
       (get_local $13)
       (i32.const 1)
      )
     )
     (br $while-in)
    )
   )
  )
 )
 (func $hyphenate (; 2 ;)
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (set_local $4
   (i32.shl
    (i32.load8_u
     (get_global $wordOffset)
    )
    (i32.const 1)
   )
  )
  (set_local $8
   (i32.add
    (get_global $wordOffset)
    (i32.const 2)
   )
  )
  (loop $while-in
   (if
    (i32.lt_s
     (get_local $1)
     (get_local $4)
    )
    (block
     (i32.store16
      (tee_local $0
       (i32.add
        (get_local $8)
        (get_local $1)
       )
      )
      (i32.shl
       (i32.sub
        (i32.load16_u
         (i32.add
          (get_global $charMapOffset)
          (i32.shl
           (tee_local $7
            (i32.load16_u
             (get_local $0)
            )
           )
           (i32.const 1)
          )
         )
        )
        (i32.const 12)
       )
       (i32.const 3)
      )
     )
     (set_local $1
      (i32.add
       (get_local $1)
       (i32.const 2)
      )
     )
     (br $while-in)
    )
   )
  )
  (loop $while-in1
   (if
    (i32.lt_s
     (get_local $2)
     (i32.add
      (get_local $4)
      (i32.const 1)
     )
    )
    (block
     (i32.store8
      (i32.add
       (get_global $hyphenPointsOffset)
       (get_local $2)
      )
      (i32.const 0)
     )
     (set_local $2
      (i32.add
       (get_local $2)
       (i32.const 1)
      )
     )
     (br $while-in1)
    )
   )
  )
  (loop $while-in3
   (if
    (i32.lt_s
     (get_local $5)
     (get_local $4)
    )
    (block
     (set_local $0
      (i32.const 0)
     )
     (set_local $1
      (get_local $5)
     )
     (loop $while-in5
      (block $while-out4
       (br_if $while-out4
        (i32.ge_s
         (get_local $1)
         (get_local $4)
        )
       )
       (set_local $7
        (i32.load
         (i32.add
          (tee_local $0
           (i32.add
            (get_global $patternTrieOffset)
            (get_local $0)
           )
          )
          (tee_local $3
           (i32.load16_u
            (i32.add
             (get_local $8)
             (get_local $1)
            )
           )
          )
         )
        )
       )
       (if
        (i32.gt_s
         (tee_local $0
          (i32.load offset=4
           (i32.add
            (get_local $0)
            (get_local $3)
           )
          )
         )
         (i32.const 0)
        )
        (block
         (set_local $3
          (i32.const 0)
         )
         (set_local $6
          (i32.load8_u
           (i32.add
            (get_global $valueStoreOffset)
            (get_local $0)
           )
          )
         )
         (loop $while-in7
          (if
           (i32.ne
            (get_local $6)
            (i32.const 255)
           )
           (block
            (if
             (i32.gt_s
              (get_local $6)
              (i32.load8_u
               (tee_local $2
                (i32.add
                 (i32.add
                  (get_global $hyphenPointsOffset)
                  (i32.shr_s
                   (get_local $5)
                   (i32.const 1)
                  )
                 )
                 (get_local $3)
                )
               )
              )
             )
             (i32.store8
              (get_local $2)
              (get_local $6)
             )
            )
            (set_local $6
             (i32.load8_u
              (i32.add
               (i32.add
                (get_global $valueStoreOffset)
                (get_local $0)
               )
               (tee_local $3
                (i32.add
                 (get_local $3)
                 (i32.const 1)
                )
               )
              )
             )
            )
            (br $while-in7)
           )
          )
         )
        )
       )
       (br_if $while-out4
        (i32.le_s
         (get_local $7)
         (i32.const 0)
        )
       )
       (set_local $0
        (get_local $7)
       )
       (set_local $1
        (i32.add
         (get_local $1)
         (i32.const 2)
        )
       )
       (br $while-in5)
      )
     )
     (set_local $5
      (i32.add
       (get_local $5)
       (i32.const 2)
      )
     )
     (br $while-in3)
    )
   )
  )
 )
)
