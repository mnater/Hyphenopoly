/**
 * @license Hyphenopoly.module.js 4.2.1 - hyphenation for node
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

const decode = (() => {
    const utf16ledecoder = new StringDecoder("utf-16le");
    return (ui16) => {
        return utf16ledecoder.write(ui16);
    };
})();

/**
 * Create Object without standard Object-prototype
 * @returns {Object} empty object
 */
const empty = () => {
    return Object.create(null);
};

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
const setProp = (val, props) => {
    /* eslint-disable no-bitwise, sort-keys */
    return {
        "configurable": (props & 4) > 0,
        "enumerable": (props & 2) > 0,
        "writable": (props & 1) > 0,
        "value": val
    };
    /* eslint-enable no-bitwise, sort-keys */
};

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
    "mk",
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
        loader.get(file, (res) => {
            const rawData = [];
            res.on("data", (chunk) => {
                rawData.push(chunk);
            });
            res.on("end", () => {
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
            (err, data) => {
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
    exc.split(", ").forEach((e) => {
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
 * @param {number} patternLeftmin leftmin as defined in patterns
 * @param {number} patternRightmin rightmin as defined in patterns
 * @returns {undefined}
 */
function prepareLanguagesObj(
    lang,
    hyphenateFunction,
    alphabet,
    patternLeftmin,
    patternRightmin
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
        lo.alphabet = alphabet;
        lo.reNotAlphabet = RegExp(`[^${alphabet}]`, "gi");
        (() => {
            H.c.leftminPerLang[lang] = Math.max(
                patternLeftmin,
                H.c.leftmin,
                Number(H.c.leftminPerLang[lang]) || 0
            );
            H.c.rightminPerLang[lang] = Math.max(
                patternRightmin,
                H.c.rightmin,
                Number(H.c.rightminPerLang[lang]) || 0
            );
        })();
        /* eslint-enable security/detect-object-injection */
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
    const heapBuffer = baseData.wasmMem.buffer;
    const wordStore = new Uint16Array(heapBuffer, baseData.wo, 64);
    const hydWordStore = new Uint16Array(heapBuffer, baseData.hw, 128);

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
    return ((word, hyphencc, leftmin, rightmin) => {
        let i = 0;
        let cc = word.charCodeAt(i);
        while (cc) {
            i += 1;
            // eslint-disable-next-line security/detect-object-injection
            wordStore[i] = cc;
            cc = word.charCodeAt(i);
        }
        wordStore[i + 1] = 95;
        wordStore[i + 2] = 0;
        if (hyphenateFunc(leftmin, rightmin, hyphencc) === 1) {
            word = decode(hydWordStore.subarray(1, hydWordStore[0] + 1));
        }
        return word;
    });
}

/**
 * Instantiate Wasm Engine
 * @param {string} lang The language
 * @returns {undefined}
 */
function instantiateWasmEngine(lang) {
    // eslint-disable-next-line require-jsdoc
    function handleWasm(inst) {
        const exp = inst.exports;
        const baseData = {
            /* eslint-disable multiline-ternary */
            "hw": (WebAssembly.Global) ? exp.hwo.value : exp.hwo,
            "lm": (WebAssembly.Global) ? exp.lmi.value : exp.lmi,
            "rm": (WebAssembly.Global) ? exp.rmi.value : exp.rmi,
            "wasmMem": exp.mem,
            "wo": (WebAssembly.Global) ? exp.uwo.value : exp.uwo
            /* eslint-enable multiline-ternary */
        };
        const alphalen = exp.conv();
        prepareLanguagesObj(
            lang,
            encloseHyphenateFunction(
                baseData,
                exp.hyphenate
            ),
            decode(new Uint16Array(exp.mem.buffer, 770, alphalen - 1)),
            baseData.lm,
            baseData.rm
        );
    }
    if (H.c.sync) {
        const heInstance = new WebAssembly.Instance(
            new WebAssembly.Module(H.binaries.get(lang))
        );
        handleWasm(heInstance);
    } else {
        WebAssembly.instantiate(H.binaries.get(lang)).then((res) => {
            handleWasm(res.instance);
        });
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
        const zeroWidthSpace = "\u200B";
        let parts = null;
        let wordHyphenator = null;
        if (H.c.compound === "auto" ||
            H.c.compound === "all") {
            wordHyphenator = createWordHyphenator(lo, lang);
            parts = word.split("-").map((p) => {
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
        return Array.prototype.map.call(s, (c) => {
            return (c === c.toLowerCase());
        }).some((v, i, a) => {
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
                } else if (lo.reNotAlphabet.test(word)) {
                    hw = word;
                } else {
                    hw = lo.hyphenateFunction(
                        word,
                        H.c.hyphen.charCodeAt(0),
                        /* eslint-disable security/detect-object-injection */
                        H.c.leftminPerLang[lang],
                        H.c.rightminPerLang[lang]
                        /* eslint-enable security/detect-object-injection */
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

const orphanController = (() => {
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
            // \u00A0 = no-break space (nbsp)
            leadingWhiteSpace = "\u00A0";
        }
        /* eslint-disable security/detect-non-literal-regexp */
        return leadingWhiteSpace + lastWord.replace(new RegExp(h, "g"), "") + trailingWhiteSpace;
        /* eslint-enable security/detect-non-literal-regexp */
    }
    return controlOrphans;
})();

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

    /*
     * Transpiled RegExp of
     * /[${alphabet}\p{Letter}-]{${minwordlength},}/gui
     */
    const reWord = RegExp(
        `[${lo.alphabet}[a-z\u00DF-\u00F6\u00F8-\u00FE\u0101\u0103\u0105\u0107\u0109\u010D\u010F\u0111\u0113\u0117\u0119\u011B\u011D\u011F\u0123\u0125\u012B\u012F\u0131\u0135\u0137\u013C\u013E\u0142\u0144\u0146\u0148\u014D\u0151\u0153\u0155\u0159\u015B\u015D\u015F\u0161\u0165\u016B\u016D\u016F\u0171\u0173\u017A\u017C\u017E\u017F\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u0219\u021B\u02BC\u0390\u03AC-\u03CE\u03D0\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF\u03F2\u0430-\u044F\u0451-\u045C\u045E\u045F\u0491\u04AF\u04E9\u0561-\u0585\u0587\u0905-\u090C\u090F\u0910\u0913-\u0928\u092A-\u0930\u0932\u0933\u0935-\u0939\u093D\u0960\u0961\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A85-\u0A8B\u0A8F\u0A90\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AE0\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B60\u0B61\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB5\u0BB7-\u0BB9\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D60\u0D61\u0D7A-\u0D7F\u0E01-\u0E2E\u0E30\u0E32\u0E33\u0E40-\u0E45\u10D0-\u10F0\u1200-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u1E0D\u1E37\u1E41\u1E43\u1E45\u1E47\u1E6D\u1F00-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB2-\u1FB4\u1FB6\u1FB7\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD2\u1FD3\u1FD6\u1FD7\u1FE2-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CC9\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E-]{${H.c.minWordLength},}`, "gui"
    );

    /**
     * Hyphenate text
     * @param {string} text The text
     * @param {string} lang The language of the text
     * @returns {string} Hyphenated text
     */
    return ((text) => {
        if (H.c.normalize) {
            text = text.normalize("NFC");
        }
        let tn = text.replace(reWord, wordHyphenator);
        if (H.c.orphanControl !== 1) {
            tn = tn.replace(
                // eslint-disable-next-line prefer-named-capture-group
                /(\u0020*)(\S+)(\s*)$/,
                orphanController
            );
        }
        return tn;
    });
}

(() => {
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
            cancellable,
            "default": defFunc,
            "register": []
        });
    }

    define(
        "error",
        (e) => {
            // eslint-disable-next-line no-console
            console.error(e.msg);
        },
        true
    );

    define(
        "engineLoaded",
        (e) => {
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
        data.preventDefault = (() => {
            if (definedEvents.get(name).cancellable) {
                data.defaultPrevented = true;
            }
        });
        definedEvents.get(name).register.forEach((currentHandler) => {
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
})();

H.config = ((userConfig) => {
    const defaults = Object.create(null, {
        "compound": setProp("hyphen", 2),
        "exceptions": setProp(empty(), 2),
        "hyphen": setProp("\u00AD", 2),
        "leftmin": setProp(0, 3),
        "leftminPerLang": setProp(empty(), 2),
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
        "rightmin": setProp(0, 3),
        "rightminPerLang": setProp(empty(), 2),
        "sync": setProp(false, 2)
    });
    const settings = Object.create(defaults);
    Object.keys(userConfig).forEach((key) => {
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
    if (H.c.handleEvent) {
        Object.keys(H.c.handleEvent).forEach((name) => {
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
    H.c.require.forEach((lang) => {
        if (H.c.sync) {
            H.events.addListener("engineReady", (e) => {
                if (e.msg === lang) {
                    result.set(lang, createTextHyphenator(lang));
                }
            });
        } else {
            const prom = new Promise((resolve, reject) => {
                H.events.addListener("engineReady", (e) => {
                    if (e.msg === lang) {
                        resolve(createTextHyphenator(lang));
                    }
                });
                H.events.addListener("error", (e) => {
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
});

module.exports = H;
