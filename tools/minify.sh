#!/bin/sh
# -*- coding: utf-8 -*-

mkdir -p min

terser Hyphenopoly_Loader.js -o min/Hyphenopoly_Loader.js --comments -c -m --warn
terser Hyphenopoly.js -o min/Hyphenopoly.js --comments -c -m --warn
wc -c min/Hyphenopoly_Loader.js
wc -c min/Hyphenopoly.js

cp -R patterns/ min/patterns
cp -R testsuite/ min/testsuite