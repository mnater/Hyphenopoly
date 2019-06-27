#!/bin/sh
# -*- coding: utf-8 -*-

# sh compileWASM.sh hyphenEngine

SRCFILE="$1.asm.js"
WASTNAME="$1.wast"
WASMNAME="$1.wasm"

echo 'running asm2wasm...'
./third-party/binaryen/bin/asm2wasm $SRCFILE -O4 -m 2097152 -mm 16777216 > $WASTNAME

echo 'optimize > WASM...'
./third-party/binaryen/bin/wasm-opt $WASTNAME -O4 -o $WASMNAME

wc -c $WASMNAME
rm $WASTNAME