(module
  (type (;0;) (func))
  (import "env" "memory" (memory (;0;) 32 256))
  (import "ext" "hpbTranslateOffset" (global (;0;) i32))
  (import "ext" "hpbPatternsOffset" (global (;1;) i32))
  (import "ext" "patternsLength" (global (;2;) i32))
  (import "ext" "charMapOffset" (global (;3;) i32))
  (import "ext" "valueStoreOffset" (global (;4;) i32))
  (import "ext" "patternTrieOffset" (global (;5;) i32))
  (import "ext" "wordOffset" (global (;6;) i32))
  (import "ext" "hyphenPointsOffset" (global (;7;) i32))
  (func (;0;) (type 0)
    (local i32 i32)
    get_global 8
    i32.const 2
    i32.add
    set_local 0
    i32.const 12
    set_local 1
    get_global 8
    i32.load16_u
    i32.const 1
    i32.shl
    set_global 16
    loop  ;; label = @1
      get_local 0
      get_global 9
      i32.lt_s
      if  ;; label = @2
        get_global 11
        get_local 0
        i32.load16_u offset=2
        i32.const 1
        i32.shl
        i32.add
        i32.load16_u
        if  ;; label = @3
          get_global 11
          get_local 0
          i32.load16_u
          i32.const 1
          i32.shl
          i32.add
          get_global 11
          get_local 0
          i32.load16_u offset=2
          i32.const 1
          i32.shl
          i32.add
          i32.load16_u
          i32.store16
        else
          get_global 11
          get_local 0
          i32.load16_u
          i32.const 1
          i32.shl
          i32.add
          get_local 1
          i32.store16
          get_local 0
          i32.load16_u offset=2
          if  ;; label = @4
            get_global 11
            get_local 0
            i32.load16_u offset=2
            i32.const 1
            i32.shl
            i32.add
            get_local 1
            i32.store16
          end
          get_local 1
          i32.const 1
          i32.add
          set_local 1
        end
        get_local 0
        i32.const 4
        i32.add
        set_local 0
        br 1 (;@1;)
      end
    end)
  (func (;1;) (type 0)
    (local i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32)
    get_global 12
    i32.const 1
    i32.add
    tee_local 2
    set_local 9
    get_local 2
    set_local 0
    call 0
    get_global 9
    set_local 3
    get_global 9
    get_global 10
    i32.add
    set_local 11
    loop  ;; label = @1
      get_local 3
      get_local 11
      i32.lt_s
      if  ;; label = @2
        get_local 3
        i32.load8_u
        tee_local 4
        i32.const 58
        i32.eq
        if  ;; label = @3
          get_local 10
          i32.eqz
          set_local 10
        else
          get_local 10
          i32.const 1
          i32.eq
          if  ;; label = @4
            get_local 4
            set_local 12
          else
            get_local 6
            i32.const 1
            i32.add
            set_local 6
            get_local 4
            i32.const 11
            i32.gt_s
            if  ;; label = @5
              get_local 7
              i32.eqz
              if  ;; label = @6
                get_local 0
                i32.const 1
                i32.add
                set_local 0
              end
              i32.const 0
              set_local 7
              get_local 1
              i32.const -1
              i32.eq
              if  ;; label = @6
                get_global 13
                get_local 5
                i32.add
                get_local 8
                i32.add
                get_local 13
                get_global 16
                i32.const 1
                i32.add
                i32.const 2
                i32.shl
                i32.add
                tee_local 13
                tee_local 1
                i32.store
              end
              get_global 13
              get_local 1
              tee_local 5
              i32.add
              get_local 4
              i32.const 12
              i32.sub
              i32.const 3
              i32.shl
              tee_local 8
              i32.add
              i32.load
              tee_local 1
              i32.eqz
              if  ;; label = @6
                get_global 13
                get_local 5
                i32.add
                get_local 8
                i32.add
                i32.const -1
                i32.store
                i32.const -1
                set_local 1
              end
            else
              get_local 0
              get_local 4
              i32.store8
              get_local 0
              tee_local 2
              i32.const 1
              i32.add
              set_local 0
              i32.const 1
              set_local 7
            end
            get_local 6
            get_local 12
            i32.eq
            if  ;; label = @5
              get_local 2
              i32.const 255
              i32.store8 offset=1
              get_global 13
              get_local 5
              i32.add
              get_local 8
              i32.add
              get_local 9
              get_global 12
              i32.sub
              i32.store offset=4
              get_local 2
              i32.const 2
              i32.add
              tee_local 9
              set_local 0
              i32.const 0
              set_local 6
              i32.const 0
              set_local 5
              i32.const 0
              set_local 1
              i32.const 0
              set_local 7
            end
          end
        end
        get_local 3
        i32.const 1
        i32.add
        set_local 3
        br 1 (;@1;)
      end
    end)
  (func (;2;) (type 0)
    (local i32 i32 i32 i32 i32 i32 i32 i32 i32)
    get_global 14
    i32.load8_u
    i32.const 1
    i32.shl
    set_local 4
    get_global 14
    i32.const 2
    i32.add
    set_local 7
    loop  ;; label = @1
      get_local 1
      get_local 4
      i32.lt_s
      if  ;; label = @2
        get_local 7
        get_local 1
        i32.add
        tee_local 0
        get_global 11
        get_local 0
        i32.load16_u
        i32.const 1
        i32.shl
        i32.add
        i32.load16_u
        i32.const 12
        i32.sub
        i32.const 3
        i32.shl
        i32.store16
        get_local 1
        i32.const 2
        i32.add
        set_local 1
        br 1 (;@1;)
      end
    end
    loop  ;; label = @1
      get_local 2
      get_local 4
      i32.const 1
      i32.add
      i32.lt_s
      if  ;; label = @2
        get_global 15
        get_local 2
        i32.add
        i32.const 0
        i32.store8
        get_local 2
        i32.const 1
        i32.add
        set_local 2
        br 1 (;@1;)
      end
    end
    loop  ;; label = @1
      get_local 5
      get_local 4
      i32.lt_s
      if  ;; label = @2
        i32.const 0
        set_local 0
        get_local 5
        set_local 1
        loop  ;; label = @3
          block  ;; label = @4
            get_local 1
            get_local 4
            i32.ge_s
            br_if 0 (;@4;)
            get_global 13
            get_local 0
            i32.add
            tee_local 0
            get_local 7
            get_local 1
            i32.add
            i32.load16_u
            tee_local 3
            i32.add
            i32.load
            set_local 8
            get_local 0
            get_local 3
            i32.add
            i32.load offset=4
            tee_local 0
            i32.const 0
            i32.gt_s
            if  ;; label = @5
              i32.const 0
              set_local 3
              get_global 12
              get_local 0
              i32.add
              i32.load8_u
              set_local 6
              loop  ;; label = @6
                get_local 6
                i32.const 255
                i32.ne
                if  ;; label = @7
                  get_local 6
                  get_global 15
                  get_local 5
                  i32.const 1
                  i32.shr_s
                  i32.add
                  get_local 3
                  i32.add
                  tee_local 2
                  i32.load8_u
                  i32.gt_s
                  if  ;; label = @8
                    get_local 2
                    get_local 6
                    i32.store8
                  end
                  get_global 12
                  get_local 0
                  i32.add
                  get_local 3
                  i32.const 1
                  i32.add
                  tee_local 3
                  i32.add
                  i32.load8_u
                  set_local 6
                  br 1 (;@6;)
                end
              end
            end
            get_local 8
            i32.const 0
            i32.le_s
            br_if 0 (;@4;)
            get_local 8
            set_local 0
            get_local 1
            i32.const 2
            i32.add
            set_local 1
            br 1 (;@3;)
          end
        end
        get_local 5
        i32.const 2
        i32.add
        set_local 5
        br 1 (;@1;)
      end
    end)
  (global (;8;) (mut i32) (get_global 0))
  (global (;9;) (mut i32) (get_global 1))
  (global (;10;) (mut i32) (get_global 2))
  (global (;11;) (mut i32) (get_global 3))
  (global (;12;) (mut i32) (get_global 4))
  (global (;13;) (mut i32) (get_global 5))
  (global (;14;) (mut i32) (get_global 6))
  (global (;15;) (mut i32) (get_global 7))
  (global (;16;) (mut i32) (i32.const 0))
  (export "convert" (func 1))
  (export "hyphenate" (func 2)))
