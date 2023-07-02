#!/bin/sh
# -*- coding: utf-8 -*-
#
# Creates a wasm module containing hyphenEngine (from ../src/hyphenEngine.ts)
# and license and patterns (from ../texPatterns/converted/) for the specified language
# in ../lang/<language>/
#
# sh createWasmForLang.sh language

LANG=$1
TEXPATTERNS='./texPatterns/converted/'
FILENAME="hyph-$LANG"

echo '(A) setup directories'
rm -R ./lang/$LANG/src
mkdir -p ./lang/$LANG/src

echo '(B) create .json file'
node ./tools/tex2json.js $TEXPATTERNS$FILENAME.chr.txt $TEXPATTERNS$FILENAME.hyp.txt $TEXPATTERNS$FILENAME.lic.txt $TEXPATTERNS$FILENAME.pat.txt ./lang/$LANG/src/$LANG

echo '(C) create .wasm data'
node ./tools/createWasmData.js ./lang/$LANG/src/$LANG.json ./lang/$LANG/src/$LANG.data ./lang/$LANG/src/g.ts

echo '(D) copy TypeScript sources'
cp ./src/hyphenEngine.ts ./lang/$LANG/src/hyphenEngine.ts
cp ./src/mytransform.js ./lang/$LANG/src/mytransform.js
cp ./src/tsconfig.json ./lang/$LANG/src/tsconfig.json

echo "$LANG\c" > ./lang/$LANG/src/lang.txt

echo '(E) compile WASM-Module'
cd ./lang/$LANG/src/
if [ -f "../$LANG.wasm" ]; then
    OLDSIZE=$(wc -c < ../$LANG.wasm)
else 
    OLDSIZE=0
fi

asc hyphenEngine.ts -O3z --converge --noExportMemory --transform ./mytransform.js -o ../$LANG.wasm

NEWSIZE=$(wc -c < ../$LANG.wasm)
#gzip -k -9 ../$LANG.wasm
#ZIPPED=$(wc -c < ../$LANG.wasm.gz)
#rm ../$LANG.wasm.gz
echo "(F) install $LANG"
cd ../../../
cp ./lang/$LANG/$LANG.wasm ./patterns/$LANG.wasm
echo "size before: $OLDSIZE"
echo "size now:    $NEWSIZE"
#echo "zipped size:  $ZIPPED"