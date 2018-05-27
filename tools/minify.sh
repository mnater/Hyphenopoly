#!/bin/sh
# -*- coding: utf-8 -*-

mkdir -p min

uglifyjs Hyphenopoly_Loader.js -o min/Hyphenopoly_Loader.js --comments -c -m --warn
uglifyjs Hyphenopoly.js -o min/Hyphenopoly.js --comments -c -m --warn
uglifyjs hyphenEngine.asm.js -o min/hyphenEngine.asm.js --comments -c -m --warn --verbose

cp hyphenEngine.wasm min/hyphenEngine.wasm
cp -R patterns min/patterns
cp -R testsuite min/testsuite