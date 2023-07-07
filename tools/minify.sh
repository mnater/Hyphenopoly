#!/bin/sh
# -*- coding: utf-8 -*-

echo 'old sizes:'
wc -c min/Hyphenopoly_Loader.js
wc -c min/Hyphenopoly.js
#wc -c min/Hyphenopoly_Loader.js.zip
#wc -c min/Hyphenopoly.js.zip

mkdir -p min

terser Hyphenopoly_Loader.js -o min/Hyphenopoly_Loader.js --comments -c passes=3,unsafe -m --warn
terser Hyphenopoly.js -o min/Hyphenopoly.js --comments -c passes=3,unsafe -m --warn
#zip min/Hyphenopoly_Loader.js.zip min/Hyphenopoly_Loader.js
#zip min/Hyphenopoly.js.zip min/Hyphenopoly.js
echo 'new sizes:'
wc -c min/Hyphenopoly_Loader.js
wc -c min/Hyphenopoly.js
#wc -c min/Hyphenopoly_Loader.js.zip
#wc -c min/Hyphenopoly.js.zip

cp -R patterns/ min/patterns
cp -R testsuite/ min/testsuite