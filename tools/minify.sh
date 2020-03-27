#!/bin/sh
# -*- coding: utf-8 -*-

LOADEROSIZE=$(wc -c min/Hyphenopoly_Loader.js)
H9YOSIZE=$(wc -c min/Hyphenopoly.js)

echo 'old sizes:'
echo $LOADEROSIZE
echo $H9YOSIZE

mkdir -p min

terser Hyphenopoly_Loader.js -o min/Hyphenopoly_Loader.js --comments -c unsafe -m --warn
terser Hyphenopoly.js -o min/Hyphenopoly.js --comments -c passes=3,unsafe -m --warn

echo 'new sizes:'
wc -c min/Hyphenopoly_Loader.js
wc -c min/Hyphenopoly.js

cp -R patterns/ min/patterns
cp -R testsuite/ min/testsuite