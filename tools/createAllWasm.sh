#!/bin/sh
# -*- coding: utf-8 -*-
#
# create all .wasm files, overwrite existing files
#
# Loops over all files in "./texPatterns/converted/" and calls
# createWasmForLang.sh <lang>

path_in='./texPatterns/converted/'
prefix='hyph-'

mkdir -p ./patterns/

for filename in ${path_in}*.chr.txt; do {
    echo $filename
    base=$(basename "$filename" .chr.txt)
    lang=${base#$prefix}
    sh ./tools/createWasmForLang.sh $lang
}
done