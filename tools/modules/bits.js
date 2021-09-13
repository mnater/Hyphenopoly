/* eslint-disable security/detect-object-injection */
/* eslint-disable require-jsdoc */
/* eslint-env node */
"use strict";
function bits() {
    const data = [];

    function rank1(pos) {
        let cpos = 0;
        let count = 0;
        while (cpos < pos) {
            if (data[cpos] === 1) {
                count += 1;
            }
            cpos += 1;
        }
        return count;
    }

    function select0(ith) {
        let pos = 0;
        let count = 0;
        while (count < ith) {
            if (data[pos] === 0) {
                count += 1;
            }
            if (pos > data.length) {
                return false;
            }
            pos += 1;
        }
        return pos - 1;
    }

    function getFirstChild(n) {
        return select0(n + 1) - n;
    }

    function getChild(n, c) {
        return getFirstChild(n) + c;
    }

    function countChildren(n) {
        return getFirstChild(n + 1) - getFirstChild(n);
    }

    function asUint8Array() {
        const bitString = data.join("");
        let pos = 0;
        const bytes = [];
        while (pos < bitString.length) {
            bytes.push(parseInt(bitString.substr(pos, 8).padEnd(8, "0"), 2));
            pos += 8;
        }
        const ret = Uint8Array.from(bytes);
        return ret;
    }

    return {
        "add"(bit) {
            data.push(bit);
        },
        asUint8Array,
        countChildren,
        "get"(idx) {
            return data[idx];
        },
        getChild,
        rank1,
        select0
    };
}
module.exports = bits;
