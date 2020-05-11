/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable no-console */
/* eslint-env node */

"use strict";
const fs = require("fs");

const patternsFileName = process.argv[2];

/**
 * Read .pat.txt File
 */
function getPatternsFile() {
    let patternfile = fs.readFileSync("./" + patternsFileName, "utf8");
    patternfile = patternfile.trim();
    return patternfile;
}

/**
 * Collect and sort all lowerCase Characters
 * @param {String} patterns - The patterns
 */
function collectLowerCase(patterns) {
    const lowerCaseSet = new Set();
    patterns.split("").forEach((char) => {
        const charCode = char.charCodeAt(0);
        if (charCode > 96) {
            lowerCaseSet.add(char);
        }
    });
    const charArray = Array.from(lowerCaseSet);
    charArray.sort();
    return new Set(charArray);
}

/**
 * Add uppercase chars
 * @param {Set} lowerCaseSet set of lower case chars
 */
function addUpperCase(lowerCaseSet) {
    const mixedCaseSet = new Set();
    lowerCaseSet.forEach((lc) => {
        mixedCaseSet.add(lc + lc.toUpperCase());
    });
    return mixedCaseSet;
}

/**
 * Write File
 */
function writeFile() {
    const alphabetSet = addUpperCase(collectLowerCase(getPatternsFile()));
    let result = "";
    for (const line of alphabetSet) {
        result += line + "\n";
    }
    console.log(result);
}

writeFile();
