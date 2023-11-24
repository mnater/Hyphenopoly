/**
 * @license Hyphenopoly.module.js 5.3.0 - hyphenation for node
 * ©2023  Mathias Nater, Güttingen (mathiasnater at gmail dot com)
 * https://github.com/mnater/Hyphenopoly
 *
 * Released under the MIT license
 * http://mnater.github.io/Hyphenopoly/LICENSE
 */

/* eslint-env node */

const decode = (() => {
    const utf16ledecoder = new TextDecoder("utf-16le");
    return (ui16) => {
        return utf16ledecoder.decode(ui16);
    };
})();

/**
 * Create Object without standard Object-prototype
 * @returns {Object} empty object
 */
const empty = () => {
    return Object.create(null);
};

const H = empty();

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
    "de-x-syllable",
    "el-monoton",
    "el-polyton",
    "en-gb",
    "en-us",
    "eo",
    "es",
    "et",
    "eu",
    "fi",
    "fo",
    "fr",
    "fur",
    "ga",
    "gl",
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
    "la",
    "lt",
    "lv",
    "mk",
    "ml",
    "mn-cyrl",
    "mr",
    "nb",
    "nl",
    "nn",
    "no",
    "oc",
    "or",
    "pa",
    "pi",
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
    "sq",
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

H.languages = new Map();

/**
 * Create lang Object
 * @param {string} lang The language
 * @returns {Object} The newly created lang object
 */
function createLangObj(lang) {
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
    alphabet = alphabet.replace(/\\*-/g, "\\-");
    const lo = createLangObj(lang);
    if (!lo.engineReady) {
        lo.cache = new Map();
        const exc = [];
        if (H.c.exceptions.has(lang)) {
            exc.push(...H.c.exceptions.get(lang).split(", "));
        }
        if (H.c.exceptions.has("global")) {
            exc.push(...H.c.exceptions.get("global").split(", "));
        }
        lo.exceptions = new Map(exc.map((e) => {
            return [e.replace(/-/g, ""), e];
        }));

        lo.alphabet = alphabet;
        lo.reNotAlphabet = RegExp(`[^${alphabet}]`, "i");
        lo.lm = Math.max(
            patternLeftmin,
            H.c.leftmin,
            H.c.leftminPerLang.get(lang) || 0
        );
        lo.rm = Math.max(
            patternRightmin,
            H.c.rightmin,
            H.c.rightminPerLang.get(lang) || 0
        );
        lo.hyphenate = hyphenateFunction;
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
function encloseHyphenateFunction(buf, hyphenateFunc) {
    const wordStore = new Uint16Array(buf, 0, 64);

    /**
     * The hyphenateFunction that encloses the env above
     * Copies the word to wasm-Memory, calls wasm.hyphenateFunc and reads
     * the hyphenated word from wasm-Memory (eventually replacing hyphenchar)
     * @param {String} word - the word that has to be hyphenated
     * @param {String} hyphenchar - the hyphenate character
     * @param {Number} leftmin - min number of chars to remain on line
     * @param {Number} rightmin - min number of chars to go to new line
     * @returns {String} the hyphenated word
     */
    return ((word, hyphencc, leftmin, rightmin) => {
        wordStore.set([
            ...[...word].map((c) => {
                return c.charCodeAt(0);
            }),
            0
        ]);
        const len = hyphenateFunc(leftmin, rightmin, hyphencc);
        if (len > 0) {
            word = decode(new Uint16Array(buf, 0, len));
        }
        return word;
    });
}

/**
 * Instantiate Wasm Engine
 * @param {string} lang The language
 * @returns {undefined}
 */
function instantiateWasmEngine(lang, wasmdata) {
    /**
     * Register character substitutions in the .wasm-hyphenEngine
     * @param {number} alphalen - The length of the alphabet
     * @param {object} exp - Export-object of the hyphenEngine
     */
    function registerSubstitutions(alphalen, exp) {
        if (H.c.substitute.has(lang)) {
            const subst = H.c.substitute.get(lang);
            subst.forEach((substituer, substituted) => {
                const substitutedU = substituted.toUpperCase();
                const substitutedUcc = (substitutedU === substituted)
                    ? 0
                    : substitutedU.charCodeAt(0);
                alphalen = exp.subst(
                    substituted.charCodeAt(0),
                    substitutedUcc,
                    substituer.charCodeAt(0)
                );
            });
        }
        return alphalen;
    }

    /**
     * Instantiate the hyphenEngine
     * @param {object} res - The fetched ressource
     */
    function handleWasm(inst) {
        const exp = inst.exports;
        let alphalen = exp.lct.value;
        alphalen = registerSubstitutions(alphalen, exp);
        prepareLanguagesObj(
            lang,
            encloseHyphenateFunction(
                exp.mem.buffer,
                exp.hyphenate
            ),
            decode(new Uint16Array(exp.mem.buffer, 1664, alphalen)),
            exp.lmi.value,
            exp.rmi.value
        );
    }
    if (H.c.sync) {
        const heInstance = new WebAssembly.Instance(
            new WebAssembly.Module(wasmdata)
        );
        handleWasm(heInstance);
    } else {
        WebAssembly.instantiate(wasmdata).then((res) => {
            handleWasm(res.instance);
        });
    }
}

/**
 * Read a .wasm file and call instantiateWasmEngine on success
 * @param {string} lang - The language
 * @returns {undefined}
 */
function loadHyphenEngine(lang) {
    const file = `${lang}.wasm`;
    // eslint-disable-next-line require-jsdoc
    const cb = (err, data) => {
        if (err) {
            H.events.dispatch("error", {
                "key": lang,
                "msg": `${lang}.wasm not found.`
            });
        } else {
            instantiateWasmEngine(lang, new Uint8Array(data).buffer);
        }
    };

    if (typeof H.c.loader !== "function") {
        H.events.dispatch("error", {
            "msg": "Loader must be a function."
        });
        return;
    }

    if (H.c.sync) {
        cb(null, H.c.loaderSync(file, new URL('./patterns/', import.meta.url)));
    } else {
        H.c.loader(file, new URL('./patterns/', import.meta.url)).then(
            (res) => {
                cb(null, res);
            },
            (err) => {
                cb(err, null);
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
    if (wordHyphenatorPool.has(lang)) {
        return wordHyphenatorPool.get(lang);
    }

    /**
     * HyphenateFunction for non-compound words
     * @param {string} word The word
     * @returns {string} The hyphenated word
     */
    function hyphenateNormal(word) {
        if (word.length > 61) {
            H.events.dispatch("error", {"msg": "found word longer than 61 characters"});
        } else if (!lo.reNotAlphabet.test(word)) {
            return lo.hyphenate(
                word,
                H.c.hyphen.charCodeAt(0),
                lo.lm,
                lo.rm
            );
        }
        return word;
    }

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
            } else if (!H.c.mixedCase && isMixedCase(word)) {
                hw = word;
            } else if (word.indexOf("-") === -1) {
                hw = hyphenateNormal(word);
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
        `[${lo.alphabet}a-z\u0300-\u036F\u0483-\u0487\u00DF-\u00F6\u00F8-\u00FE\u0101\u0103\u0105\u0107\u0109\u010D\u010F\u0111\u0113\u0117\u0119\u011B\u011D\u011F\u0123\u0125\u012B\u012F\u0131\u0135\u0137\u013C\u013E\u0142\u0144\u0146\u0148\u014D\u0151\u0153\u0155\u0159\u015B\u015D\u015F\u0161\u0165\u016B\u016D\u016F\u0171\u0173\u017A\u017C\u017E\u017F\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u0219\u021B\u02BC\u0390\u03AC-\u03CE\u03D0\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF\u03F2\u0430-\u044F\u0451-\u045C\u045E\u045F\u0491\u04AF\u04E9\u0561-\u0585\u0587\u0905-\u090C\u090F\u0910\u0913-\u0928\u092A-\u0930\u0932\u0933\u0935-\u0939\u093D\u0960\u0961\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A85-\u0A8B\u0A8F\u0A90\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AE0\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B60\u0B61\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB5\u0BB7-\u0BB9\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D60\u0D61\u0D7A-\u0D7F\u0E01-\u0E2E\u0E30\u0E32\u0E33\u0E40-\u0E45\u10D0-\u10F0\u1200-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u1E0D\u1E37\u1E41\u1E43\u1E45\u1E47\u1E6D\u1F00-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB2-\u1FB4\u1FB6\u1FB7\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD2\u1FD3\u1FD6\u1FD7\u1FE2-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CC9\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E-]{${H.c.minWordLength},}`, "gui"
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
        "engineReady",
        null,
        false
    );

    /**
     * Dispatch event <name> with arguments <data>
     * @param {string} name The name of the event
     * @param {Object|undefined} data Data of the event
     * @returns {undefined}
     */
    function dispatch(name, data) {
        data.defaultPrevented = false;
        data.preventDefault = (() => {
            data.defaultPrevented = true;
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
    H.events.addListener = addListener;
})();

/**
 * Create a Map with a default Map behind the scenes. This mimics
 * kind of a prototype chain of an object, but without the object-
 * injection security risk.
 *
 * @param {Map} defaultsMap - A Map with default values
 * @returns {Proxy} - A Proxy for the Map (dot-notation or get/set)
 */
function createMapWithDefaults(defaultsMap) {
    const userMap = new Map();

    /**
     * The get-trap: get the value from userMap or else from defaults
     * @param {Sring} key - The key to retrieve the value for
     * @returns {*}
     */
    function get(key) {
        return (userMap.has(key))
            ? userMap.get(key)
            : defaultsMap.get(key);
    }

    /**
     * The set-trap: set the value to userMap and don't touch defaults
     * @param {Sring} key - The key for the value
     * @param {*} value - The value
     * @returns {*}
     */
    function set(key, value) {
        userMap.set(key, value);
    }
    return new Proxy(defaultsMap, {
        "get": (_target, prop) => {
            if (prop === "set") {
                return set;
            }
            if (prop === "get") {
                return get;
            }
            return get(prop);
        }
    });
}

/**
 * Default loader emits error
 * @returns null
 */
function defaultLoader() {
    H.events.dispatch("error", {
        "msg": "loader/loaderSync has not been configured."
    });
    return null;
}

H.config = ((userConfig) => {
    const settings = createMapWithDefaults(new Map([
        ["compound", "hyphen"],
        ["exceptions", new Map()],
        ["hyphen", "\u00AD"],
        ["leftmin", 0],
        ["leftminPerLang", new Map()],
        ["loader", defaultLoader],
        ["loaderSync", defaultLoader],
        ["minWordLength", 6],
        ["mixedCase", true],
        ["normalize", false],
        ["orphanControl", 1],
        ["require", []],
        ["rightmin", 0],
        ["rightminPerLang", new Map()],
        ["substitute", new Map()],
        ["sync", false]
    ]));
    Object.entries(userConfig).forEach(([key, value]) => {
        switch (key) {
        case "exceptions":
        case "leftminPerLang":
        case "paths":
        case "rightminPerLang":
            Object.entries(value).forEach(([k, v]) => {
                settings.get(key).set(k, v);
            });
            break;
        case "substitute":
            Object.entries(value).forEach(([lang, subst]) => {
                settings.substitute.set(
                    lang,
                    new Map(Object.entries(subst))
                );
            });
            break;
        default:
            settings.set(key, value);
        }
    });
    H.c = settings;
    if (H.c.handleEvent) {
        Object.entries(H.c.handleEvent).forEach(([name, fn]) => {
            H.events.addListener(name, fn);
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
                    if (e.key === lang) {
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

export default H;
