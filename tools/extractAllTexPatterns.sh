#!/bin/sh
# -*- coding: utf-8 -*-
#
# Creates a wasm module containing hyphenEngine (from ../src/hyphenEngine.ts)
# and license and patterns (from ../texPatterns/) for the specified language
# in ../lang/<language>/
#
# sh createWasmForLang.sh language

path_in='../texPatternsNew/'
mkdir $path_in/converted/
for filename in ${path_in}*.tex; do {
    #echo $filename
    base=$(basename "$filename")
    echo $base
    node extractTeXpatterns.js ../texPatternsNew/$base ../texPatternsNew/converted/
}
done