/* eslint-disable no-console */
/* eslint-env node */
"use strict";
const fsp = require("fs").promises;
const {StringDecoder} = require("string_decoder");

const decode = (function makeDecoder() {
    const utf16ledecoder = new StringDecoder("utf-16le");
    return function dec(ui16) {
        return utf16ledecoder.write(ui16);
    };
}());

/**
 * Convert a node buffer to a typed array
 * @param {buffer} buf - A Node buffer object
 * @return {TypedArray.buffer}
 */
function nodeBuffer2typedArray(nb) {
    if ((nb.byteOffset === 0) && (nb.byteLength === nb.buffer.byteLength)) {
        return nb.buffer;
    }
    return nb.buffer.slice(nb.byteOffset, nb.byteOffset + nb.byteLength);
}

/**
 * Load wasm, build trie, copy string to wasm-memory, hyphenate, log
 * @param {string} word - Word to be hyphenated
 */
function hyphenate(word) {
    return fsp.readFile("./de.wasm").
        then((nbuf) => {
            const ab = nodeBuffer2typedArray(nbuf);
            return WebAssembly.instantiate(ab);
        }).
        then((res) => {
            const exp = res.instance.exports;
            const heapBuffer = exp.mem.buffer;
            const wordStore = new Uint16Array(heapBuffer, exp.uwo.value, 64);
            const hydWrdStore = new Uint16Array(heapBuffer, exp.hwo.value, 128);
            exp.conv();
            let i = 0;
            let cc = word.charCodeAt(i);
            while (cc) {
                i += 1;
                // eslint-disable-next-line security/detect-object-injection
                wordStore[i] = cc;
                cc = word.charCodeAt(i);
            }
            wordStore[0] = 95;
            wordStore[i + 1] = 95;
            wordStore[i + 2] = 0;
            exp.hyphenate(4, 4, 45);
            word = decode(hydWrdStore.subarray(1, hydWrdStore[0] + 1));
            return word;
        });
}

hyphenate("Silbentrennungsalgorithmus").then(console.log);
