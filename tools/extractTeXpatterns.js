/* eslint-disable require-jsdoc */
/* eslint-env node */
/*
 * Extract chr, hyp, lic and pat from hyph-<lang>.tex files
 *
 * # node extractTexPatterns.js hyph-<lang>.tex
 *
 * This creates the following files in the same direcory:
 * - hyph-<lang>.chr.txt – left-/rightmin and characters
 * - hyph-<lang>.hyp.txt - exceptions (empty if no exceptions)
 * - hyph-<lang>.lic.txt - license
 * - hyph-<lang>.pat.txt - patterns
 */

"use strict";
const fs = require("fs");
const path = require("path");
const YAML = require("yaml");

const patternsFileName = process.argv[2];
const outDir = process.argv[3];
const langName = path.basename(patternsFileName, ".tex");

/**
 * Read .pat.txt File
 */
function getTeXFile(file) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    let patternfile = fs.readFileSync(file, "utf8");
    patternfile = patternfile.trim();
    return patternfile;
}

function getPatternsFromFile(patternfile) {
    const patternStart = patternfile.indexOf("\\patterns");
    const patternEnd = patternfile.indexOf("}", patternStart);
    const patternBlock = patternfile.substring(patternStart, patternEnd);
    const pattern = patternBlock.
        replace(/\\patterns{.*\n/g, "").
        replace(/%.*\n/gi, "").
        replace(/ /g, "\n").
        // eslint-disable-next-line security/detect-unsafe-regex
        replace(/^(?:[\t ]*(?:\r?\n|\r))+/gm, "").
        trim();
    return pattern;
}

function getHeaderFromFile(patternfile) {
    const headerEnd = patternfile.indexOf("\\patterns{");
    const header = patternfile.substring(0, headerEnd);
    // Strip data after YAML
    const YAMLEnd = header.indexOf("% =========");
    let strippedHeader = (YAMLEnd === -1)
        ? header
        : header.substring(0, YAMLEnd);
    // Remove comment tags and unnecessary lines
    strippedHeader = strippedHeader.replace(/% |%/g, "").trim();
    return strippedHeader;
}

function getMetaFromHeader(header) {
    return YAML.parse(header);
}

function getLRMFromMeta(meta) {
    let lrm = "";
    if (meta.hyphenmins.typesetting) {
        lrm += meta.hyphenmins.typesetting.left;
        lrm += meta.hyphenmins.typesetting.right;
    } else {
        lrm += meta.hyphenmins.generation.left;
        lrm += meta.hyphenmins.generation.right;
    }
    lrm += "\n";
    return lrm;
}

function createChrFile(patternlist) {
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
            const uc = (lc.toUpperCase().length > 1)
                ? ""
                : lc.toUpperCase();
            mixedCaseSet.add(lc + uc);
        });
        return mixedCaseSet;
    }

    const lcSet = collectLowerCase(patternlist);
    const mcSet = addUpperCase(lcSet);
    let result = "";
    for (const line of mcSet) {
        result += line + "\n";
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(outDir + `${langName}.chr.txt`, result);
}

function getExceptionsFromFile(patternfile) {
    const excStart = patternfile.indexOf("\\hyphenation{");
    if (excStart === -1) {
        return "\n";
    }
    const excEnd = patternfile.indexOf("}", excStart);
    const excBlock = patternfile.substring(excStart, excEnd);
    const exc = excBlock.
        replace(/\\hyphenation{\n/g, "").
        replace(/% .*\n/gi, "").
        trim();
    return exc;
}

function createHypFile(exceptions) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(outDir + `${langName}.hyp.txt`, exceptions);
}

function getLicFromMeta(meta) {
    let text = "";
    text += meta.title + "\n";
    text += meta.copyright + "\n";
    if (Array.isArray(meta.licence)) {
        text += "licences: ";
        meta.licence.forEach((v) => {
            if (v.name) {
                text += v.name + " ";
            } else if (v.text) {
                text += v.text;
            }
        });
        text += "\n";
    } else if (meta.licence.name) {
        text += "licence: " + meta.licence.name + "\n";
    } else {
        text += "licence: " + meta.licence.text + "\n";
    }
    if (meta.source) {
        text += "source: " + meta.source;
    }
    return text;
}

function createLicFile(meta) {
    const licText = getLicFromMeta(meta);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(outDir + `${langName}.lic.txt`, licText);
}

function createPatFile(patlist, lrm) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(outDir + `${langName}.pat.txt`, lrm + patlist);
}
// Main

const texContent = getTeXFile(patternsFileName);
const texHeader = getHeaderFromFile(texContent);
const metaData = getMetaFromHeader(texHeader);
const texPatterns = getPatternsFromFile(texContent);
const texExceptions = getExceptionsFromFile(texContent);

createChrFile(texPatterns);
createHypFile(texExceptions);
createLicFile(metaData);
createPatFile(texPatterns, getLRMFromMeta(metaData));
