#!/bin/sh
# -*- coding: utf-8 -*-
#
# Splits .tex-patterns to four files:
# hyph-<lang>.chr.txt -- char table
# hyph-<lang>.hyp.txt -- hyphenation exceptions
# hyph-<lang>.lic.txt -- licence
# hyph-<lang>.pat.txt -- patterns
#
# sh extractAllTexPatterns.sh

path_in='../texPatterns'
mkdir $path_in/converted/
for filename in ${path_in}/*.tex; do {
    #echo $filename
    base=$(basename "$filename")
    echo $base
    node extractTeXpatterns.js $path_in/$base $path_in/converted/
}
done