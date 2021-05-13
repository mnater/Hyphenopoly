/* eslint-disable require-await */
/* eslint-disable no-shadow */
/* eslint-env node */
"use strict";
const t = require("tap");
const fs = require("fs").promises;

const TD = typeof TextDecoder === "undefined"
    ? require("util").TextDecoder
    : TextDecoder;

const decode = (() => {
    const utf16ledecoder = new TD("utf-16le");
    return (ui16) => {
        return utf16ledecoder.decode(ui16);
    };
})();

t.test("load module", async(t) => {
    const hyphenEngine = await fs.readFile("./patterns/de.wasm");
    t.test("check wasm header", async(t) => {
        return t.same(
            new Uint8Array(hyphenEngine.buffer.slice(0, 4)),
            new Uint8Array([0, 97, 115, 109])
        );
    });
    t.test("check filesize", async(t) => {
        return t.equal(
            hyphenEngine.buffer.byteLength,
            91989,
            "update when de.wasm changes"
        );
    });
    t.test("instantiate wasm", async(t) => {
        const result = await WebAssembly.instantiate(hyphenEngine.buffer);
        t.test("check instance keys", async(t) => {
            return t.same(
                Object.keys(result.instance.exports),
                ["uwo", "hwo", "lmi", "rmi", "subst", "conv", "hyphenate", "mem"]
            );
        });
        t.test("build trie", async(t) => {
            const ret = result.instance.exports.conv();
            return t.equal(ret, 32, "length of alphabet");
        });
        t.test("check translate table", async(t) => {
            const heapBuffer = result.instance.exports.mem.buffer;
            const translateTableCC = new Uint16Array(heapBuffer, 0, 256);
            const translateTableID = new Uint8Array(heapBuffer, 512, 256);
            return t.same(
                [
                    translateTableID[translateTableCC.indexOf(95)],
                    translateTableID[translateTableCC.indexOf(97)],
                    translateTableID[translateTableCC.indexOf(98)],
                    translateTableID[translateTableCC.indexOf(65)]
                ],
                [1, 2, 3, 2]
            );
        });
        t.test("hyphenate standard word", async(t) => {
            const heapBuffer = result.instance.exports.mem.buffer;
            const unhyphenatedWordOffset = (WebAssembly.Global)
                ? result.instance.exports.uwo.value
                : result.instance.exports.uwo;
            const hyphenatedWordOffset = (WebAssembly.Global)
                ? result.instance.exports.hwo.value
                : result.instance.exports.hwo;
            const unhyphenatedWordStore = new Uint16Array(
                heapBuffer,
                unhyphenatedWordOffset,
                64
            );
            unhyphenatedWordStore.set([
                95,
                ...[..."Silbentrennung"].map((c) => {
                    return c.charCodeAt(0);
                }),
                95,
                0
            ]);
            const len = result.instance.exports.hyphenate(2, 2, 8226);
            t.test("check length of hwo", async(t) => {
                return t.equal(len, 17);
            });
            t.test("check hyphenated word", async(t) => {
                const hw = decode(
                    new Uint16Array(heapBuffer, hyphenatedWordOffset, len)
                );
                return t.equal(hw, "Sil•ben•tren•nung");
            });
        });

        t.test("hyphenate word with unknown char (no collision)", async(t) => {
            const heapBuffer = result.instance.exports.mem.buffer;
            const unhyphenatedWordOffset = (WebAssembly.Global)
                ? result.instance.exports.uwo.value
                : result.instance.exports.uwo;
            const hyphenatedWordOffset = (WebAssembly.Global)
                ? result.instance.exports.hwo.value
                : result.instance.exports.hwo;
            const unhyphenatedWordStore = new Uint16Array(
                heapBuffer,
                unhyphenatedWordOffset,
                64
            );
            unhyphenatedWordStore.set([
                95,
                ...[..."Jalapeños"].map((c) => {
                    return c.charCodeAt(0);
                }),
                95,
                0
            ]);
            const len = result.instance.exports.hyphenate(2, 2, 8226);
            t.test("check length of hwo", async(t) => {
                return t.equal(len, 0);
            });
            t.test("check hyphenated word", async(t) => {
                const hw = decode(
                    new Uint16Array(heapBuffer, hyphenatedWordOffset, len)
                );
                return t.equal(hw, "");
            });
        });

        t.test("hyphenate word with unknown char (collision)", async(t) => {
            const heapBuffer = result.instance.exports.mem.buffer;
            const unhyphenatedWordOffset = (WebAssembly.Global)
                ? result.instance.exports.uwo.value
                : result.instance.exports.uwo;
            const hyphenatedWordOffset = (WebAssembly.Global)
                ? result.instance.exports.hwo.value
                : result.instance.exports.hwo;
            const unhyphenatedWordStore = new Uint16Array(
                heapBuffer,
                unhyphenatedWordOffset,
                64
            );
            unhyphenatedWordStore.set([
                95,
                ...[..."Test\u0563test"].map((c) => {
                    return c.charCodeAt(0);
                }),
                95,
                0
            ]);
            const len = result.instance.exports.hyphenate(2, 2, 8226);
            t.test("check length of hwo", async(t) => {
                return t.equal(len, 0);
            });
            t.test("check hyphenated word", async(t) => {
                const hw = decode(
                    new Uint16Array(heapBuffer, hyphenatedWordOffset, len)
                );
                return t.equal(hw, "");
            });
        });

        t.test("Add char substitution (no collision)", async(t) => {
            const ret = result.instance.exports.subst(241, 209, 110);
            t.test("check new alphabet length", async(t) => {
                return t.equal(ret, 33);
            });
            t.test("check translate table with char substitution", async(t) => {
                const heapBuffer = result.instance.exports.mem.buffer;
                const translateTableCC = new Uint16Array(heapBuffer, 0, 256);
                const translateTableID = new Uint8Array(heapBuffer, 512, 256);
                return t.same(
                    [
                        translateTableID[translateTableCC.indexOf(241)],
                        translateTableID[translateTableCC.indexOf(209)],
                        translateTableID[translateTableCC.indexOf(110)]
                    ],
                    [15, 15, 15]
                );
            });
            t.test("hyphenate word with substituted char", async(t) => {
                const exp = result.instance.exports;
                const heapBuffer = exp.mem.buffer;
                const unhyphenatedWordOffset = (WebAssembly.Global)
                    ? result.instance.exports.uwo.value
                    : result.instance.exports.uwo;
                const hyphenatedWordOffset = (WebAssembly.Global)
                    ? result.instance.exports.hwo.value
                    : result.instance.exports.hwo;
                const unhyphenatedWordStore = new Uint16Array(
                    heapBuffer,
                    unhyphenatedWordOffset,
                    64
                );
                unhyphenatedWordStore.set([
                    95,
                    ...[..."Jalapeños"].map((c) => {
                        return c.charCodeAt(0);
                    }),
                    95,
                    0
                ]);
                const len = result.instance.exports.hyphenate(2, 2, 8226);
                t.test("check length of hwo", async(t) => {
                    return t.equal(len, 11);
                });
                t.test("check hyphenated word", async(t) => {
                    const hw = decode(
                        new Uint16Array(heapBuffer, hyphenatedWordOffset, len)
                    );
                    return t.equal(hw, "Jala•pe•ños");
                });
            });
        });
        t.test("Add char substitution (collision)", async(t) => {
            const ret = result.instance.exports.subst(1086, 1054, 111);
            t.test("check new alphabet length", async(t) => {
                return t.equal(ret, 34);
            });
            t.test("check translate table with char substitution", async(t) => {
                const heapBuffer = result.instance.exports.mem.buffer;
                const collisionsTable = new Uint16Array(heapBuffer, 768, 128);
                return t.same(
                    [
                        collisionsTable[collisionsTable.indexOf(1086) + 1],
                        collisionsTable[collisionsTable.indexOf(1054) + 1]
                    ],
                    [16, 16]
                );
            });
            t.test("hyphenate word with substituted char", async(t) => {
                const exp = result.instance.exports;
                const heapBuffer = exp.mem.buffer;
                const unhyphenatedWordOffset = (WebAssembly.Global)
                    ? result.instance.exports.uwo.value
                    : result.instance.exports.uwo;
                const hyphenatedWordOffset = (WebAssembly.Global)
                    ? result.instance.exports.hwo.value
                    : result.instance.exports.hwo;
                const unhyphenatedWordStore = new Uint16Array(
                    heapBuffer,
                    unhyphenatedWordOffset,
                    64
                );
                unhyphenatedWordStore.set([
                    95,
                    ...[..."Glasn\u043Est"].map((c) => {
                        return c.charCodeAt(0);
                    }),
                    95,
                    0
                ]);
                const len = result.instance.exports.hyphenate(2, 2, 8226);
                t.test("check length of hwo", async(t) => {
                    return t.equal(len, 9);
                });
                t.test("check hyphenated word", async(t) => {
                    const hw = decode(
                        new Uint16Array(heapBuffer, hyphenatedWordOffset, len)
                    );
                    return t.equal(hw, "Glas•n\u043Est");
                });
            });
        });

        t.test("Add char substitution (fill collision space)", async(t) => {
            return t.throws(() => {
                for (let index = 0; index < 32; index += 1) {
                    result.instance.exports.subst(1086, 1054, 111);
                }
            }, new Error("unreachable"));
        });
    });
});
