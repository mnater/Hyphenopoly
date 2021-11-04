/* eslint-disable require-jsdoc */
/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-env node */

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
 * Double the memory pages for supplementary data structures
 * TODO: This should be optimized when stable
 */
const heapSizePages = (heapSizeBytes / 1024 / 64);

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
