#!/bin/sh
# -*- coding: utf-8 -*-

path_in='../texPatterns/'
path_out='./convertetPatterns/'
prefix='hyph-'

rm -R $path_out
mkdir $path_out

for filename in ${path_in}*.chr.txt; do {
    base=$(basename "$filename" .chr.txt)
    langcode=${base#$prefix}
    #echo $base.lic.txt $base.chr.txt $base.pat.txt $base.hyp.txt $path_out$langcode.hpb
    node tex2hpb.js $path_in$base.lic.txt $path_in$base.chr.txt $path_in$base.pat.txt $path_in$base.hyp.txt $path_out$langcode
}
done