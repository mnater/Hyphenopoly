/* eslint-disable require-jsdoc */
/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-env node */

/*
 * Memory layout (static)
 *
 * #--------------------# <- Offset 0
 * |        word        |
 * | 64 * Uint16 = 128B |
 * #--------------------# <- 128
 * |   translatedWord   |
 * |  64 * Uint8 = 64B  |
 * #--------------------# <- 192
 * |    hyphenPoints    |
 * |  64 * Uint8 = 64B  |
 * #--------------------# <- 256
 * |    translateMap    |
 * |         keys:      |
 * | 256 chars * 2Bytes |
 * |          +         |
 * |       values:      | 1024B
 * | 256 chars * 1Byte  |
 * |          +         |
 * |     collisions:    |
 * | 64 buckets * 4Byte |
 * #--------------------# <- 1280
 * |      alphabet      |
 * | 256 chars * 2Bytes | 512B
 * #--------------------# <- 1792
 * |    originalWord    |
 * | 64 * Uint16 = 128B |
 * #--------------------# <- 1920   - DATAOFFSET
 * |       header       |           |
 * |  8 * Uint32 = 32B  |           |
 * #--------------------# <- 288    |
 * |      licence       |           |
 * #--------------------#           |
 * |      alphabet      |           |
 * #--------------------#           |
 * |     STrieBits      |           |
 * #--------------------#           } pattern data (succinct value trie)
 * |     STrieChars     |           |
 * #--------------------#           |
 * |    hasValueBits    |           |
 * #--------------------#           |
 * |    valuesBitMap    |           |
 * #--------------------#           |
 * |       values       |           |
 * #--------------------# <- dataEnd-
 * |   alignment bytes  |
 * #--------------------# <- heapSize
 */

"use strict";
const {Transform} = require("assemblyscript/cli/transform");
const fs = require("fs");
const lang = fs.readFileSync("./lang.txt", "utf8");
const data = fs.readFileSync(`./${lang}.data`);

const dataOffset = 1920;
const dataSize = data.buffer.byteLength;
const heapSizeBytes = Math.max(
    Math.ceil((dataOffset + dataSize) / 65536) * 65536,
    65536
);

/*
 * Add one additional memory page for supplementary data structures
 * TODO: This should be optimized when stable
 */
const heapSizePages = (heapSizeBytes / 1024 / 64) + 1;

class MyTransform extends Transform {
    afterCompile(asModule) {
        this.log("  [mytransform.js] add data...");
        asModule.setMemory(heapSizePages, -1, "mem", [
            {
                data,
                "offset": asModule.i32.const(dataOffset)
            }
        ]);
    }
}

module.exports = MyTransform;
