/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-env node */

/**
 * Reads parsed pattern data in JSON format and emits data for wasm
 *
 * Data Structure:
 *
 * LICENSE
 * ASCII encoded license text
 *
 * ALPHABET
 * All characters used in these patterns
 *
 * BITMAP, CHARMAP, HASVALUEMAP, VALUEMAP, VALUES
 * Succinct hyphenation pattern trie data
 *
 * Usage:
 * # node createWasmData.js <lang>.json data-outname globals-outname
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
    if (char === "_") {
        return 0;
    }
    return char.charCodeAt(0);
});

input.pat.forEach((element) => {
    strie.add(element[1], element[2]);
});
strie.build(input.chr);

const strieDat = strie.dump();

const licenseOffset = 0;
const alphabetOffset = licenseOffset + license.buffer.byteLength;
const bitMapOffset = alphabetOffset + alphabet.buffer.byteLength;
const charMapOffset = bitMapOffset + strieDat.bits.buffer.byteLength;
const hasValueOffset = charMapOffset + strieDat.chars.buffer.byteLength;
const valuemapOffset = hasValueOffset + strieDat.hasValueBits.buffer.byteLength;
const valuesOffset = valuemapOffset + strieDat.valuesBitMap.buffer.byteLength;
let dataEndOffset = valuesOffset + strieDat.values.buffer.byteLength;
dataEndOffset += (4 - (dataEndOffset % 4));

/*
 * Log data
 * console.log("lic:", license.buffer.byteLength);
 * console.log("alp:", alphabet.buffer.byteLength);
 * console.log("bit:", strieDat.bits.buffer.byteLength);
 * console.log("chr:", strieDat.chars.buffer.byteLength);
 * console.log("hvb:", strieDat.hasValueBits.buffer.byteLength);
 * console.log("vbm:", strieDat.valuesBitMap.buffer.byteLength);
 * console.log("val:", strieDat.values.buffer.byteLength);
 * console.log("tot:", dataEndOffset);
 */

let imports = "";
const dataOffset = 1920;
imports += `export const ao: i32 = ${alphabetOffset + dataOffset};\n`;
imports += `export const bm: i32 = ${bitMapOffset + dataOffset};\n`;
imports += `export const cm: i32 = ${charMapOffset + dataOffset};\n`;
imports += `export const hv: i32 = ${hasValueOffset + dataOffset};\n`;
imports += `export const vm: i32 = ${valuemapOffset + dataOffset};\n`;
imports += `export const va: i32 = ${valuesOffset + dataOffset};\n`;
imports += `export const lm: i32 = ${input.lrmin[0]};\n`;
imports += `export const rm: i32 = ${input.lrmin[1]};\n`;

fs.writeFileSync(process.argv[4], imports);

const output = new Uint8Array(dataEndOffset);
output.set(new Uint8Array(license.buffer), 0);
output.set(new Uint8Array(alphabet.buffer), alphabetOffset);
output.set(new Uint8Array(strieDat.bits.buffer), bitMapOffset);
output.set(new Uint8Array(strieDat.chars.buffer), charMapOffset);
output.set(new Uint8Array(strieDat.hasValueBits.buffer), hasValueOffset);
output.set(new Uint8Array(strieDat.valuesBitMap.buffer), valuemapOffset);
output.set(new Uint8Array(strieDat.values.buffer), valuesOffset);

fs.writeFileSync(process.argv[3], output);
