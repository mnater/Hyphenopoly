/**
 * @license Hyphenopoly.module.js 4.0.0 - hyphenation for node
 * ©2020  Mathias Nater, Güttingen (mathiasnater at gmail dot com)
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
 * Read a hpb file, dispatch "hpbLoaded" on success
 * @param {string} lang - The language
 * @returns {undefined}
 */
function loadHyphenEngine(lang) {
    if (H.c.sync) {
        const data = readFile(`${H.c.paths.patterndir}${lang}.wasm`, null, true);
        H.binaries.set(lang, new Uint8Array(data).buffer);
        H.events.dispatch("engineLoaded", {"msg": lang});
    } else {
        readFile(
            `${H.c.paths.patterndir}${lang}.wasm`,
            function cb(err, data) {
                if (err) {
                    H.events.dispatch("error", {
                        "key": lang,
                        "msg": `${H.c.paths.patterndir}${lang}.wasm not found.`
                    });
                } else {
                    H.binaries.set(lang, new Uint8Array(data).buffer);
                    H.events.dispatch("engineLoaded", {"msg": lang});
                }
            },
            false
        );
    }
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
    const heapBuffer = baseData.wasmMem.buffer;
    const wordStore = (new Uint16Array(heapBuffer)).subarray(
        baseData.wo >> 1,
        (baseData.wo >> 1) + 64
    );
    const hyphenatedWordStore = (new Uint16Array(heapBuffer)).subarray(
        baseData.hw >> 1,
        (baseData.hw >> 1) + 128
    );
    const defLeftmin = baseData.lm;
    const defRightmin = baseData.rm;
    /* eslint-enable no-bitwise */
    const defLeftmin = baseData.lm;
    const defRightmin = baseData.rm;

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
    return function enclHyphenate(word, hyphencc, leftmin, rightmin) {
        leftmin = leftmin || defLeftmin;
        rightmin = rightmin || defRightmin;
        let i = 0;
        let cc = 0;
        do {
            cc = word.charCodeAt(i);
            i += 1;
            // eslint-disable-next-line security/detect-object-injection
            wordStore[i] = cc;
        } while (cc);
        /* eslint-disable security/detect-object-injection */
        wordStore[i] = 95;
        wordStore[i + 1] = 0;
        if (hyphenateFunc(leftmin, rightmin, hyphencc) === 1) {
            word = String.fromCharCode.apply(
                null,
                hyphenatedWordStore.subarray(
                    1,
                    hyphenatedWordStore[0] + 1
                )
            );
        }
        return word;
    };
}

/**
 * Instantiate Wasm Engine
 * @param {string} lang The language
 * @returns {undefined}
 */
function instantiateWasmEngine(lang) {
    if (H.c.sync) {
        const heInstance = new WebAssembly.Instance(
            new WebAssembly.Module(H.binaries.get(lang))
        );
        const exp = heInstance.exports;
        const baseData = {
            "hw": exp.hwo,
            "lm": exp.lmi,
            "rm": exp.rmi,
            "wasmMem": exp.mem,
            "wo": exp.uwo
        };
        exp.conv();
        prepareLanguagesObj(
            lang,
            encloseHyphenateFunction(
                baseData,
                exp.hyphenate
            ),
            decode(
                (new Uint8Array(exp.mem.buffer)).
                    subarray(768, 1280)
            ),
            baseData.lm,
            baseData.rm
        );
    } else {
        WebAssembly.instantiate(H.binaries.get(lang)).then(
            function runWasm(res) {
                const exp = res.instance.exports;
                const baseData = {
                    "hw": exp.hwo,
                    "lm": exp.lmi,
                    "rm": exp.rmi,
                    "wasmMem": exp.mem,
                    "wo": exp.uwo
                };
                exp.conv();
                prepareLanguagesObj(
                    lang,
                    encloseHyphenateFunction(
                        baseData,
                        exp.hyphenate
                    ),
                    decode(
                        (new Uint8Array(exp.mem.buffer)).
                            subarray(768, 1280)
                    ),
                    baseData.lm,
                    baseData.rm
                );
            }
        );
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
     * Checks if a string is mixed case
     * @param {string} s The string
     * @returns {boolean} true if s is mixed case
     */
    function isMixedCase(s) {
        return Array.prototype.map.call(s, function mapper(c) {
            return (c === c.toLowerCase());
        }).some(function checker(v, i, a) {
            return (v !== a[0]);
        });
    }

    /* eslint-disable complexity */
    /**
     * HyphenateFunction for words (compound or not)
     * @param {string} word The word
     * @returns {string} The hyphenated word
     */
    function hyphenator(word) {
        let hw = lo.cache.get(word);
        if (!H.c.mixedCase && isMixedCase(word)) {
            hw = word;
        }
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
                        H.c.hyphen.charCodeAt(0),
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
    /* eslint-enable complexity */
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
        function def(e) {
            instantiateWasmEngine(e.msg);
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
        "mixedCase": setProp(true, 2),
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
        loadHyphenEngine(lang);
    });
    return (result.size === 1)
        ? result.get(H.c.require[0])
        : result;
};

module.exports = H;
