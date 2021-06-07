/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-env node */

/**
 * Reads parsed pattern data in JSON format and emits data for wasm
 *
 * Data Structure:
 *
 * HEADER
 * Uint32Array of length 8
 * [0]: 0
 * [1]: ALPHABET offset
 * [2]: BITMAP offset
 * [3]: CHARMAP offset
 * [4]: VALUEMAP offset
 * [5]: VALUES offset
 * [6]: LEFTMIN
 * [7]: RIGHTMIN
 *
 * LICENSE
 * ASCII encoded license text
 *
 * ALPHABET
 * All characters used in these patterns
 *
 * BITMAP, CHARMAP, VALUEMAP, VALUES
 * Succinct hyphenation pattern trie data
 *
 * Usage:
 * # node createWasmData.js <lang>.json.js outname
 */

"use strict";
const fs = require("fs");
const strie = require("./modules/sTrie.js");
const rawInput = fs.readFileSync(process.argv[2]);
const input = JSON.parse(rawInput);

const license = Uint8Array.from([...input.lic], (char) => {
    return char.charCodeAt(0);
});

const alphabet = Uint16Array.from([...input.chr.join("")], (char) => {
    return char.charCodeAt(0);
});

input.pat.forEach((element) => {
    strie.add(element[1], element[2]);
});
strie.build(input.chr);

const strieDat = strie.dump();

const licenseOffset = 8 * 4;
const alphabetOffset = licenseOffset + license.buffer.byteLength;
const bitMapOffset = alphabetOffset + alphabet.buffer.byteLength;
const charMapOffset = bitMapOffset + strieDat.bits.buffer.byteLength;
const hasValueOffset = charMapOffset + strieDat.chars.buffer.byteLength;
const valuemapOffset = hasValueOffset + strieDat.hasValueBits.buffer.byteLength;
const valuesOffset = valuemapOffset + strieDat.valuesBitMap.buffer.byteLength;
let fileSize = valuesOffset + strieDat.values.buffer.byteLength;
fileSize += (4 - (fileSize % 4));

/*
 * Log data
 * console.log("lic:", license.buffer.byteLength);
 * console.log("alp:", alphabet.buffer.byteLength);
 * console.log("bit:", strieDat.bits.buffer.byteLength);
 * console.log("chr:", strieDat.chars.buffer.byteLength);
 * console.log("hvb:", strieDat.hasValueBits.buffer.byteLength);
 * console.log("vbm:", strieDat.valuesBitMap.buffer.byteLength);
 * console.log("val:", strieDat.values.buffer.byteLength);
 * console.log("tot:", fileSize);
 */


const header = Uint32Array.from([
    alphabetOffset,
    bitMapOffset,
    charMapOffset,
    hasValueOffset,
    valuemapOffset,
    valuesOffset,
    input.lrmin[0],
    input.lrmin[1]
]);

const output = new Uint8Array(fileSize);
output.set(new Uint8Array(header.buffer), 0);
output.set(new Uint8Array(license.buffer), 32);
output.set(new Uint8Array(alphabet.buffer), alphabetOffset);
output.set(new Uint8Array(strieDat.bits.buffer), bitMapOffset);
output.set(new Uint8Array(strieDat.chars.buffer), charMapOffset);
output.set(new Uint8Array(strieDat.hasValueBits.buffer), hasValueOffset);
output.set(new Uint8Array(strieDat.valuesBitMap.buffer), valuemapOffset);
output.set(new Uint8Array(strieDat.values.buffer), valuesOffset);

fs.writeFileSync(process.argv[3], output);
