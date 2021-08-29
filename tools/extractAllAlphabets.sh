#!/bin/sh
# -*- coding: utf-8 -*-
#
# Reads all .chr.txt files in "texPattners/converted" and
# emit a file "abc.txt" containing the needen chars for usage in
# searchHashSedds.js

path_in='../texPatterns'
touch abc.txt
for filename in ${path_in}/converted/*.chr.txt; do {
    #echo $filename
    base=$(basename "$filename")
    length=${#base}
    lang=${base:5: length - 13}
    value=`cat $filename`
    echo \"$lang\": \"$value\"\, >> abc.txt
    #node extractTeXpatterns.js $path_in/$base $path_in/converted/
}
done