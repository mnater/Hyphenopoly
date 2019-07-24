/**
 * @license Hyphenopoly.module.js 3.1.2 - hyphenation for node
 * ©2018  Mathias Nater, Zürich (mathiasnater at gmail dot com)
 * https://github.com/mnater/Hyphenopoly
 *
 * Released under the MIT license
 * http://mnater.github.io/Hyphenopoly/LICENSE
 */

/* eslint-env node */
"use strict";

/*
 * Use 'fs' in node environment and fallback to http if the module gets executed
 * in a browser environment (e.g. browserified)
 */
let loader = require("fs");

const {StringDecoder} = require("string_decoder");

const decode = (function makeDecoder() {
    const utf16ledecoder = new StringDecoder("utf-16le");
    return function dec(ui16) {
        return utf16ledecoder.write(Buffer.from(ui16));
    };
}());

/**
 * Create Object without standard Object-prototype
 * @returns {Object} empty object
 */
function empty() {
    return Object.create(null);
}

/**
 * Set value and properties of object member
 * Argument <props> is a bit pattern:
 * 1. bit: configurable
 * 2. bit: enumerable
 * 3. bit writable
 * e.g. 011(2) = 3(10) => configurable: f, enumerable: t, writable: t
 * or   010(2) = 2(10) => configurable: f, enumerable: t, writable: f
 * @param {any} val The value
 * @param {number} props bitfield
 * @returns {Object} Property object
 */
function setProp(val, props) {
    /* eslint-disable no-bitwise, sort-keys */
    return {
        "configurable": (props & 4) > 0,
        "enumerable": (props & 2) > 0,
        "writable": (props & 1) > 0,
        "value": val
    };
    /* eslint-enable no-bitwise, sort-keys */
}

const H = empty();
H.binaries = new Map();

H.supportedLanguages = [
    "af",
    "as",
    "be",
    "bg",
    "bn",
    "ca",
    "cs",
    "cy",
    "da",
    "de",
    "el-monoton",
    "el-polyton",
    "en-gb",
    "en-us",
    "eo",
    "es",
    "et",
    "eu",
    "fi",
    "fr",
    "fur",
    "ga",
    "gl",
    "grc",
    "gu",
    "hi",
    "hr",
    "hsb",
    "hu",
    "hy",
    "ia",
    "id",
    "is",
    "it",
    "ka",
    "kmr",
    "kn",
    "la-x-liturgic",
    "la",
    "lt",
    "lv",
    "ml",
    "mn-cyrl",
    "mr",
    "mul-ethi",
    "nb-no",
    "nl",
    "nn",
    "oc",
    "or",
    "pa",
    "pl",
    "pms",
    "pt",
    "rm",
    "ro",
    "ru",
    "sh-cyrl",
    "sh-latn",
    "sk",
    "sl",
    "sr-cyrl",
    "sv",
    "ta",
    "te",
    "th",
    "tk",
    "tr",
    "uk",
    "zh-latn-pinyin"
];

/**
 * Read a file and call callback
 * Use "fs" (node) or "http" (browser)
 * @param {string} file - the filename
 * @param {function} cb - callback function with args (error, data)
 * @returns {undefined}
 */
function readFile(file, cb, sync) {
    if (H.c.loader === "fs") {
        /* eslint-disable security/detect-non-literal-fs-filename */
        if (sync) {
            // eslint-disable-next-line no-sync
            return loader.readFileSync(file);
        }
        loader.readFile(file, cb);
        /* eslint-enable security/detect-non-literal-fs-filename */
    } else {
        loader.get(file, function onData(res) {
            const rawData = [];
            res.on("data", function onChunk(chunk) {
                rawData.push(chunk);
            });
            res.on("end", function onEnd() {
                cb(null, Buffer.concat(rawData));
            });
        });
    }
    return null;
}

/**
 * Read a wasm file, dispatch "engineLoaded" on success
 * @returns {undefined}
 */
function loadWasm() {
    if (H.c.sync) {
        /* eslint-disable security/detect-non-literal-fs-filename */
        const data = readFile(`${H.c.paths.maindir}hyphenEngine.wasm`, null, true);
        /* eslint-enable security/detect-non-literal-fs-filename */
        H.binaries.set("hyphenEngine", new Uint8Array(data).buffer);
        H.events.dispatch("engineLoaded");
    } else {
        readFile(
            `${H.c.paths.maindir}hyphenEngine.wasm`,
            function cb(err, data) {
                if (err) {
                    H.events.dispatch("error", {
                        "key": "hyphenEngine",
                        "msg": `${H.c.paths.maindir}hyphenEngine.wasm not found.`
                    });
                } else {
                    H.binaries.set("hyphenEngine", new Uint8Array(data).buffer);
                    H.events.dispatch("engineLoaded");
                }
            },
            false
        );
    }
}

/**
 * Read a hpb file, dispatch "hpbLoaded" on success
 * @param {string} lang - The language
 * @returns {undefined}
 */
function loadHpb(lang) {
    if (H.c.sync) {
        const data = readFile(`${H.c.paths.patterndir}${lang}.hpb`, null, true);
        H.binaries.set(lang, new Uint8Array(data).buffer);
        H.events.dispatch("hpbLoaded", {"msg": lang});
    } else {
        readFile(
            `${H.c.paths.patterndir}${lang}.hpb`,
            function cb(err, data) {
                if (err) {
                    H.events.dispatch("error", {
                        "key": lang,
                        "msg": `${H.c.paths.patterndir}${lang}.hpb not found.`
                    });
                } else {
                    H.binaries.set(lang, new Uint8Array(data).buffer);
                    H.events.dispatch("hpbLoaded", {"msg": lang});
                }
            },
            false
        );
    }
}

/**
 * Calculate heap size for wasm
 * wasm page size: 65536 = 64 Ki
 * @param {number} targetSize The targetet Size
 * @returns {number} The necessary heap size
 */
function calculateHeapSize(targetSize) {
    return Math.ceil(targetSize / 65536) * 65536;
}

/**
 * Calculate Base Data
 *
 * Build Heap (the heap object's byteLength must be
 * either 2^n for n in [12, 24)
 * or 2^24 · n for n ≥ 1;)
 *
 * MEMORY LAYOUT:
 *
 * -------------------- <- Offset 0
 * |   translateMap   |
 * |        keys:     |
 * |256 chars * 2Bytes|
 * |         +        |
 * |      values:     |
 * |256 chars * 1Byte |
 * -------------------- <- 768 Bytes
 * |     alphabet     |
 * |256 chars * 2Bytes|
 * -------------------- <- valueStoreOffset (vs) = 1280
 * |    valueStore    |
 * |      1 Byte      |
 * |* valueStoreLength|
 * --------------------
 * | align to 4Bytes  |
 * -------------------- <- patternTrieOffset (pt)
 * |    patternTrie   |
 * |     4 Bytes      |
 * |*patternTrieLength|
 * -------------------- <- wordOffset (wo)
 * |    wordStore     |
 * |    Uint16[64]    | 128 bytes
 * -------------------- <- translatedWordOffset (tw)
 * | transl.WordStore |
 * |    Uint8[64]     | 64 bytes
 * -------------------- <- hyphenPointsOffset (hp)
 * |   hyphenPoints   |
 * |    Uint8[64]     | 64 bytes
 * -------------------- <- hyphenatedWordOffset (hw)
 * |  hyphenatedWord  |
 * |   Uint16[128]    | 256 Bytes
 * -------------------- <- hpbOffset (ho)      -
 * |     HEADER       |                        |
 * |    6*4 Bytes     |                        |
 * |    24 Bytes      |                        |
 * --------------------                        |
 * |    PATTERN LIC   |                        |
 * |  variable Length |                        |
 * --------------------                        |
 * | align to 4Bytes  |                        } this is the .hpb-file
 * -------------------- <- hpbTranslateOffset  |
 * |    TRANSLATE     |                        |
 * | 2 + [0] * 2Bytes |                        |
 * -------------------- <-hpbPatternsOffset(po)|
 * |     PATTERNS     |                        |
 * |  patternsLength  |                        |
 * -------------------- <- heapEnd             -
 * | align to 4Bytes  |
 * -------------------- <- heapSize (hs)
 * @param {Object} hpbBuf FileBuffer from .hpb-file
 * @returns {Object} baseData-object
 */
function calculateBaseData(hpbBuf) {
    const hpbMetaData = new Uint32Array(hpbBuf).subarray(0, 8);
    const valueStoreLength = hpbMetaData[7];
    const valueStoreOffset = 1280;
    const patternTrieOffset = valueStoreOffset + valueStoreLength +
        (4 - ((valueStoreOffset + valueStoreLength) % 4));
    const wordOffset = patternTrieOffset + (hpbMetaData[6] * 4);
    return {
        // Set hpbOffset
        "ho": wordOffset + 512,
        // Set hyphenPointsOffset
        "hp": wordOffset + 192,
        // Set heapSize
        "hs": Math.max(calculateHeapSize(wordOffset + 512 + hpbMetaData[2] + hpbMetaData[3]), 32 * 1024 * 64),
        // Set hyphenatedWordOffset
        "hw": wordOffset + 256,
        // Set leftmin
        "lm": hpbMetaData[4],
        // Set patternsLength
        "pl": hpbMetaData[3],
        // Set hpbPatternsOffset
        "po": wordOffset + 512 + hpbMetaData[2],
        // Set patternTrieOffset
        "pt": patternTrieOffset,
        // Set rightmin
        "rm": hpbMetaData[5],
        // Set translateOffset
        "to": wordOffset + 512 + hpbMetaData[1],
        // Set translatedWordOffset
        "tw": wordOffset + 128,
        // Set valueStoreOffset
        "vs": valueStoreOffset,
        // Set wordOffset
        "wo": wordOffset
    };
}

/**
 * Convert exceptions to Map
 * @param {string} exc comma separated list of exceptions
 * @returns {Object} Map of exceptions
 */
function convertExceptions(exc) {
    const r = new Map();
    exc.split(", ").forEach(function eachExc(e) {
        const key = e.replace(/-/g, "");
        r.set(key, e);
    });
    return r;
}

/**
 * Create lang Object
 * @param {string} lang The language
 * @returns {Object} The newly created lang object
 */
function createLangObj(lang) {
    if (!H.languages) {
        H.languages = new Map();
    }
    if (!H.languages.has(lang)) {
        H.languages.set(lang, empty());
    }
    return H.languages.get(lang);
}

/**
 * Setup a language object (lo) and dispatch "engineReady"
 * @param {string} lang The language
 * @param {function} hyphenateFunction The hyphenateFunction
 * @param {string} alphabet List of used characters
 * @param {number} leftmin leftmin
 * @param {number} rightmin rightmin
 * @returns {undefined}
 */
function prepareLanguagesObj(
    lang,
    hyphenateFunction,
    alphabet,
    leftmin,
    rightmin
) {
    alphabet = alphabet.replace(/-/g, "");
    const lo = createLangObj(lang);
    if (!lo.engineReady) {
        lo.cache = new Map();
        /* eslint-disable security/detect-object-injection */
        if (H.c.exceptions.global) {
            if (H.c.exceptions[lang]) {
                H.c.exceptions[lang] += `, ${H.c.exceptions.global}`;
            } else {
                H.c.exceptions[lang] = H.c.exceptions.global;
            }
        }
        if (H.c.exceptions[lang]) {
            lo.exceptions = convertExceptions(H.c.exceptions[lang]);
            delete H.c.exceptions[lang];
        } else {
            lo.exceptions = new Map();
        }
        /* eslint-enable security/detect-object-injection */
        /* eslint-disable security/detect-non-literal-regexp */
        lo.genRegExp = new RegExp(`[\\w${alphabet}${String.fromCharCode(8204)}-]{${H.c.minWordLength},}`, "gi");
        /* eslint-enable security/detect-non-literal-regexp */
        lo.leftmin = leftmin;
        lo.rightmin = rightmin;
        lo.hyphenateFunction = hyphenateFunction;
        lo.engineReady = true;
    }
    H.events.dispatch("engineReady", {"msg": lang});
}

/**
 * Setup env for hyphenateFunction
 * @param {Object} baseData baseData
 * @param {function} hyphenateFunc hyphenateFunction
 * @returns {function} hyphenateFunction with closured environment
 */
function encloseHyphenateFunction(baseData, hyphenateFunc) {
    /* eslint-disable no-bitwise */
    const heapBuffer = baseData.wasmMemory.buffer;
    const wordOffset = baseData.wo;
    const wordStore = (new Uint16Array(heapBuffer)).subarray(
        wordOffset >> 1,
        (wordOffset >> 1) + 64
    );
    const defLeftmin = baseData.lm;
    const defRightmin = baseData.rm;
    const hyphenatedWordStore = (new Uint16Array(heapBuffer)).subarray(
        baseData.hw >> 1,
        (baseData.hw >> 1) + 128
    );
    /* eslint-enable no-bitwise */

    /**
     * The hyphenateFunction that encloses the env above
     * Copies the word to wasm-Memory, calls wasm.hyphenateFunc and reads
     * the hyphenated word from wasm-Memory (eventually replacing hyphenchar)
     * @param {String} word - the word that has to be hyphenated
     * @param {String} hyphenchar – the hyphenate character
     * @param {Number} leftmin – min number of chars to remain on line
     * @param {Number} rightmin – min number of chars to go to new line
     * @returns {String} the hyphenated word
     */
    wordStore[0] = 95;
    return function enclHyphenate(word, hyphenchar, leftmin, rightmin) {
        let i = 0;
        let cc = word.charCodeAt(i);
        leftmin = leftmin || defLeftmin;
        rightmin = rightmin || defRightmin;
        while (cc) {
            i += 1;
            // eslint-disable-next-line security/detect-object-injection
            wordStore[i] = cc;
            cc = word.charCodeAt(i);
        }
        wordStore[i + 1] = 95;
        wordStore[i + 2] = 0;
        if (hyphenateFunc(leftmin, rightmin) === 1) {
            word = String.fromCharCode.apply(
                null,
                hyphenatedWordStore.subarray(
                    1,
                    hyphenatedWordStore[0] + 1
                )
            );
            if (hyphenchar !== "\u00AD") {
                word = word.replace(/\u00AD/g, hyphenchar);
            }
        }
        return word;
    };
}

/**
 * Instantiate Wasm Engine, then compute the pattern trie and
 * call prepareLanguagesObj.
 * @param {string} lang The language
 * @returns {undefined}
 */
function instantiateWasmEngine(lang) {
    const baseData = calculateBaseData(H.binaries.get(lang));
    const wasmMemory = new WebAssembly.Memory({
        "initial": baseData.hs / 65536,
        "maximum": 256
    });
    const ui32wasmMemory = new Uint32Array(wasmMemory.buffer);
    ui32wasmMemory.set(
        new Uint32Array(H.binaries.get(lang)),
        // eslint-disable-next-line no-bitwise
        baseData.ho >> 2
    );
    baseData.wasmMemory = wasmMemory;
    const importObj = {
        "env": {
            "memory": baseData.wasmMemory,
            "memoryBase": 0
        },
        "x": baseData
    };
    if (H.c.sync) {
        const heInstance = new WebAssembly.Instance(
            new WebAssembly.Module(H.binaries.get("hyphenEngine")),
            importObj
        );
        heInstance.exports.convert();
        prepareLanguagesObj(
            lang,
            encloseHyphenateFunction(
                baseData,
                heInstance.exports.hyphenate
            ),
            decode(
                (new Uint8Array(wasmMemory.buffer)).
                    subarray(768, 1280)
            ),
            baseData.lm,
            baseData.rm
        );
    } else {
        WebAssembly.instantiate(H.binaries.get("hyphenEngine"), importObj).then(
            function runWasm(result) {
                result.instance.exports.convert();
                prepareLanguagesObj(
                    lang,
                    encloseHyphenateFunction(
                        baseData,
                        result.instance.exports.hyphenate
                    ),
                    decode(
                        (new Uint8Array(wasmMemory.buffer)).
                            subarray(768, 1280)
                    ),
                    baseData.lm,
                    baseData.rm
                );
            }
        );
    }
}


let engineInstantiator = null;
const hpb = [];

/**
 * Instantiate hyphenEngines for languages
 * @param {string} lang The language
 * @returns {undefined}
 */
function prepare(lang) {
    if (lang === "*") {
        engineInstantiator = instantiateWasmEngine;
        hpb.forEach(function eachHbp(hpbLang) {
            engineInstantiator(hpbLang);
        });
    } else if (engineInstantiator) {
        engineInstantiator(lang);
    } else {
        hpb.push(lang);
    }
}

const wordHyphenatorPool = new Map();

/**
 * Factory for hyphenatorFunctions for a specific language and class
 * @param {Object} lo Language-Object
 * @param {string} lang The language
 * @returns {function} The hyphenate function
 */
function createWordHyphenator(lo, lang) {
    /**
     * HyphenateFunction for compound words
     * @param {string} word The word
     * @returns {string} The hyphenated compound word
     */
    function hyphenateCompound(word) {
        const zeroWidthSpace = String.fromCharCode(8203);
        let parts = null;
        let wordHyphenator = null;
        if (H.c.compound === "auto" ||
            H.c.compound === "all") {
            wordHyphenator = createWordHyphenator(lo, lang);
            parts = word.split("-").map(function h7eParts(p) {
                if (p.length >= H.c.minWordLength) {
                    return wordHyphenator(p);
                }
                return p;
            });
            if (H.c.compound === "auto") {
                word = parts.join("-");
            } else {
                word = parts.join("-" + zeroWidthSpace);
            }
        } else {
            word = word.replace("-", "-" + zeroWidthSpace);
        }
        return word;
    }

    /**
     * HyphenateFunction for words (compound or not)
     * @param {string} word The word
     * @returns {string} The hyphenated word
     */
    function hyphenator(word) {
        let hw = lo.cache.get(word);
        if (!hw) {
            if (lo.exceptions.has(word)) {
                hw = lo.exceptions.get(word).replace(
                    /-/g,
                    H.c.hyphen
                );
            } else if (word.indexOf("-") === -1) {
                if (word.length > 61) {
                    H.events.dispatch("error", {"msg": "found word longer than 61 characters"});
                    hw = word;
                } else {
                    hw = lo.hyphenateFunction(
                        word,
                        H.c.hyphen,
                        H.c.leftmin,
                        H.c.rightmin
                    );
                }
            } else {
                hw = hyphenateCompound(word);
            }
            lo.cache.set(word, hw);
        }
        return hw;
    }
    wordHyphenatorPool.set(lang, hyphenator);
    return hyphenator;
}

const orphanController = (function createOrphanController() {
    /**
     * Function template
     * @param {string} ignore unused result of replace
     * @param {string} leadingWhiteSpace The leading whiteSpace
     * @param {string} lastWord The last word
     * @param {string} trailingWhiteSpace The trailing whiteSpace
     * @returns {string} Treated end of text
     */
    function controlOrphans(
        ignore,
        leadingWhiteSpace,
        lastWord,
        trailingWhiteSpace
    ) {
        let h = H.c.hyphen;
        if (".\\+*?[^]$(){}=!<>|:-".indexOf(H.c.hyphen) !== -1) {
            h = `\\${H.c.hyphen}`;
        }
        if (H.c.orphanControl === 3 && leadingWhiteSpace === " ") {
            leadingWhiteSpace = String.fromCharCode(160);
        }
        /* eslint-disable security/detect-non-literal-regexp */
        return leadingWhiteSpace + lastWord.replace(new RegExp(h, "g"), "") + trailingWhiteSpace;
        /* eslint-enable security/detect-non-literal-regexp */
    }
    return controlOrphans;
}());

/**
 * Encloses hyphenateTextFunction
 * @param {string} lang - The language
 * @return {function} The hyphenateText-function
 */
function createTextHyphenator(lang) {
    const lo = H.languages.get(lang);
    const wordHyphenator = (wordHyphenatorPool.has(lang))
        ? wordHyphenatorPool.get(lang)
        : createWordHyphenator(lo, lang);

    /**
     * Hyphenate text
     * @param {string} text The text
     * @param {string} lang The language of the text
     * @returns {string} Hyphenated text
     */
    return function hyphenateText(text) {
        if (H.c.normalize) {
            text = text.normalize("NFC");
        }
        let tn = text.replace(lo.genRegExp, wordHyphenator);
        if (H.c.orphanControl !== 1) {
            tn = tn.replace(
                // eslint-disable-next-line prefer-named-capture-group
                /(\u0020*)(\S+)(\s*)$/,
                orphanController
            );
        }
        return tn;
    };
}

(function setupEvents() {
    // Events known to the system
    const definedEvents = new Map();

    /**
     * Create Event Object
     * @param {string} name The Name of the event
     * @param {function|null} defFunc The default method of the event
     * @param {boolean} cancellable Is the default cancellable
     * @returns {undefined}
     */
    function define(name, defFunc, cancellable) {
        definedEvents.set(name, {
            "cancellable": cancellable,
            "default": defFunc,
            "register": []
        });
    }

    define(
        "error",
        function def(e) {
            // eslint-disable-next-line no-console
            console.error(e.msg);
        },
        true
    );

    define(
        "engineLoaded",
        function def() {
            prepare("*");
        },
        false
    );

    define(
        "hpbLoaded",
        function def(e) {
            prepare(e.msg);
        },
        false
    );

    define(
        "engineReady",
        null,
        false
    );

    /**
     * Dispatch error <name> with arguments <data>
     * @param {string} name The name of the event
     * @param {Object|undefined} data Data of the event
     * @returns {undefined}
     */
    function dispatch(name, data) {
        if (!data) {
            data = empty();
        }
        data.defaultPrevented = false;
        data.preventDefault = function preventDefault() {
            if (definedEvents.get(name).cancellable) {
                data.defaultPrevented = true;
            }
        };
        definedEvents.get(name).register.forEach(function call(currentHandler) {
            currentHandler(data);
        });
        if (!data.defaultPrevented && definedEvents.get(name).default) {
            definedEvents.get(name).default(data);
        }
    }

    /**
     * Add EventListender <handler> to event <name>
     * @param {string} name The name of the event
     * @param {function} handler Function to register
     * @returns {undefined}
     */
    function addListener(name, handler) {
        if (definedEvents.has(name)) {
            definedEvents.get(name).register.push(handler);
        } else {
            H.events.dispatch(
                "error",
                {"msg": `unknown Event "${name}" discarded`}
            );
        }
    }

    H.events = empty();
    H.events.dispatch = dispatch;
    H.events.define = define;
    H.events.addListener = addListener;
}());

H.config = function config(userConfig) {
    const defaults = Object.create(null, {
        "compound": setProp("hyphen", 2),
        "exceptions": setProp(empty(), 2),
        "hyphen": setProp(String.fromCharCode(173), 2),
        "leftmin": setProp(0, 2),
        "loader": setProp("fs", 2),
        "minWordLength": setProp(6, 2),
        "normalize": setProp(false, 2),
        "orphanControl": setProp(1, 2),
        "paths": setProp(Object.create(null, {
            "maindir": setProp(`${__dirname}/`, 2),
            "patterndir": setProp(`${__dirname}/patterns/`, 2)
        }), 2),
        "require": setProp([], 2),
        "rightmin": setProp(0, 2),
        "sync": setProp(false, 2)
    });
    const settings = Object.create(defaults);
    Object.keys(userConfig).forEach(function each(key) {
        Object.defineProperty(
            settings,
            key,
            /* eslint-disable security/detect-object-injection */
            setProp(userConfig[key], 3)
            /* eslint-enable security/detect-object-injection */
        );
    });
    H.c = settings;
    if (H.c.loader === "https") {
        // eslint-disable-next-line global-require
        loader = require("https");
    }
    if (H.c.loader === "http") {
        // eslint-disable-next-line global-require
        loader = require("http");
    }
    if (H.c.handleEvent) {
        Object.keys(H.c.handleEvent).forEach(function add(name) {
            /* eslint-disable security/detect-object-injection */
            H.events.addListener(name, H.c.handleEvent[name]);
            /* eslint-enable security/detect-object-injection */
        });
    }
    const result = new Map();
    if (H.c.require.length === 0) {
        H.events.dispatch(
            "error",
            {"msg": "No language has been required. Setup config according to documenation."}
        );
    }
    H.c.require.forEach(function each(lang) {
        loadHpb(lang);
        if (H.c.sync) {
            H.events.addListener("engineReady", function handler(e) {
                if (e.msg === lang) {
                    result.set(lang, createTextHyphenator(lang));
                }
            });
        } else {
            const prom = new Promise(function pro(resolve, reject) {
                H.events.addListener("engineReady", function handler(e) {
                    if (e.msg === lang) {
                        resolve(createTextHyphenator(lang));
                    }
                });
                H.events.addListener("error", function handler(e) {
                    e.preventDefault();
                    if (e.key === lang || e.key === "hyphenEngine") {
                        reject(e.msg);
                    }
                });
            });
            result.set(lang, prom);
        }
    });
    loadWasm();
    return (result.size === 1)
        ? result.get(H.c.require[0])
        : result;
};

module.exports = H;
