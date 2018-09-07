/* tex2hpb – Version 1.0
 *
 * This tool converts hyphenation patterns from TeX
 * (https://ctan.org/tex-archive/language/hyph-utf8)
 * to the binary format used in Hyphenopoly.js
 * (https://github.com/mnater/Hyphenopoly)
 *
 * Usage:
 * # node tex2hpb.js license.txt characters.txt patterns.txt [exceptions.txt | null] outname
 *
 * This creates a new file called input.hpb in pwd
 *
 * All input files must be utf-8 encoded files.
 *
 * license.txt
 * Some licenses require to be included in every distribution of the work.
 * If not empty the license.txt file must contain the license of the patterns.
 * Each line of the license begins with a percent sign (%) and ends with a
 * newline (0x0a).
 *
 * characters.txt
 * When creating the pattern trie, characters of the languages alphabet are
 * mapped to internal small integers. The program thus need to know which
 * characters are used in the language.
 * Each character used by the language occupies one line.
 * On each line the first character is the "main character" used
 * in the patterns followed by other representations of the same
 * character, if any (e.g. its uppercase form):
 * Example:
 * aA
 * äÄ
 * sSſ
 * ß
 * Character groups are not supported, yet (e.g. german ßSS is invalid).
 *
 * patterns.txt must be a utf-8 encoded file of two parts:
 * 1: first line contains two 1-digit numbers indicating leftmin and
 *    rightmin. Typically: 22
 *    For many patterns you'll find these numbers in the license text or on
 *    http://www.hyphenation.org/#languages
 *    If this information is missing, 22 is assumed.
 * 2: TeX hyphenation patterns where each pattern is separated by a
 *    newline (0x0a).
 *
 * The optional exceptions.txt contains exceptional hyphenations that are
 * not covered by the patterns. Each exception occupies one line, ending with
 * a new line (0x0a). Exceptions are words containing a minus (-) to indicate
 * hyphenation points.
 * Example:
 * ta-ble
 * project
 * Internally exceptions are converted to special patterns. The examples above
 * will become:
 * _10t10a11b10l10e10_
 * _10p10r10o10j10e10c10t10_
 * So "tables" will not by hyphenated by this pattern.
 *
 * If there's no exceptions file, use "null" as a placeholder.
 *
 * outname
 * outname (typically the language code) is the filename where patterns will
 * be stored. The .hpb ending is added automatically.
 */

/* Binary format: .hpb (hyphenopoly patterns binary)
 * The hyphenopoly patterns binary stores hyphenation patterns
 * for one language in a tight format shaped for fast loading
 * and execution by Hyphenopoly.js
 * Unlike in other hyphenation binaries (like e.g. .hyb files) the
 * patterns are not stored as a trie. The trie is (even when packed)
 * slightly larger then the raw patterns.
 * The trie has to be built by the consumer of the patterns.
 * The binary file consists of four parts: HEADER, LICENSE, TRANSLATE and
 * PATTERNS. All data is little endian.
 *
 * HEADER
 * Uint32Array of length 8
 * [0]: magic number 0x01627068 (\hpb1, 1 is the version)
 * [1]: TRANSLATE offset (to skip LICENSE)
 * [2]: PATTERNS offset (skip LICENSE + TRANSLATE)
 * [3]: patternlength (bytes)
 * [4]: leftmin
 * [5]: rightmin
 * [6]: Trie Array Size (needed to preallocate memory)
 * [7]: Values Size (needed to preallocate memory)

 *
 * LICENSE
 * UTF-8 encoded license text, padded to 4 bytes
 *
 * TRANSLATE
 * When creating a trie, the characters of the alphabet have to be
 * mapped to uInts from 1 to the lenght of the alphabet.
 * (Since wasm memory is initialized with zeros, 0 is reserved here).
 * Also upon creating the trie, the number of characters has to be
 * known.
 * The mapping from utf16 characters to these internal uInts is stored
 * in the TRANSLATE Table which is an Uint16Array of variable length.
 * The characters of the patterns are stored on locations with odd
 * adresses (starting at 1) while there other cases are stored on even
 * adresses. Adress 0 denotes the length of the alphabet.
 * By using 16bits the characters are restricted to the BMP.
 * Characters in the TRANSLATE table are sorted by their Unicode code
 * point in increasing order (except substitutions, see below)
 * Characters that don't have a upperCase are followed by 0.
 * Characters that are a SUBSTITUTION for an other character in the
 * alphabet are stored at the end of the list, preceded by their
 * substituted character.
 * The underline character (_) is reserved to mark the beginning and
 * the end of the word (TeX patterns use the dot (.) for this purpose)
 * and is always the first character in the TRANSLATE.
 * Example:
 * For the characters '_rst' and 'ſ' (LATIN SMALL LETTER LONG S) the
 * TRANSLATE is '4_\0rRsStTſs' (substitutes dont count for the length)
 * The TRANSLATE Table has several impacts on the behaviour of the
 * hyphenation algorithm:
 * - words containing a character that is not in the translate are
 *   not hyphenated
 * - words don't need to be lowerCase'd before hyphenation
 * - substitute characters are not needed to be substituted before
 *   hyphenation
 *
 * PATTERNS
 * A Uint8Array of variable length.
 * Patterns from the input file are mapped by the TRANSLATE Table.
 * TeX patterns contain (a) numbers from 1 to 9 to indicate hyphenation points
 * and (b) the characters of the alphabet.
 * The numbers are directly stored with their value. The word boundary
 * marker (_) has always the value 12 (0xC). The other characters are
 * stored with values >= 13 (0xD). Thus the maximum alphabet length is
 * 255 - 12 = 243 which should be enough for most use cases.
 * Example 3:
 * Given the TRANSLATE '_\0aAbBcC'
 * (0x0400 0x5f00 0x0000 0x6100 0x4100 0x6200 0x4200 0x6300 0x4300)
 * the pattern '1ba' is stored as '0x01 0x0e 0x0d' = '01 14 13'
 * Individual patterns are not separated. Instead patterns of the same
 * length are grouped and prefixed by their length surrounded by
 * colons (:).
 * Example 4:
 * The patterns '1ba 1be 1abd 1abf 5einstellunge' are grouped as
 * follows
 * ':3:1ba1be:4:1abd1abf:13:5einstellunge'
 * (0x3a 0x03 0x3a 0x01 0x0e 0x0d 0x01 0x0e etc.)
 * Patterns inside each group may be sorted by their code point
 * values to achieve better compression rates.
 */

const fs = require("fs");
const path = require("path");

const VERSION = 1;
const licenseFileName = process.argv[2];
const charactersFileName = process.argv[3];
const patternsFileName = process.argv[4];
const exceptionsFileName = process.argv[5];
const saveFileName = process.argv[6];

let leftmin = 2;
let rightmin = 2;

const logger = (function () {
    "use strict";
    let msgNr = 1;

    function log(text, indent) {
        if (!indent) {
            console.log(`\x1b[33m(${msgNr.toString(16)})\x1b[0m: \x1b[34m${text}\x1b[0m`);
            msgNr += 1;
        } else {
            console.log(`     \x1b[34m${text}\x1b[0m`);
        }
    }

    return {
        log: log
    };
}());

function createMagicNumber() {
    "use strict";
    const mnstring = "hpb";
    const mnarray = [];
    let i = 0;
    while (i < mnstring.length) {
        mnarray.push(mnstring.codePointAt(i));
        i += 1;
    }
    mnarray.push(VERSION);
    const mnui8 = Uint8Array.from(mnarray);
    const mnui32 = new Uint32Array(mnui8.buffer);
    return mnui32[0];
}

function createHeader(licenseLength, translateLength, trieLength, valueLength, patternLength) {
    "use strict";
    /*
     * [0]: magic number 0x01627068 (\hpb1, 1 is the version)
     * [1]: TRANSLATE offset (to skip LICENSE)
     * [2]: PATTERNS offset (skip LICENSE + TRANSLATE)
     * [3]: patternlength (bytes)
     * [4]: leftmin
     * [5]: rightmin
     * [6]: Trie Array Size (needed to preallocate memory)
     * [7]: Values Size (needed to preallocate memory)
    */
    const headerui32 = new Uint32Array(8);
    const translateByteOffset = headerui32.byteLength + licenseLength;
    const patternByteOffset = translateByteOffset + translateLength;
    headerui32[0] = createMagicNumber();
    headerui32[1] = translateByteOffset;
    headerui32[2] = patternByteOffset;
    headerui32[3] = patternLength;
    headerui32[4] = leftmin;
    headerui32[5] = rightmin;
    headerui32[6] = trieLength;
    headerui32[7] = valueLength;
    return headerui32;
}

function getLicenseFileBuffer() {
    "use strict";
    logger.log(`read license file: ${licenseFileName} (${fs.statSync(licenseFileName).size} Bytes)`);
    let licensefile = fs.readFileSync("./" + licenseFileName);
    return licensefile;
}

function getCharactersFile() {
    "use strict";
    logger.log(`read characters file: ${charactersFileName} (${fs.statSync(charactersFileName).size} Bytes)`);
    let charactersfile = fs.readFileSync("./" + charactersFileName, "utf8");
    charactersfile = charactersfile.trim();
    return charactersfile;
}

function getPatternsFile() {
    "use strict";
    logger.log(`read patterns file: ${patternsFileName} (${fs.statSync(patternsFileName).size} Bytes)`);
    let patternsfile = fs.readFileSync("./" + patternsFileName, "utf8");
    patternsfile = patternsfile.trim();
    patternsfile = patternsfile.replace(/(\d{2})\n/, function (ignore, p1) {
        let digits = p1.split("");
        leftmin = parseInt(digits[0], 10);
        rightmin = parseInt(digits[1], 10);
        logger.log(`set leftmin: ${leftmin}, rightmin: ${rightmin}`);
        return "";
    });
    patternsfile = patternsfile.replace(/\./g, "_");
    patternsfile = patternsfile.replace(/\n/g, " ");
    return patternsfile;
}

function getExceptionsFile() {
    "use strict";
    if (exceptionsFileName && exceptionsFileName !== "null") {
        logger.log(`read exceptions file: ${exceptionsFileName} (${fs.statSync(exceptionsFileName).size} Bytes)`);
        let exceptionsfile = fs.readFileSync("./" + exceptionsFileName, "utf8");
        return exceptionsfile;
    }
    logger.log("no exceptions");
    return null;
}

function createTranslate(characters) {
    "use strict";
    const lines = characters.split("\n");
    const translateTable = [0]; //index 0: alphabet length
    const substitutions = [];
    const logalpha = [];
    const logsubst = [];
    const wordDelim = "_";

    translateTable.push(wordDelim.charCodeAt(0));
    translateTable.push(0);
    translateTable[0] += 1;

    lines.forEach(function (value) {
        translateTable[0] += 1;
        if (value.length === 2) {
            translateTable.push(value.charCodeAt(0));
            translateTable.push(value.charCodeAt(1));
            logalpha.push(value.charAt(0));
            logalpha.push(value.charAt(1));
        } else if (value.length === 1) {
            translateTable.push(value.charCodeAt(0));
            translateTable.push(0);
            logalpha.push(value.charAt(0));
            logalpha.push("⎵");
        } else if (value.length > 2) {
            //substitutions
            translateTable.push(value.charCodeAt(0));
            translateTable.push(value.charCodeAt(1));
            logalpha.push(value.charAt(0));
            logalpha.push(value.charAt(1));
            let i = 2;
            while (i < value.length) {
                substitutions.push(value.charCodeAt(i));
                substitutions.push(value.charCodeAt(0));
                logsubst.push(value.charAt(i));
                logsubst.push(value.charAt(0));
                i += 1;
            }
        }
    });
    logger.log(`collected alphabet of length ${logalpha.length} (${logalpha.length / 2}):`);
    logger.log(`${logalpha.join("")}`, true);
    logger.log(`collected substitutions: ${logsubst.join("")}`);
    const ui16 = Uint16Array.from(translateTable.concat(substitutions));
    return ui16;
}

function createTranslateLookUpTable(translate) {
    "use strict";
    const lookuptable = new Uint16Array(2 << 15);
    let i = 1;
    let k = 12;
    while (i < translate.length) {
        if (lookuptable[translate[i + 1]] === 0) {
            lookuptable[translate[i]] = k;
            if (translate[i + 1] !== 0) {
                lookuptable[translate[i + 1]] = k;
            }
            k += 1;
        } else {
            //substitute
            lookuptable[translate[i]] = lookuptable[translate[i + 1]];
        }
        i += 2;
    }
    logger.log(`mapped chars of alphabet to internal numbers in range [12, ${k})`);
    return lookuptable;
}

function createExceptionPatterns(exceptions) {
    const lines = exceptions.split("\n");
    const ret = [];
    lines.forEach(function (value, index) {
        if (value !== "") {
            ret[index] = "_" + value.split("").map(function (c) {
                if (c === "-") {
                    return "11";
                } else {
                    return "10" + c;
                }
            }).join("").replace(/1110/gi, "11") + "10_";
        }
    });
    return ret.join(" ");
}

function createPatterns(translate, patterns, exceptionsfile) {
    "use strict";
    const lookuptable = createTranslateLookUpTable(translate);
    const allExceptions = createExceptionPatterns(exceptionsfile);
    if (allExceptions !== "") {
        patterns = patterns + " " + allExceptions;
    }
    const allPatterns = patterns.split(" ");
    const exceptions = [];
    const translatedPatterns = allPatterns.map(function (pat) {
        let i = 0;
        let cP1 = 0;
        let cP2 = 0;
        const ret = [];
        let isException = false;
        while (i < pat.length) {
            cP1 = pat.codePointAt(i);
            if (cP1 > 57 || cP1 < 49) {
                ret.push(lookuptable[cP1]);
            } else {
                cP2 = pat.codePointAt(i + 1);
                if (cP2 && (cP2 < 57 && cP2 > 47)) {
                    isException = true;
                    ret.push(10 * (cP1 - 48) + (cP2 - 48));
                    i += 1;
                } else {
                    ret.push(cP1 - 48);
                }
            }
            i += 1;
        }
        if (isException) {
            exceptions.push(pat);
        }
        return ret;
    });
    logger.log(`found ${exceptions.length} pattern exceptions`);

    const groupedPatterns = {};
    let patternLength = 0;
    let i = 0;
    let longestP = 0;
    let shortestP = Number.MAX_SAFE_INTEGER;
    while (i < translatedPatterns.length) {
        patternLength = translatedPatterns[i].length;
        if (groupedPatterns.hasOwnProperty(patternLength)) {
            groupedPatterns[patternLength].push(translatedPatterns[i]);
        } else {
            groupedPatterns[patternLength] = [translatedPatterns[i]];
        }
        i += 1;
    }

    const outPatterns = [];
    Object.keys(groupedPatterns).forEach(function (k) {
        groupedPatterns[k].sort();
        outPatterns.push(58);
        outPatterns.push(parseInt(k, 10));
        outPatterns.push(58);
        let l = 0;
        let j = 0;
        longestP = Math.max(longestP, parseInt(k, 10));
        shortestP = Math.min(shortestP, parseInt(k, 10));
        while (l < groupedPatterns[k].length) {
            j = 0;
            while (j < groupedPatterns[k][l].length) {
                outPatterns.push(groupedPatterns[k][l][j]);
                j += 1;
            }
            l += 1;
        }
    });
    logger.log(`grouped and sorted patterns: shortest: ${shortestP}, longest: ${longestP}`)
    return Uint8Array.from(outPatterns);
}

function TrieCreator(patterns, trieRowLength) {
    "use strict";
    let i = 0;
    let mode = 0; //0: initial, 1: get patternslength, 2: collect trie
    let patternlength = 0;
    let count = 0;
    let rowStart = 0;
    let nextRowStart = 0;
    let prevWasDigit = false;
    let trieNextEmptyRow = 0;
    let rowOffset = 0;
    let valueStoreNextStartIndex = 0;
    let valueStoreCurrentIdx = 0;
    let valueStorePrevIdx = 0;
    const patternTrie = [];
    const valueStore = [];

    function add0ToValueStore() {
        valueStore[valueStoreCurrentIdx] = 0;
        valueStoreCurrentIdx += 1;
    }

    function addToValueStore(p) {
        valueStore[valueStoreCurrentIdx] = p;
        valueStorePrevIdx = valueStoreCurrentIdx;
        valueStoreCurrentIdx += 1;
    }

    function getLinkToValueStore() {
        let start = valueStoreNextStartIndex;
        valueStore[valueStorePrevIdx + 1] = 255; //mark end of pattern
        valueStoreNextStartIndex = valueStorePrevIdx + 2;
        valueStoreCurrentIdx = valueStoreNextStartIndex;
        return start;
    }

    function makeRow(startIndex) {
        let s = startIndex;
        while (s < (trieRowLength + startIndex)) {
            patternTrie[s] = 0;
            s += 1;
        }
        return startIndex;
    }

    function addToTrie(codePoint) {
        if (codePoint <= 11) {
            //its a digit
            addToValueStore(codePoint);
            prevWasDigit = true;
        } else {
            //charCode is alphabetical
            if (!prevWasDigit) {
                add0ToValueStore();
            }
            prevWasDigit = false;
            if (nextRowStart === -1) {
                //start a new row
                nextRowStart = trieNextEmptyRow + trieRowLength + 1;
                trieNextEmptyRow = nextRowStart;
                patternTrie[rowStart + rowOffset] = makeRow(nextRowStart);
            }
            rowOffset = (codePoint - 12) * 2;
            rowStart = nextRowStart;
            nextRowStart = patternTrie[rowStart + rowOffset];
            if (nextRowStart === 0) {
                patternTrie[rowStart + rowOffset] = -1;
                nextRowStart = -1;
            }
        }
    }

    function terminateTrie(codePoint) {
        if (codePoint <= 11) {
            //its a digit
            patternTrie[rowStart + rowOffset + 1] = getLinkToValueStore();
        } else {
            add0ToValueStore();
            if (patternTrie[rowStart + rowOffset + 1] === 0) {
                patternTrie[rowStart + rowOffset] = -1;
            }
            patternTrie[rowStart + rowOffset + 1] = getLinkToValueStore();
        }
    }

    makeRow(0);

    while (i < patterns.length) {
        if (patterns[i] === 58 && (mode === 0 || mode === 2)) {
            mode = 1;
        } else if (patterns[i] === 58 && mode === 1) {
            mode = 2;
        } else if (mode === 1) {
            patternlength = patterns[i];
        } else if (mode === 2) {
            count += 1;
            addToTrie(patterns[i]);
            if (count === patternlength) {
                terminateTrie(patterns[i]);
                count = 0;
                rowStart = 0;
                nextRowStart = 0;
                prevWasDigit = 0;
            }
        }
        i += 1;
    }

    logger.log(`created Trie.`);
    logger.log(`trieLength: ${patternTrie.length}`, true);
    logger.log(`valueStoreLength: ${valueStore.length}`, true);
    return {
        trieLength: patternTrie.length,
        valueStoreLength: valueStore.length
    };
}


function main() {
    "use strict";
    const start = process.hrtime();
    //# license.txt characters.txt patterns.txt [exceptions.txt]
    console.log(`\x1b[35mRunning tex2hbp.js (v${VERSION}) on node.js (${process.version})\x1b[0m`);
    const licenseBuf = getLicenseFileBuffer();
    const paddedLicenseBuf = licenseBuf.byteLength + 4 - licenseBuf.byteLength % 4;
    const charactersfile = getCharactersFile();
    const patternsfile = getPatternsFile();
    const exceptionsfile = getExceptionsFile();

    const translate = createTranslate(charactersfile, patternsfile);
    const patterns = createPatterns(translate, patternsfile, exceptionsfile);
    const dummyTrie = new TrieCreator(patterns, translate[0] * 2);
    const header = createHeader(
        paddedLicenseBuf,
        translate.byteLength,
        dummyTrie.trieLength,
        dummyTrie.valueStoreLength,
        patterns.byteLength
    );

    let fileBufferSize = header.byteLength + paddedLicenseBuf + translate.byteLength + patterns.byteLength;
    const pad = 4 - fileBufferSize % 4;
    fileBufferSize = fileBufferSize + pad;
    const fileBuffer = new ArrayBuffer(fileBufferSize);
    const fileBufferui32 = new Uint32Array(fileBuffer);
    const fileBufferui16 = new Uint16Array(fileBuffer);
    const fileBufferui8 = new Uint8Array(fileBuffer);

    fileBufferui32.set(header, 0);
    fileBufferui8.set(licenseBuf, header.byteLength);
    fileBufferui16.set(translate, (header.byteLength + paddedLicenseBuf) >> 1);
    fileBufferui8.set(patterns, header.byteLength + paddedLicenseBuf + translate.byteLength);
    fs.writeFile(saveFileName + ".hpb", fileBufferui8, function (err) {
        if (err) {
            console.log(err);
        } else {
            logger.log(`Finish: file saved to '${saveFileName + ".hpb"}' (${fileBufferSize} Bytes)`);
            console.log(`\x1b[35mtook ${process.hrtime(start)} seconds\x1b[0m`);
        }
    });
}

main();