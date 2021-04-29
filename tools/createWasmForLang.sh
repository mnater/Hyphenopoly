#!/bin/sh
# -*- coding: utf-8 -*-
#
# Creates a wasm module containing hyphenEngine (from ../src/hyphenEngine.ts)
# and license and patterns (from ../texPatterns/) for the specified language
# in ../lang/<language>/
#
# sh createWasmForLang.sh language

LANG=$1
TEXPATTERNS='./texPatterns/converted/'
FILENAME="hyph-$LANG"

echo '(A) setup directories'
mkdir -p ./lang/$LANG/src

echo '(B) create .hpb file'
node ./tools/tex2hpb.js $TEXPATTERNS$FILENAME.lic.txt $TEXPATTERNS$FILENAME.chr.txt $TEXPATTERNS$FILENAME.pat.txt $TEXPATTERNS$FILENAME.hyp.txt ./lang/$LANG/src/$LANG

echo '(C) create global imports from .hpb'
node ./tools/create_imports.js ./lang/$LANG/src/$LANG.hpb > ./lang/$LANG/src/g.ts

echo '(D) copy TypeScript sources'
cp ./src/hyphenEngine.ts ./lang/$LANG/src/hyphenEngine.ts
cp ./src/mytransform.js ./lang/$LANG/src/mytransform.js
#cp ./src/tsconfig.json ./lang/$LANG/src/tsconfig.json
echo '{
    "extends": "../../../node_modules/assemblyscript/std/assembly.json",
    "include": [
      "./*.ts"
    ]
}' > ./lang/$LANG/src/tsconfig.json
echo "$LANG\c" > ./lang/$LANG/src/lang.txt

echo '(E) compile WASM-Module'
cd ./lang/$LANG/src/
OLDSIZE=$(wc -c ../$LANG.wasm)
asc hyphenEngine.ts -O3z --converge --noExportMemory --transform ./mytransform.js -b ../$LANG.wasm
NEWSIZE=$(wc -c ../$LANG.wasm)
echo "(F) install $LANG"
cd ../../../
cp ./lang/$LANG/$LANG.wasm ./patterns/$LANG.wasm
echo "size before: $OLDSIZE"
echo "size now:    $NEWSIZE"