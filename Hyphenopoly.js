/**
 * @license Hyphenopoly 3.0.0 - client side hyphenation for webbrowsers
 * ©2019  Mathias Nater, Zürich (mathiasnater at gmail dot com)
 * https://github.com/mnater/Hyphenopoly
 *
 * Released under the MIT license
 * http://mnater.github.io/Hyphenopoly/LICENSE
 */

/* globals asmHyphenEngine, Hyphenopoly */

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
                const list = "abbr,acronym,audio,br,button,code,img,input,kbd,label,math,option,pre,samp,script,style,sub,sup,svg,textarea,var,video";
                list.split(",").forEach(function add(value) {
                /* eslint-disable security/detect-object-injection */
                    r[value] = true;
                /* eslint-enable security/detect-object-injection */
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
            if (key === "selectors") {
                const selectors = Object.keys(H.setup.selectors);
                Object.defineProperty(
                    settings,
                    "selectors",
                    setProp(selectors, 2)
                );
                selectors.forEach(function copySelectors(sel) {
                    const tmp = empty();
                    /* eslint-disable security/detect-object-injection */
                    Object.keys(H.setup.selectors[sel]).forEach(
                        function copySelectorSettings(k) {
                            tmp[k] = setProp(H.setup.selectors[sel][k], 2);
                        }
                    );
                    /* eslint-enable security/detect-object-injection */
                    Object.defineProperty(
                        settings,
                        sel,
                        setProp(Object.create(perClassDefaults, tmp), 2)
                    );
                });
            } else if (key === "dontHyphenate") {
                const tmp = empty();
                Object.keys(H.setup.dontHyphenate).forEach(
                    function copyTagNames(k) {
                        /* eslint-disable security/detect-object-injection */
                        tmp[k] = setProp(H.setup.dontHyphenate[k], 2);
                        /* eslint-enable security/detect-object-injection */
                    }
                );
                Object.defineProperty(
                    settings,
                    key,
                    setProp(
                        Object.create(generalDefaults.dontHyphenate, tmp), 3
                    )
                );
            } else {
                /* eslint-disable security/detect-object-injection */
                Object.defineProperty(
                    settings,
                    key,
                    setProp(H.setup[key], 3)
                );
                /* eslint-enable security/detect-object-injection */
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
            const list = new Map();

            /*
             * Counter counts the elements to be hyphenated.
             * Needs to be an object (Pass by reference)
             */
            const counter = [0];

            /**
             * Add element to elements
             * @param {object} el The element
             * @param {string} lang The language of the element
             * @param {string} sel The selector of the element
             * @returns {Object} An element-object
             */
            function add(el, lang, sel) {
                const elo = {
                    "element": el,
                    "selector": sel
                };
                if (!list.has(lang)) {
                    list.set(lang, []);
                }
                list.get(lang).push(elo);
                counter[0] += 1;
                return elo;
            }

            /**
             * Removes elements from the list and updates the counter
             * @param {string} lang - The lang of the elements to remove
             */
            function rem(lang) {
                let langCount = 0;
                if (list.has(lang)) {
                    langCount = list.get(lang).length;
                    list.delete(lang);
                    counter[0] -= langCount;
                    if (counter[0] === 0) {
                        H.events.dispatch("hyphenopolyEnd");
                    }
                }
            }

            /**
             * Execute fn for each element
             * @param {function} fn The function to execute
             * @returns {undefined}
             */
            function each(fn) {
                list.forEach(function eachElement(val, key) {
                    fn(key, val);
                });
            }

            return {
                "add": add,
                "counter": counter,
                "each": each,
                "list": list,
                "rem": rem
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
                /* eslint-disable security/detect-non-literal-regexp */
                e.clipboardData.setData("text/plain", selectedText.replace(new RegExp(SOFTHYPHEN, "g"), ""));
                /* eslint-enable security/detect-non-literal-regexp */
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
         * Check if node is matched by a given selector
         * @param {Node} n The Node to check
         * @param {String} sel Selector(s)
         * @returns {Boolean} true if matched, false if not matched
         */
        function nodeMatchedBy(n, sel) {
            if (!n.matches) {
                n.matches = n.msMatchesSelector || n.webkitMatchesSelector;
            }
            return n.matches(sel);
        }

        /**
         * Collect elements that have a selector defined in C.selectors
         * and add them to elements.
         * @returns {undefined}
         */
        function collectElements() {
            elements = makeElementCollection();

            const dontHyphenateSelector = (function createSel() {
                let s = "." + H.c.dontHyphenateClass;
                let k = null;
                for (k in C.dontHyphenate) {
                    /* eslint-disable security/detect-object-injection */
                    if (C.dontHyphenate[k]) {
                        s += ", " + k;
                    }
                    /* eslint-enable security/detect-object-injection */
                }
                return s;
            }());
            const matchingSelectors = C.selectors.join(", ") + ", " + dontHyphenateSelector;

            /**
             * Get Language of Element or of one of its ancestors.
             * @param {Object} el The element to scan
             * @param {string} pLang The language of the parent element
             * @returns {string} the language
             */
            function getElementLanguage(el, pLang) {
                if (el.lang && typeof el.lang === "string") {
                    return el.lang.toLowerCase();
                } else if (pLang && pLang !== "") {
                    return pLang.toLowerCase();
                }
                return getLang(el, true);
            }

            /**
             * Recursively walk all elements in el, lending lang and selName
             * add them to elements if necessary.
             * @param {Object} el The element to scan
             * @param {string} pLang The language of the oarent element
             * @param {string} sel The selector of the parent element
             * @param {boolean} isChild If el is a child element
             * @returns {undefined}
             */
            function processElements(el, pLang, sel, isChild) {
                isChild = isChild || false;
                const eLang = getElementLanguage(el, pLang);
                /* eslint-disable security/detect-object-injection */
                if (H.clientFeat.langs[eLang] === "H9Y") {
                    elements.add(el, eLang, sel);
                    if (!isChild && C.safeCopy) {
                        registerOnCopy(el);
                    }
                } else if (!H.clientFeat.langs[eLang]) {
                    H.events.dispatch("error", {
                        "lvl": "warn",
                        "msg": "Element with '" + eLang + "' found, but '" + eLang + ".hpb' not loaded. Check language tags!"
                    });
                }
                /* eslint-enable security/detect-object-injection */
                const cn = el.childNodes;
                Array.prototype.forEach.call(cn, function eachChildNode(n) {
                    if (n.nodeType === 1 &&
                        !nodeMatchedBy(n, matchingSelectors)) {
                        processElements(n, eLang, sel, true);
                    }
                });
            }
            C.selectors.forEach(function eachSelector(sel) {
                const nl = w.document.querySelectorAll(sel);
                Array.prototype.forEach.call(nl, function eachNode(n) {
                    processElements(n, getLang(n, true), sel, false);
                });
            });
            H.elementsReady = true;
        }

        const wordHyphenatorPool = new Map();

        /**
         * Factory for hyphenatorFunctions for a specific language and class
         * @param {Object} lo Language-Object
         * @param {string} lang The language
         * @param {string} sel The selector
         * @returns {function} The hyphenate function
         */
        function createWordHyphenator(lo, lang, sel) {
            /* eslint-disable-next-line security/detect-object-injection */
            const classSettings = C[sel];
            const hyphen = classSettings.hyphen;
            lo.cache.set(sel, new Map());

            /**
             * HyphenateFunction for compound words
             * @param {string} word The word
             * @returns {string} The hyphenated compound word
             */
            function hyphenateCompound(word) {
                const zeroWidthSpace = String.fromCharCode(8203);
                let parts = null;
                let wordHyphenator = null;
                let hw = word;
                if (classSettings.compound === "auto" ||
                    classSettings.compound === "all") {
                    wordHyphenator = createWordHyphenator(lo, lang, sel);
                    parts = word.split("-").map(function h7eParts(p) {
                        if (p.length >= classSettings.minWordLength) {
                            return wordHyphenator(p);
                        }
                        return p;
                    });
                    if (classSettings.compound === "auto") {
                        hw = parts.join("-");
                    } else {
                        hw = parts.join("-" + zeroWidthSpace);
                    }
                } else {
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
                let hw = lo.cache.get(sel).get(word);
                if (!hw) {
                    if (lo.exceptions.has(word)) {
                        hw = lo.exceptions.get(word).replace(
                            /-/g,
                            classSettings.hyphen
                        );
                    } else if (word.indexOf("-") === -1) {
                        if (word.length > 61) {
                            H.events.dispatch("error", {
                                "lvl": "warn",
                                "msg": "found word longer than 61 characters"
                            });
                            hw = word;
                        } else {
                        /* eslint-disable security/detect-object-injection */
                            hw = lo.hyphenateFunction(
                                word,
                                hyphen,
                                classSettings.leftminPerLang[lang],
                                classSettings.rightminPerLang[lang]
                            );
                        /* eslint-enable security/detect-object-injection */
                        }
                    } else {
                        hw = hyphenateCompound(word);
                    }
                    lo.cache.get(sel).set(word, hw);
                }
                return hw;
            }
            wordHyphenatorPool.set(lang + "-" + sel, hyphenator);
            return hyphenator;
        }

        const orphanControllerPool = new Map();

        /**
         * Factory for function that handles orphans
         * @param {string} sel The selector
         * @returns {function} The function created
         */
        function createOrphanController(sel) {
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
                /* eslint-disable security/detect-object-injection */
                const classSettings = C[sel];
                /* eslint-enable security/detect-object-injection */
                let h = classSettings.hyphen;
                if (".\\+*?[^]$(){}=!<>|:-".indexOf(classSettings.hyphen) !== -1) {
                    h = "\\" + classSettings.hyphen;
                }
                if (classSettings.orphanControl === 3 && leadingWhiteSpace === " ") {
                    leadingWhiteSpace = String.fromCharCode(160);
                }
                /* eslint-disable security/detect-non-literal-regexp */
                return leadingWhiteSpace + lastWord.replace(new RegExp(h, "g"), "") + trailingWhiteSpace;
                /* eslint-enable security/detect-non-literal-regexp */
            }
            orphanControllerPool.set(sel, controlOrphans);
            return controlOrphans;
        }

        /**
         * Hyphenate an entitiy (text string or Element-Object)
         * @param {string} lang - the language of the string
         * @param {string} sel - the selectorName of settings
         * @param {string} entity - the entity to be hyphenated
         * @returns {string | null} hyphenated str according to setting of sel
         */
        function hyphenate(lang, sel, entity) {
            const lo = H.languages.get(lang);
            /* eslint-disable security/detect-object-injection */
            const classSettings = C[sel];
            /* eslint-enable security/detect-object-injection */
            const minWordLength = classSettings.minWordLength;
            const normalize = C.normalize &&
                Boolean(String.prototype.normalize);
            const poolKey = lang + "-" + sel;
            const wordHyphenator = (wordHyphenatorPool.has(poolKey))
                ? wordHyphenatorPool.get(poolKey)
                : createWordHyphenator(lo, lang, sel);
            const orphanController = (orphanControllerPool.has(sel))
                ? orphanControllerPool.get(sel)
                : createOrphanController(sel);
            const re = lo.genRegExps.get(sel);

            /**
             * Hyphenate text according to setting in sel
             * @param {string} text - the strint to be hyphenated
             * @returns {string} hyphenated string according to setting of sel
             */
            function hyphenateText(text) {
                let tn = null;
                if (normalize) {
                    tn = text.normalize("NFC").replace(re, wordHyphenator);
                } else {
                    tn = text.replace(re, wordHyphenator);
                }
                if (classSettings.orphanControl !== 1) {
                    tn = tn.replace(
                        // eslint-disable-next-line prefer-named-capture-group
                        /(\u0020*)(\S+)(\s*)$/,
                        orphanController
                    );
                }
                return tn;
            }

            /**
             * Hyphenate element according to setting in sel
             * @param {object} el - the HTMLElement to be hyphenated
             * @returns {undefined}
             */
            function hyphenateElement(el) {
                H.events.dispatch("beforeElementHyphenation", {
                    "el": el,
                    "lang": lang
                });
                const cn = el.childNodes;
                Array.prototype.forEach.call(cn, function eachChildNode(n) {
                    if (
                        n.nodeType === 3 &&
                        n.data.length >= minWordLength
                    ) {
                        n.data = hyphenateText(n.data);
                    }
                });
                elements.counter[0] -= 1;
                H.events.dispatch("afterElementHyphenation", {
                    "el": el,
                    "lang": lang
                });
            }
            let r = null;
            if (typeof entity === "string") {
                r = hyphenateText(entity);
            } else if (entity instanceof HTMLElement) {
                hyphenateElement(entity);
            }
            return r;
        }

        H.createHyphenator = function createHyphenator(lang) {
            return function hyphenator(entity, sel) {
                sel = sel || ".hyphenate";
                return hyphenate(lang, sel, entity);
            };
        };

        H.unhyphenate = function unhyphenate() {
            elements.each(function eachLang(lang, els) {
                els.forEach(function eachElem(elo) {
                    const n = elo.element.firstChild;
                    const h = C[elo.selector].hyphen;
                    /* eslint-disable security/detect-non-literal-regexp */
                    n.data = n.data.replace(new RegExp(h, "g"), "");
                    /* eslint-enable security/detect-non-literal-regexp */
                });
            });
        };

        /**
         * Hyphenate all elements with a given language
         * @param {string} lang The language
         * @param {Array} elArr Array of elements
         * @returns {undefined}
         */
        function hyphenateLangElements(lang, elArr) {
            if (elArr) {
                elArr.forEach(function eachElem(elo) {
                    hyphenate(lang, elo.selector, elo.element);
                });
            } else {
                H.events.dispatch("error", {
                    "lvl": "warn",
                    "msg": "engine for language '" + lang + "' loaded, but no elements found."
                });
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
         * @returns {Object} The newly
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
            const lo = createLangObj(lang);
            if (!lo.engineReady) {
                lo.cache = new Map();
                /* eslint-disable security/detect-object-injection */
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
                    lo.exceptions = new Map();
                }
                /* eslint-enable security/detect-object-injection */
                lo.genRegExps = new Map();
                lo.leftmin = leftmin;
                lo.rightmin = rightmin;
                lo.hyphenateFunction = hyphenateFunction;
                C.selectors.forEach(function eachSelector(sel) {
                    /* eslint-disable security/detect-object-injection */
                    const classSettings = C[sel];
                    /* eslint-enable security/detect-object-injection */
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
                    /* eslint-disable security/detect-object-injection */
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
                    /* eslint-enable security/detect-object-injection */

                    /*
                     * Find words with characters from `alphabet` and
                     * `Zero Width Non-Joiner` and `-` with a min length.
                     *
                     * This regexp is not perfect. It also finds parts of words
                     * that follow a character that is not in the `alphabet`.
                     * Word delimiters are not taken in account.
                     */
                    /* eslint-disable security/detect-non-literal-regexp */
                    lo.genRegExps.set(sel, new RegExp("[\\w" + alphabet + String.fromCharCode(8204) + "-]{" + classSettings.minWordLength + ",}", "gi"));
                    /* eslint-enable security/detect-non-literal-regexp */
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
                    return String.fromCharCode.apply(null, ui16);
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
            if (hpbMetaData[0] !== 40005736) {
                /*
                 * Pattern files must begin with "hpb2"
                 * Get current utf8 values with
                 * `new Uint8Array(Uint32Array.of(hpbMetaData[0]).buffer)`
                 */
                H.events.dispatch("error", {
                    "lvl": "error",
                    "msg": "Pattern file format error: " + new Uint8Array(Uint32Array.of(hpbMetaData[0]).buffer)
                });
                throw new Error("Pattern file format error!");
            }
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
            const hydWrdStore = (new Uint16Array(heapBuffer)).subarray(
                hyphenatedWordOffset >> 1,
                (hyphenatedWordOffset >> 1) + 128
            );
            /* eslint-enable no-bitwise */
            return function enclHyphenate(word, hyphenchar, leftmin, rightmin) {
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
                    word = decode(hydWrdStore.subarray(1, hydWrdStore[0] + 1));
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
            Promise.all([H.binaries.get(lang), H.binaries.get("hyphenEngine")]).then(
                function onAll(binaries) {
                    const hpbBuf = binaries[0];
                    const baseData = calculateBaseData(hpbBuf);
                    const wasmModule = binaries[1];
                    const specMem = H.specMems.get(lang);
                    const wasmMemory = (
                        specMem.buffer.byteLength >= baseData.heapSize
                    )
                        ? specMem
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
                        "ext": baseData
                    }).then(
                        function runWasm(result) {
                            const alphalen = result.exports.convert();
                            prepareLanguagesObj(
                                lang,
                                encloseHyphenateFunction(
                                    baseData,
                                    result.exports.hyphenate
                                ),
                                decode(
                                    (new Uint16Array(wasmMemory.buffer)).
                                        subarray(385, 384 + alphalen)
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
            const hpbBuf = H.binaries.get(lang);
            const baseData = calculateBaseData(hpbBuf);
            const specMem = H.specMems.get(lang);
            const heapBuffer = (specMem.byteLength >= baseData.heapSize)
                ? specMem
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
                baseData,
                baseData.heapBuffer
            );
            const alphalen = theHyphenEngine.convert();
            prepareLanguagesObj(
                lang,
                encloseHyphenateFunction(baseData, theHyphenEngine.hyphenate),
                decode(
                    (new Uint16Array(heapBuffer)).
                        subarray(385, 384 + alphalen)
                ),
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
                        H.languages.has(lang) &&
                        H.languages.get(lang).engineReady
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
            "loadError",
            function onLoadError(e) {
                if (e.msg !== "wasm") {
                    elements.rem(e.name);
                }
            },
            false
        );

        H.events.define(
            "engineReady",
            function onEngineReady(e) {
                if (H.elementsReady) {
                    hyphenateLangElements(e.msg, elements.list.get(e.msg));
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
                if (H.c.hide !== "none") {
                    H.toggle("on");
                }
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

        H.events.tempRegister.forEach(function eachEo(eo) {
            H.events.addListener(eo.name, eo.handler, false);
        });
        delete H.events.tempRegister;

        H.events.dispatch("hyphenopolyStart", {"msg": "Hyphenopoly started"});

        w.clearTimeout(H.c.timeOutHandler);

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
