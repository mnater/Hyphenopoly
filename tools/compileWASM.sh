#!/bin/sh
# -*- coding: utf-8 -*-

# sh compileWASM.sh <asmHyphenEngine>

SRCFILE="$1.js"
WASTNAME="w$1.wast"
WASMNAME="w$1.wasm"
DISNAME="w$1.txt"

echo 'running asm2wasm...'
#~/Sites/binaryen/bin/asm2wasm $SRCFILE -Oz -m 8388608 -mm 16777216 -t de.bin > $WASTNAME
~/Sites/binaryen/bin/asm2wasm $SRCFILE -Oz -m 2097152 -mm 16777216 > $WASTNAME
#~/Sites/binaryen/bin/asm2wasm $SRCFILE -Oz -m 8388608 > $WASTNAME

echo 'optimize > WASM...'
~/Sites/binaryen/bin/wasm-opt $WASTNAME -O3 -o $WASMNAME

echo 'disassemble WASM...'
~/Sites/wabt/bin/wasm2wat $WASMNAME > $DISNAME
