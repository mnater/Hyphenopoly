/**
 * @license Hyphenopoly 2.4.0 - client side hyphenation for webbrowsers
 * ©2018  Mathias Nater, Zürich (mathiasnater at gmail dot com)
 * https://github.com/mnater/Hyphenopoly
 *
 * Released under the MIT license
 * http://mnater.github.io/Hyphenopoly/LICENSE
 */

/* globals asmHyphenEngine */

(function mainWrapper(w) {
    "use strict";
    const H = Hyphenopoly;
    const SOFTHYPHEN = String.fromCharCode(173);

    /**
     * Create Object without standard Object-prototype
     * @returns {Object} empty object
     */
    function empty() {
        return Object.create(null);
    }

    /**
     * Polyfill Math.imul
     * @param {number} a LHS
     * @param {number} b RHS
     * @returns {number} empty object
     */
    /* eslint-disable no-bitwise */
    Math.imul = Math.imul || function imul(a, b) {
        const aHi = (a >>> 16) & 0xffff;
        const aLo = a & 0xffff;
        const bHi = (b >>> 16) & 0xffff;
        const bLo = b & 0xffff;

        /*
         * The shift by 0 fixes the sign on the high part.
         * The final |0 converts the unsigned value into a signed value
         */
        return ((aLo * bLo) + ((((aHi * bLo) + (aLo * bHi)) << 16) >>> 0) | 0);
    };
    /* eslint-enable no-bitwise */

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

    (function configurationFactory() {
        const generalDefaults = Object.create(null, {
            "defaultLanguage": setProp("en-us", 2),
            "dontHyphenate": setProp((function createList() {
                const r = empty();
                const list = "video,audio,script,code,pre,img,br,samp,kbd,var,abbr,acronym,sub,sup,button,option,label,textarea,input,math,svg,style";
                list.split(",").forEach(function add(value) {
                    r[value] = true;
                });
                return r;
            }()), 2),
            "dontHyphenateClass": setProp("donthyphenate", 2),
            "exceptions": setProp(empty(), 2),
            "normalize": setProp(false, 2),
            "safeCopy": setProp(true, 2),
            "timeout": setProp(1000, 2)
        });

        const settings = Object.create(generalDefaults);

        const perClassDefaults = Object.create(null, {
            "compound": setProp("hyphen", 2),
            "hyphen": setProp(SOFTHYPHEN, 2),
            "leftmin": setProp(0, 2),
            "leftminPerLang": setProp(0, 2),
            "minWordLength": setProp(6, 2),
            "orphanControl": setProp(1, 2),
            "rightmin": setProp(0, 2),
            "rightminPerLang": setProp(0, 2)
        });

        Object.keys(H.setup).forEach(function copySettings(key) {
            if (key === "classnames") {
                const classNames = Object.keys(H.setup.classnames);
                Object.defineProperty(
                    settings,
                    "classNames",
                    setProp(classNames, 2)
                );
                classNames.forEach(function copyClassnames(cn) {
                    const tmp = {};
                    Object.keys(H.setup.classnames[cn]).forEach(
                        function copyClassSettings(k) {
                            tmp[k] = setProp(H.setup.classnames[cn][k], 2);
                        }
                    );
                    Object.defineProperty(
                        settings,
                        cn,
                        setProp(Object.create(perClassDefaults, tmp), 2)
                    );
                });
            } else {
                Object.defineProperty(
                    settings,
                    key,
                    setProp(H.setup[key], 3)
                );
            }
        });
        H.c = settings;
    }());

    (function H9Y() {
        const C = H.c;
        let mainLanguage = null;
        let elements = null;

        /**
         * Factory for elements
         * @returns {Object} elements-object
         */
        function makeElementCollection() {
            const list = empty();

            /*
             * Counter counts the elements to be hyphenated.
             * Needs to be an object (Pass by reference)
             */
            const counter = [0];

            /**
             * Add element to elements
             * @param {object} el The element
             * @param {string} lang The language of the element
             * @param {string} cn The classname of the element
             * @returns {Object} An element-object
             */
            function add(el, lang, cn) {
                const elo = {
                    "class": cn,
                    "element": el
                };
                if (!list[lang]) {
                    list[lang] = [];
                }
                list[lang].push(elo);
                counter[0] += 1;
                return elo;
            }

            /**
             * Execute fn for each element
             * @param {function} fn The function to execute
             * @returns {undefined}
             */
            function each(fn) {
                Object.keys(list).forEach(function forEachElem(k) {
                    fn(k, list[k]);
                });
            }

            return {
                "add": add,
                "counter": counter,
                "each": each,
                "list": list
            };
        }

        /**
         * Register copy event on element
         * @param {Object} el The element
         * @returns {undefined}
         */
        function registerOnCopy(el) {
            el.addEventListener("copy", function oncopy(e) {
                e.preventDefault();
                const selectedText = window.getSelection().toString();
                e.clipboardData.setData("text/plain", selectedText.replace(new RegExp(SOFTHYPHEN, "g"), ""));
            }, true);
        }

        /**
         * Get language of element by searching its parents or fallback
         * @param {Object} el The element
         * @param {boolean} fallback Will falback to mainlanguage
         * @returns {string|null} The language or null
         */
        function getLang(el, fallback) {
            try {
                return (el.getAttribute("lang"))
                    ? el.getAttribute("lang").toLowerCase()
                    : el.tagName.toLowerCase() === "html"
                        ? fallback
                            ? mainLanguage
                            : null
                        : getLang(el.parentNode, fallback);
            } catch (ignore) {
                return null;
            }
        }

        /**
         * Set mainLanguage
         * @returns {undefined}
         */
        function autoSetMainLanguage() {
            const el = w.document.getElementsByTagName("html")[0];
            mainLanguage = getLang(el, false);
            if (!mainLanguage && C.defaultLanguage !== "") {
                mainLanguage = C.defaultLanguage;
            }
        }

        /**
         * Sort out subclasses
         * @param {Array} x Array of classnames
         * @param {Array} y Array of classnames to sort out of x
         * @returns {Array} Array of classes
         */
        function sortOutSubclasses(x, y) {
            return (x[0] === "")
                ? []
                : x.filter(function filter(i) {
                    return y.indexOf(i) !== -1;
                });
        }

        /**
         * Collect elements that have a classname defined in C.classnames
         * and add them to elements.
         * @returns {undefined}
         */
        function collectElements() {
            elements = makeElementCollection();

            /**
             * Recursively walk all elements in el, lending lang and className
             * add them to elements if necessary.
             * @param {Object} el The element to scan
             * @param {string} pLang The language of the oarent element
             * @param {string} cn The className of the parent element
             * @param {boolean} isChild If el is a child element
             * @returns {undefined}
             */
            function processElements(el, pLang, cn, isChild) {
                let eLang = null;
                let n = null;
                let j = 0;
                isChild = isChild || false;
                if (el.lang && typeof el.lang === "string") {
                    eLang = el.lang.toLowerCase();
                } else if (pLang && pLang !== "") {
                    eLang = pLang.toLowerCase();
                } else {
                    eLang = getLang(el, true);
                }
                if (H.clientFeat.langs[eLang] === "H9Y") {
                    elements.add(el, eLang, cn);
                    if (!isChild && C.safeCopy) {
                        registerOnCopy(el);
                    }
                } else if (!H.clientFeat.langs[eLang]) {
                    H.events.dispatch("error", {"msg": "Element with '" + eLang + "' found, but '" + eLang + ".hpb' not loaded. Check language tags!"});
                }

                n = el.childNodes[j];
                while (n) {
                    if (n.nodeType === 1 &&
                        !C.dontHyphenate[n.nodeName.toLowerCase()] &&
                        n.className.indexOf(C.dontHyphenateClass) === -1) {
                        if (sortOutSubclasses(n.className.split(" "), C.classNames).length === 0) {
                            processElements(n, eLang, cn, true);
                        }
                    }
                    j += 1;
                    n = el.childNodes[j];
                }
            }
            C.classNames.forEach(function eachClassName(cn) {
                const nl = w.document.querySelectorAll("." + cn);
                Array.prototype.forEach.call(nl, function eachNode(n) {
                    processElements(n, getLang(n, true), cn, false);
                });
            });
            H.elementsReady = true;
        }

        const wordHyphenatorPool = empty();

        /**
         * Factory for hyphenatorFunctions for a specific language and class
         * @param {Object} lo Language-Object
         * @param {string} lang The language
         * @param {string} cn The className
         * @returns {function} The hyphenate function
         */
        function createWordHyphenator(lo, lang, cn) {
            const classSettings = C[cn];
            const hyphen = classSettings.hyphen;

            lo.cache[cn] = empty();

            /**
             * HyphenateFunction for compound words
             * @param {string} word The word
             * @returns {string} The hyphenated compound word
             */
            function hyphenateCompound(word) {
                const zeroWidthSpace = String.fromCharCode(8203);
                let parts = null;
                let i = 0;
                let wordHyphenator = null;
                let hw = word;
                switch (classSettings.compound) {
                case "auto":
                    parts = word.split("-");
                    wordHyphenator = createWordHyphenator(lo, lang, cn);
                    while (i < parts.length) {
                        if (parts[i].length >= classSettings.minWordLength) {
                            parts[i] = wordHyphenator(parts[i]);
                        }
                        i += 1;
                    }
                    hw = parts.join("-");
                    break;
                case "all":
                    parts = word.split("-");
                    wordHyphenator = createWordHyphenator(lo, lang, cn);
                    while (i < parts.length) {
                        if (parts[i].length >= classSettings.minWordLength) {
                            parts[i] = wordHyphenator(parts[i]);
                        }
                        i += 1;
                    }
                    hw = parts.join("-" + zeroWidthSpace);
                    break;
                default:
                    hw = word.replace("-", "-" + zeroWidthSpace);
                }
                return hw;
            }

            /**
             * HyphenateFunction for words (compound or not)
             * @param {string} word The word
             * @returns {string} The hyphenated word
             */
            function hyphenator(word) {
                let hw = lo.cache[cn][word];
                if (!hw) {
                    if (lo.exceptions[word]) {
                        hw = lo.exceptions[word].replace(
                            /-/g,
                            classSettings.hyphen
                        );
                    } else if (word.indexOf("-") === -1) {
                        hw = lo.hyphenateFunction(
                            word,
                            hyphen,
                            classSettings.leftminPerLang[lang],
                            classSettings.rightminPerLang[lang]
                        );
                    } else {
                        hw = hyphenateCompound(word);
                    }
                    lo.cache[cn][word] = hw;
                }
                return hw;
            }
            wordHyphenatorPool[lang + "-" + cn] = hyphenator;
            return hyphenator;
        }

        const orphanControllerPool = empty();

        /**
         * Factory for function that handles orphans
         * @param {string} cn The className
         * @returns {function} The function created
         */
        function createOrphanController(cn) {
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
                const classSettings = C[cn];
                let h = classSettings.hyphen;
                if (".\\+*?[^]$(){}=!<>|:-".indexOf(classSettings.hyphen) !== -1) {
                    h = "\\" + classSettings.hyphen;
                }
                if (classSettings.orphanControl === 3 && leadingWhiteSpace === " ") {
                    leadingWhiteSpace = String.fromCharCode(160);
                }
                return leadingWhiteSpace + lastWord.replace(new RegExp(h, "g"), "") + trailingWhiteSpace;
            }
            orphanControllerPool[cn] = controlOrphans;
            return controlOrphans;
        }

        /**
         * Hyphenate text in element
         * @param {string} lang The language of the element
         * @param {Object} elo The element-object
         * @returns {undefined}
         */
        function hyphenateElement(lang, elo) {
            const el = elo.element;
            const lo = H.languages[lang];
            const cn = elo.class;
            const classSettings = C[cn];
            const minWordLength = classSettings.minWordLength;
            const normalize = C.normalize &&
                Boolean(String.prototype.normalize);
            H.events.dispatch("beforeElementHyphenation", {
                "el": el,
                "lang": lang
            });
            const poolKey = lang + "-" + cn;
            const wordHyphenator = (wordHyphenatorPool[poolKey])
                ? wordHyphenatorPool[poolKey]
                : createWordHyphenator(lo, lang, cn);
            const orphanController = (orphanControllerPool[cn])
                ? orphanControllerPool[cn]
                : createOrphanController(cn);
            const re = lo.genRegExps[cn];
            let i = 0;
            let n = el.childNodes[i];
            while (n) {
                if (
                    n.nodeType === 3 &&
                    n.data.length >= minWordLength
                ) {
                    let tn = null;
                    if (normalize) {
                        tn = n.data.normalize("NFC").replace(re, wordHyphenator);
                    } else {
                        tn = n.data.replace(re, wordHyphenator);
                    }
                    if (classSettings.orphanControl !== 1) {
                        tn = tn.replace(
                            /(\u0020*)(\S+)(\s*)$/,
                            orphanController
                        );
                    }
                    n.data = tn;
                }
                i += 1;
                n = el.childNodes[i];
            }
            elements.counter[0] -= 1;
            H.events.dispatch("afterElementHyphenation", {
                "el": el,
                "lang": lang
            });
        }

        /**
         * Hyphenate all elements with a given language
         * @param {string} lang The language
         * @param {Array} elArr Array of elements
         * @returns {undefined}
         */
        function hyphenateLangElements(lang, elArr) {
            if (elArr) {
                elArr.forEach(function eachElem(elo) {
                    hyphenateElement(lang, elo);
                });
            } else {
                H.events.dispatch("error", {"msg": "engine for language '" + lang + "' loaded, but no elements found."});
            }
            if (elements.counter[0] === 0) {
                H.events.dispatch("hyphenopolyEnd");
            }
        }

        /**
         * Convert exceptions to object
         * @param {string} exc comma separated list of exceptions
         * @returns {Object} Map of exceptions
         */
        function convertExceptions(exc) {
            const words = exc.split(", ");
            const r = empty();
            const l = words.length;
            let i = 0;
            let key = null;
            while (i < l) {
                key = words[i].replace(/-/g, "");
                if (!r[key]) {
                    r[key] = words[i];
                }
                i += 1;
            }
            return r;
        }

        /**
         * Setup lo
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
            if (!H.languages) {
                H.languages = empty();
            }
            if (!H.languages[lang]) {
                H.languages[lang] = empty();
            }
            const lo = H.languages[lang];
            if (!lo.engineReady) {
                lo.cache = empty();
                if (H.c.exceptions.global) {
                    if (H.c.exceptions[lang]) {
                        H.c.exceptions[lang] += ", " + H.c.exceptions.global;
                    } else {
                        H.c.exceptions[lang] = H.c.exceptions.global;
                    }
                }
                if (H.c.exceptions[lang]) {
                    lo.exceptions = convertExceptions(H.c.exceptions[lang]);
                    delete H.c.exceptions[lang];
                } else {
                    lo.exceptions = empty();
                }
                lo.genRegExps = empty();
                lo.leftmin = leftmin;
                lo.rightmin = rightmin;
                lo.hyphenateFunction = hyphenateFunction;
                C.classNames.forEach(function eachClassName(cn) {
                    const classSettings = C[cn];
                    if (classSettings.leftminPerLang === 0) {
                        Object.defineProperty(
                            classSettings,
                            "leftminPerLang",
                            setProp(empty(), 2)
                        );
                    }
                    if (classSettings.rightminPerLang === 0) {
                        Object.defineProperty(
                            classSettings,
                            "rightminPerLang",
                            setProp(empty(), 2)
                        );
                    }
                    if (classSettings.leftminPerLang[lang]) {
                        classSettings.leftminPerLang[lang] = Math.max(
                            lo.leftmin,
                            classSettings.leftmin,
                            classSettings.leftminPerLang[lang]
                        );
                    } else {
                        classSettings.leftminPerLang[lang] = Math.max(
                            lo.leftmin,
                            classSettings.leftmin
                        );
                    }
                    if (classSettings.rightminPerLang[lang]) {
                        classSettings.rightminPerLang[lang] = Math.max(
                            lo.rightmin,
                            classSettings.rightmin,
                            classSettings.rightminPerLang[lang]
                        );
                    } else {
                        classSettings.rightminPerLang[lang] = Math.max(
                            lo.rightmin,
                            classSettings.rightmin
                        );
                    }
                    lo.genRegExps[cn] = new RegExp("[\\w" + alphabet + String.fromCharCode(8204) + "-]{" + classSettings.minWordLength + ",}", "gi");
                });
                lo.engineReady = true;
            }
            Hyphenopoly.events.dispatch("engineReady", {"msg": lang});
        }

        /**
         * Calculate heap size for (w)asm
         * wasm page size: 65536 = 64 Ki
         * asm: http://asmjs.org/spec/latest/#linking-0
         * @param {number} targetSize The targetet Size
         * @returns {number} The necessary heap size
         */
        function calculateHeapSize(targetSize) {
            /* eslint-disable no-bitwise */
            if (H.clientFeat.wasm) {
                return Math.ceil(targetSize / 65536) * 65536;
            }
            const exp = Math.ceil(Math.log2(targetSize));
            if (exp <= 12) {
                return 1 << 12;
            }
            if (exp < 24) {
                return 1 << exp;
            }
            return Math.ceil(targetSize / (1 << 24)) * (1 << 24);
            /* eslint-enable no-bitwise */
        }

        /**
         * Polyfill for TextDecoder
         */
        const decode = (function makeDecoder() {
            let decoder = null;
            if (window.TextDecoder) {
                const utf16ledecoder = new TextDecoder("utf-16le");
                decoder = function (ui16) {
                    return utf16ledecoder.decode(ui16);
                };
            } else {
                decoder = function (ui16) {
                    let i = 0;
                    let str = "";
                    while (i < ui16.length) {
                        str += String.fromCharCode(ui16[i]);
                        i += 1;
                    }
                    return str;
                };
            }
            return decoder;
        }());

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
         * -------------------- <- valueStoreOffset = 1280
         * |    valueStore    |
         * |      1 Byte      |
         * |* valueStoreLength|
         * --------------------
         * | align to 4Bytes  |
         * -------------------- <- patternTrieOffset
         * |    patternTrie   |
         * |     4 Bytes      |
         * |*patternTrieLength|
         * -------------------- <- wordOffset
         * |    wordStore     |
         * |    Uint16[64]    | 128 bytes
         * -------------------- <- translatedWordOffset
         * | transl.WordStore |
         * |    Uint16[64]     | 128 bytes
         * -------------------- <- hyphenPointsOffset
         * |   hyphenPoints   |
         * |    Uint8[64]     | 64 bytes
         * -------------------- <- hyphenatedWordOffset
         * |  hyphenatedWord  |
         * |   Uint16[128]    | 256 Bytes
         * -------------------- <- hpbOffset           -
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
         * -------------------- <- hpbPatternsOffset   |
         * |     PATTERNS     |                        |
         * |  patternsLength  |                        |
         * -------------------- <- heapEnd             -
         * | align to 4Bytes  |
         * -------------------- <- heapSize
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
                "heapSize": Math.max(calculateHeapSize(wordOffset + 576 + hpbMetaData[2] + hpbMetaData[3]), 32 * 1024 * 64),
                "hpbOffset": wordOffset + 576,
                "hpbPatternsOffset": wordOffset + 576 + hpbMetaData[2],
                "hpbTranslateOffset": wordOffset + 576 + hpbMetaData[1],
                "hyphenatedWordOffset": wordOffset + 320,
                "hyphenPointsOffset": wordOffset + 256,
                "leftmin": hpbMetaData[4],
                "patternsLength": hpbMetaData[3],
                "patternTrieOffset": patternTrieOffset,
                "rightmin": hpbMetaData[5],
                "translatedWordOffset": wordOffset + 128,
                "valueStoreOffset": valueStoreOffset,
                "wordOffset": wordOffset
            };
        }

        /**
         * Create basic import Object
         * @param {Object} baseData baseData
         * @returns {Object} import object
         */
        function createImportObject(baseData) {
            return {
                "hpbPatternsOffset": baseData.hpbPatternsOffset,
                "hpbTranslateOffset": baseData.hpbTranslateOffset,
                "hyphenatedWordOffset": baseData.hyphenatedWordOffset,
                "hyphenPointsOffset": baseData.hyphenPointsOffset,
                "patternsLength": baseData.patternsLength,
                "patternTrieOffset": baseData.patternTrieOffset,
                "translatedWordOffset": baseData.translatedWordOffset,
                "valueStoreOffset": baseData.valueStoreOffset,
                "wordOffset": baseData.wordOffset
            };
        }

        /**
         * Setup env for hyphenateFunction
         * @param {Object} baseData baseData
         * @param {function} hyphenateFunc hyphenateFunction
         * @returns {function} hyphenateFunction with closured environment
         */
        function encloseHyphenateFunction(baseData, hyphenateFunc) {
            /* eslint-disable no-bitwise */
            const heapBuffer = H.clientFeat.wasm
                ? baseData.wasmMemory.buffer
                : baseData.heapBuffer;
            const wordOffset = baseData.wordOffset;
            const hyphenatedWordOffset = baseData.hyphenatedWordOffset;
            const wordStore = (new Uint16Array(heapBuffer)).subarray(
                wordOffset >> 1,
                (wordOffset >> 1) + 64
            );
            const defLeftmin = baseData.leftmin;
            const defRightmin = baseData.rightmin;
            const hyphenatedWordStore = (new Uint16Array(heapBuffer)).subarray(
                hyphenatedWordOffset >> 1,
                (hyphenatedWordOffset >> 1) + 64
            );
            /* eslint-enable no-bitwise */
            return function hyphenate(word, hyphenchar, leftmin, rightmin) {
                let i = 0;
                const wordLength = word.length;
                leftmin = leftmin || defLeftmin;
                rightmin = rightmin || defRightmin;
                wordStore[0] = wordLength + 2;
                wordStore[1] = 95;
                while (i < wordLength) {
                    wordStore[i + 2] = word.charCodeAt(i);
                    i += 1;
                }
                wordStore[i + 2] = 95;

                if (hyphenateFunc(leftmin, rightmin) === 1) {
                    i = 1;
                    word = "";
                    while (i < hyphenatedWordStore[0] + 1) {
                        word += String.fromCharCode(hyphenatedWordStore[i]);
                        i += 1;
                    }
                    if (hyphenchar !== "\u00AD") {
                        word = word.replace(/\u00AD/g, hyphenchar);
                    }
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
            Promise.all([H.binaries[lang], H.binaries.hyphenEngine]).then(
                function onAll(binaries) {
                    const hpbBuf = binaries[0];
                    const baseData = calculateBaseData(hpbBuf);
                    const wasmModule = binaries[1];
                    const wasmMemory = (
                        H.specMems[lang].buffer.byteLength >= baseData.heapSize
                    )
                        ? H.specMems[lang]
                        : new WebAssembly.Memory({
                            "initial": baseData.heapSize / 65536,
                            "maximum": 256
                        });
                    const ui32wasmMemory = new Uint32Array(wasmMemory.buffer);
                    ui32wasmMemory.set(
                        new Uint32Array(hpbBuf),
                        // eslint-disable-next-line no-bitwise
                        baseData.hpbOffset >> 2
                    );
                    baseData.wasmMemory = wasmMemory;
                    WebAssembly.instantiate(wasmModule, {
                        "env": {
                            "memory": baseData.wasmMemory,
                            "memoryBase": 0
                        },
                        "ext": createImportObject(baseData)
                    }).then(
                        function runWasm(result) {
                            result.exports.convert();
                            prepareLanguagesObj(
                                lang,
                                encloseHyphenateFunction(
                                    baseData,
                                    result.exports.hyphenate
                                ),
                                decode(
                                    (new Uint16Array(wasmMemory.buffer)).
                                        subarray(384, 640)
                                ),
                                baseData.leftmin,
                                baseData.rightmin
                            );
                        }
                    );
                }
            );
        }

        /**
         * Instantiate asm Engine
         * @param {string} lang The language
         * @returns {undefined}
         */
        function instantiateAsmEngine(lang) {
            const hpbBuf = H.binaries[lang];
            const baseData = calculateBaseData(hpbBuf);
            const heapBuffer = (
                H.specMems[lang].byteLength >= baseData.heapSize
            )
                ? H.specMems[lang]
                : new ArrayBuffer(baseData.heapSize);
            const ui8Heap = new Uint8Array(heapBuffer);
            const ui8Patterns = new Uint8Array(hpbBuf);
            ui8Heap.set(ui8Patterns, baseData.hpbOffset);
            baseData.heapBuffer = heapBuffer;
            const theHyphenEngine = asmHyphenEngine(
                {
                    "Int32Array": window.Int32Array,
                    "Math": Math,
                    "Uint16Array": window.Uint16Array,
                    "Uint8Array": window.Uint8Array
                },
                createImportObject(baseData),
                baseData.heapBuffer
            );
            theHyphenEngine.convert();
            prepareLanguagesObj(
                lang,
                encloseHyphenateFunction(baseData, theHyphenEngine.hyphenate),
                decode((new Uint16Array(heapBuffer)).subarray(384, 640)),
                baseData.leftmin,
                baseData.rightmin
            );
        }

        let engineInstantiator = null;
        const hpb = [];

        /**
         * Instantiate hyphenEngines for languages
         * @param {string} lang The language
         * @param {string} engineType The engineType: "wasm" or "asm"
         * @returns {undefined}
         */
        function prepare(lang, engineType) {
            if (lang === "*") {
                if (engineType === "wasm") {
                    engineInstantiator = instantiateWasmEngine;
                } else if (engineType === "asm") {
                    engineInstantiator = instantiateAsmEngine;
                }
                hpb.forEach(function eachHbp(hpbLang) {
                    engineInstantiator(hpbLang);
                });
            } else if (engineInstantiator) {
                engineInstantiator(lang);
            } else {
                hpb.push(lang);
            }
        }

        H.events.define(
            "contentLoaded",
            function onContentLoaded() {
                autoSetMainLanguage();
                collectElements();
                H.events.dispatch("elementsReady");
            },
            false
        );

        H.events.define(
            "elementsReady",
            function onElementsReady() {
                elements.each(function eachElem(lang, values) {
                    if (H.languages &&
                        H.languages[lang] &&
                        H.languages[lang].engineReady
                    ) {
                        hyphenateLangElements(lang, values);
                    }
                });
            },
            false
        );

        H.events.define(
            "engineLoaded",
            function onEngineLoaded(e) {
                prepare("*", e.msg);
            },
            false
        );

        H.events.define(
            "hpbLoaded",
            function onHpbLoaded(e) {
                prepare(e.msg, "*");
            },
            false
        );

        H.events.define(
            "engineReady",
            function onEngineReady(e) {
                if (H.elementsReady) {
                    hyphenateLangElements(e.msg, elements.list[e.msg]);
                }
            },
            false
        );

        H.events.define(
            "hyphenopolyStart",
            null,
            true
        );

        H.events.define(
            "hyphenopolyEnd",
            function def() {
                w.clearTimeout(C.timeOutHandler);
                w.document.documentElement.style.visibility = "visible";
            },
            false
        );

        H.events.define(
            "beforeElementHyphenation",
            null,
            true
        );

        H.events.define(
            "afterElementHyphenation",
            null,
            true
        );

        let eo = H.events.tempRegister.shift();
        while (eo) {
            H.events.addListener(eo.name, eo.handler, false);
            eo = H.events.tempRegister.shift();
        }
        delete H.events.tempRegister;

        H.events.dispatch("hyphenopolyStart", {"msg": "Hyphenopoly started"});

        w.clearTimeout(H.setup.timeOutHandler);

        Object.defineProperty(C, "timeOutHandler", setProp(
            w.setTimeout(function ontimeout() {
                H.events.dispatch("timeout", {"delay": C.timeout});
            }, C.timeout),
            2
        ));

        H.events.deferred.forEach(function eachDeferred(deferredeo) {
            H.events.dispatch(deferredeo.name, deferredeo.data);
        });
        delete H.events.deferred;
    }());
}(window));
