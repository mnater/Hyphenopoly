#!/bin/sh
# -*- coding: utf-8 -*-

# sh compileWASM.sh hyphenEngine

SRCFILE="$1.asm.js"
WASTNAME="$1.wast"
WASMNAME="$1.wasm"
DISNAME="$1.wat"

echo 'running asm2wasm...'
asm2wasm $SRCFILE -Oz -m 2097152 -mm 16777216 > $WASTNAME

echo 'optimize > WASM...'
wasm-opt $WASTNAME -O3 -o $WASMNAME

#rm $WASTNAME

echo 'disassemble WASM...'
wasm2wat $WASMNAME > $DISNAME
