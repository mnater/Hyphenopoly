/* tex2hpb
 *
 * This tool converts hyphenation patterns from TeX
 * to the binary format used in Hyphenopoly.js
 *
 * Usage:
 * # node tex2hpb.js input.txt [translate.txt]
 * This creates a new file called input.hpb in pwd
 *
 * input.txt must be a utf-8 encoded file of two parts:
 * 1: first line contains two 1-digit numbers indicating leftmin and
 *    rightmin. Typically: 22
 * 2: TeX hyphenation patterns where each pattern is separated by a
 *    newline (\n).
 *    As an addition to the hyphenation patterns it is possible to
 *    define exceptions (allthough it would be more efficient to
 *    recompute the patterns). Exceptions (i.e. words that are
 *    not or falsy hyphenated by the patterns) have to be added as
 *    follows:
 *    _10p10r10o10j10e10c10t10s_ (the even number 10 will overwrite
 *    all hyphenation opportunities from the patterns, thus "projects"
 *    will not be hyphenated).
 *    .r10e10c10i11p10r10o10c10i10t10y.
 *                ^---------------------------:
 *    ("reciprocity" will only be hyphenated here)
 *    Note the dots at the beginning and the end of the word!
 * Comments are not supported in the input file.
 *
 * tex2hpb.js collects characters from the patterns to build
 * the alphabet. In some cases a language may know characters
 * that are not represented in the patterns. For such cases
 * a special translate-file can be defined as second input to
 * tex2hpb.js:
 * For each character used by the language occupies one line.
 * On each line the first character is the "main character" used
 * in the patterns followed by other representations of the same
 * character, if any (e.g. its uppercase form):
 * Example:
 * aA
 * äÄ
 * sSſ
 * ß
 * If a translate-file is given, the information of the translate-
 * file is added to the information collected from the pattern file.
 * Example:
 * If the collected alphabet is "äÄsS" and the translate contains
 * "äA\nsSſ", the resulting alphabet will be "äÄAsSſ".
 * To overwrite collected character information add an exclamation
 * mark (!) at the end of the line in the translate-file.
 * Example:
 * If the collected alphabet is "äÄsS" and the translate contains
 * "äA!\nsSſ", the resulting alphabet will be "äAsSſ".
 * The translate-file must be encoded in utf-8, comments are not
 * supported.
 */

/* Binary format: .hpb (hyphenopoly patterns binary)
 * The hyphenopoly patterns binary stores hyphenation patterns
 * for one language in a tight format shaped for fast loading
 * and execution by Hyphenopoly.js
 * Unlike in other hyphenation binaries (like e.g. .hyb files) the
 * patterns are not stored as a trie. The trie is (even when packed)
 * slightly larger then the raw patterns.
 * The trie has to be built by the consumer of the patterns.
 * The binary file consists of three parts: HEADER, TRANSLATE and
 * PATTERNS. All data is little endian.
 *
 * HEADER
 * Uint32Array of length 6
 * [0]: magic number 0x01627068 (\hpb1, 1 is the version)
 * [1]: PATTERNS offset
 * [2]: Trie Array Size (needed to allocate memory)
 * [3]: Values Size (needed to allocate memory)
 * [4]: leftmin
 * [5]: rightmin
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
 * The odd adresses of the chars are the internal uInts.
 * By using 16bits the characters are restricted to the BMP.
 * Example1:
 * If the chars used in the patterns where 'abc' the TRANSLATE will be
 * 'aAbBcC' (0x0300 0x6100 0x4100 0x6200 0x4200 0x6300 0x4300)
 * Characters in the TRANSLATE table are sorted by their Unicode code
 * point in increasing order (except substitutions see below)
 * Characters that don't have a upperCase are followed by 0.
 * Characters that are a substitution for an other character in the
 * alphabet are stored at the end of the list, preceded by their
 * substituted character.
 * The underline character (_) is reserved to mark the beginning and
 * the end of the word (TeX patterns use the dot (.) for this purpose)
 * and is alway the first character in the TRANSLATE.
 * Example2:
 * For the characters '_rst' and 'ſ' (LATIN SMALL LETTER LONG S) the
 * TRANSLATE is '4_\0rRsStTsſ' (substitutes dont count for the length)
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
 * TeX patterns contain numbers from 1 to 9 to indicate hyphenation points
 * and the characters of the alphabet.
 * The numbers are directly stored with their value. The word boundary
 * marker (_) has always the value 12 (0xC). The other characters are
 * stored with values >= 13 (0xD). Thus the maximum alphabet length is
 * 255 - 12 = 243 which should be enough for most use cases.
 * Example 3:
 * Given the TRANSLATE '_\0aAbBcC'
 * (0x0400 0x5f00 0x0000 0x6100 0x4100 0x6200 0x4200 0x6300 0x4300)
 * the pattern '1ba' is stored as '0x01 0x0e 0x0d' = '01 14 13'
 * Individual patterns are not seperated. Instead patterns of the same
 * length are grouped and prefixed by their length surrounded by
 * colons (:).
 * Example 4:
 * The patterns '1ba 1be 1abd 1abf 5einstellunge' are grouped as
 * follows
 * ':3:1ba1be:4:1abd1abf:13:5einstellunge'
 * (0x3a 0x03 0x3a 0x01 0x0e 0x0d 0x01 0x0e etc.)
 * Pattterns inside each group may be sorted by their code point
 * values to achieve good compression rates.
 */

const fs = require("fs");
const path = require("path");

const VERSION = 1;
const inputFileName = process.argv[2];
const substituteFileName = process.argv[3];
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

function createHeader(translateLength, trieLength, valueLength) {
    "use strict";
    const headerui32 = new Uint32Array(6);
    const patternByteOffset = headerui32.byteLength + translateLength;
    headerui32[0] = createMagicNumber();
    headerui32[1] = patternByteOffset;
    headerui32[2] = trieLength;
    headerui32[3] = valueLength;
    headerui32[4] = leftmin;
    headerui32[5] = rightmin;
    return headerui32;
}

function getInputFile() {
    "use strict";
    logger.log(`read input file: ${inputFileName} (${fs.statSync(inputFileName).size} Bytes)`);
    let inputfile = fs.readFileSync("./" + inputFileName, "utf8");
    inputfile = inputfile.trim();
    inputfile = inputfile.replace(/(\d{2})\n/, function (ignore, p1) {
        let digits = p1.split("");
        leftmin = parseInt(digits[0], 10);
        rightmin = parseInt(digits[1], 10);
        logger.log(`set leftmin: ${leftmin}, rightmin: ${rightmin}`);
        return "";
    });
    inputfile = inputfile.replace(/\./g, "_");
    inputfile = inputfile.replace(/\n/g, " ");
    return inputfile;
}

function getSubstituteFile() {
    "use strict";
    if (substituteFileName && substituteFileName !== "null") {
        logger.log(`read substitute file: ${substituteFileName}`);
        let substitutefile = fs.readFileSync("./" + substituteFileName, "utf8");
        return substitutefile;
    }
    logger.log("no substitute file")
    return null;
}

function createTranslate(inputfile, substitutions) {
    "use strict";
    const charSet = new Set();
    let i = 0;
    let c = "";
    charSet.add("_");
    while (i < inputfile.length) {
        c = inputfile.charAt(i);
        if (c !== " " && c.codePointAt(0) > 57) {
            charSet.add(c);
        }
        i += 1;
    }
    const sortedChars = Array.from(charSet).sort();
    const translateTable = [0]; //alphabet length
    const alphabet = [];
    const subst = [];
    i = 0;
    c = "";
    let C = "";
    while (i < sortedChars.length) {
        c = sortedChars[i];
        C = c.toUpperCase();
        translateTable.push(c.codePointAt(0));
        alphabet.push(c);
        translateTable[0] += 1;
        if (c !== C && C.length === 1) {
            translateTable.push(C.codePointAt(0));
            alphabet.push(C);
        } else {
            translateTable.push(0);
            alphabet.push("⎵");
        }
        i += 1;
    }
    logger.log(`collected alphabet of length ${alphabet.length}:`);
    logger.log(`${alphabet.join("")}`, true);
    if (substitutions) {
        i = 0;
        while (i < substitutions.length) {
            c = substitutions[i];
            translateTable.push(c.codePointAt(0));
            subst.push(c);
            i += 1;
        }
    }
    logger.log(`collected substitutions: ${subst.join("")}`);
    const ui16 = Uint16Array.from(translateTable);
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

function createPatterns(inputfile, translate) {
    "use strict";
    const lookuptable = createTranslateLookUpTable(translate);
    const allPatterns = inputfile.split(" ");
    const exceptions = [];
    const translatedPatterns = allPatterns.map(function (pat) {
        let i = 0;
        let cP1 = 0;
        let cP2 = 0;
        const ret = [];
        let isException = false;
        while (i < pat.length) {
            cP1 = pat.codePointAt(i);
            if (cP1 > 57) {
                ret.push(lookuptable[cP1]);
            } else {
                cP2 = pat.codePointAt(i + 1);
                if (cP2 && (cP2 < 57)) {
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
                nextRowStart = trieNextEmptyRow + trieRowLength;
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
    console.log(`\x1b[35mRunning tex2hbp.js (v${VERSION}) on node.js (${process.version})\x1b[0m`);
    const inputfile = getInputFile();
    const substitutefile = getSubstituteFile();
    const translate = createTranslate(inputfile, substitutefile);
    const patterns = createPatterns(inputfile, translate);
    const dummyTrie = new TrieCreator(patterns, translate[0] * 2);
    const header = createHeader(
        translate.byteLength,
        dummyTrie.trieLength,
        dummyTrie.valueStoreLength
    );

    let fileBufferSize = header.byteLength + translate.byteLength + patterns.byteLength;
    fileBufferSize = fileBufferSize + (4 - fileBufferSize % 4);
    const fileBuffer = new ArrayBuffer(fileBufferSize);
    const fileBufferui32 = new Uint32Array(fileBuffer);
    const fileBufferui16 = new Uint16Array(fileBuffer);
    const fileBufferui8 = new Uint8Array(fileBuffer);

    fileBufferui32.set(header, 0);
    fileBufferui16.set(translate, header.byteLength >> 1);
    fileBufferui8.set(patterns, header.byteLength + translate.byteLength);
    fs.writeFile(path.basename(inputFileName, ".txt") + ".hpb", fileBufferui8, function (err) {
        if (err) {
            console.log(err);
        } else {
            logger.log(`Finish: file saved to '${path.basename(inputFileName, ".txt") + ".hpb"}' (${fileBufferSize} Bytes)`);
            console.log(`\x1b[35mtook ${process.hrtime(start)} seconds\x1b[0m`);
        }
    });}

main();