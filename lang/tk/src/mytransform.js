/* eslint-disable
    require-jsdoc,
    security/detect-non-literal-fs-filename
*/
/* eslint-env node */

"use strict";
const {Transform} = require("assemblyscript/cli/transform");
const fs = require("fs");
const h = require("../../../tools/calculateBaseData.js");
const lang = fs.readFileSync("./lang.txt", "utf8");
const data = fs.readFileSync(`./${lang}.hpb`);
const metaData = h.calculateBaseData(data);
const memBase = metaData.hs / 1024 / 64;

class MyTransform extends Transform {
    afterCompile(asModule) {
        this.log("  [mytransform.js] add data...");
        asModule.setMemory(memBase, -1, "mem", [
            {
                data,
                "offset": asModule.i32.const(metaData.ho)
            }
        ]);
    }
}

module.exports = MyTransform;
