#!/bin/sh
# -*- coding: utf-8 -*-
#
# Creates a wasm module containing hyphenEngine (from ../src/hyphenEngine.ts)
# and license and patterns (from ../texPatterns/) for the specified language
# in ../lang/<language>/
#
# sh createWasmForLang.sh language

path_in='./texPatternsNew/converted/'
prefix='hyph-'

mkdir -p ./patterns/

for filename in ${path_in}*.chr.txt; do {
    echo $filename
    base=$(basename "$filename" .chr.txt)
    lang=${base#$prefix}
    sh ./tools/createWasmForLang.sh $lang
}
done