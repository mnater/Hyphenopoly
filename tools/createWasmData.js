/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-env node */
/* global console */

/**
 * Reads parsed pattern data in JSON format and emits two files:
 * 1) A file containing the succinct trie data
 * 2) A file containing imported globals
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

import fs from "fs";
import process from 'node:process';
import strie from "./modules/sTrie.js";
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

/**
 * Aligns a byteoffset such that byteoffset mod align === 0
 * Align is 1 = 8bit, 2 = 16bit, 4 = 32bit or 8 = 64bit
 * @param {number} offset - offset before alignment
 * @param {number} align - number of bytes
 * @returns {number} offset
 */
function alignOffsetTo(offset, align) {
    switch (align) {
    case 1:
        return offset;
    case 2:
        return offset + (offset % 2);
    case 4:
        return offset + ((4 - (offset % 4)) % 4);
    case 8:
        return offset + ((8 - (offset % 8)) % 8);
    default:
        // eslint-disable-next-line no-console
        console.log("Alignment error");
        return null;
    }
}

const licenseOffset = 0;
const alphabetOffset = alignOffsetTo(
    licenseOffset + license.buffer.byteLength,
    2
);
const bitMapOffset = alignOffsetTo(
    alphabetOffset + alphabet.buffer.byteLength,
    8
);
const charMapOffset = alignOffsetTo(
    bitMapOffset + strieDat.bits.buffer.byteLength,
    1
);
const hasValueOffset = alignOffsetTo(
    charMapOffset + strieDat.chars.buffer.byteLength,
    8
);
const valuemapOffset = alignOffsetTo(
    hasValueOffset + strieDat.hasValueBits.buffer.byteLength,
    8
);
const valuesOffset = alignOffsetTo(
    valuemapOffset + strieDat.valuesBitMap.buffer.byteLength,
    1
);
const dataEndOffset = alignOffsetTo(
    valuesOffset + strieDat.values.buffer.byteLength,
    4
);

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

const output = new Uint8Array(dataEndOffset);
output.set(new Uint8Array(license.buffer), 0);
output.set(new Uint8Array(alphabet.buffer), alphabetOffset);
output.set(new Uint8Array(strieDat.bits.buffer), bitMapOffset);
output.set(new Uint8Array(strieDat.chars.buffer), charMapOffset);
output.set(new Uint8Array(strieDat.hasValueBits.buffer), hasValueOffset);
output.set(new Uint8Array(strieDat.valuesBitMap.buffer), valuemapOffset);
output.set(new Uint8Array(strieDat.values.buffer), valuesOffset);

fs.writeFileSync(process.argv[3], output);

let imports = "";
const dataOffset = 2176;
imports += `export const ao: i32 = ${alphabetOffset + dataOffset};\n`;
imports += `export const as: i32 = ${alphabet.length};\n`;
imports += `export const bm: i32 = ${bitMapOffset + dataOffset};\n`;
imports += `export const cm: i32 = ${charMapOffset + dataOffset};\n`;
imports += `export const hv: i32 = ${hasValueOffset + dataOffset};\n`;
imports += `export const vm: i32 = ${valuemapOffset + dataOffset};\n`;
imports += `export const va: i32 = ${valuesOffset + dataOffset};\n`;
imports += `export const lm: i32 = ${input.lrmin[0]};\n`;
imports += `export const rm: i32 = ${input.lrmin[1]};\n`;

fs.writeFileSync(process.argv[4], imports);
