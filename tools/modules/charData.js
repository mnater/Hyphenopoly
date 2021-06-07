/* eslint-disable security/detect-object-injection */
/* eslint-disable require-jsdoc */
/* eslint-env node */
"use strict";
function charData() {
    const data = [];
    return {
        "add"(translatedCC) {
            data.push(translatedCC);
        },
        "asUint8Array"() {
            return Uint8Array.from(data);
        },
        "get"(pos) {
            return data[pos];
        }
    };
}
module.exports = charData();
