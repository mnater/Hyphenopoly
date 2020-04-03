/**
 * @license Hyphenopoly 4.2.1 - client side hyphenation for webbrowsers
 * ©2020  Mathias Nater, Güttingen (mathiasnater at gmail dot com)
 * https://github.com/mnater/Hyphenopoly
 *
 * Released under the MIT license
 * http://mnater.github.io/Hyphenopoly/LICENSE
 */

/* globals Hyphenopoly:readonly */
((w) => {
    "use strict";
    const SOFTHYPHEN = "\u00AD";

    /**
     * Create Object without standard Object-prototype
     * @returns {Object} empty object
     */
    function empty() {
        return Object.create(null);
    }

    /**
     * Shorthand for Object.keys(obj).forEach(() => {})
     * @param {Object} obj the object to iterate
     * @param {function} fn the function to execute
     * @returns {undefined}
     */
    function eachKey(obj, fn) {
        Object.keys(obj).forEach(fn);
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

    /**
     * Register copy event on element
     * @param {Object} el The element
     * @returns {undefined}
     */
    function registerOnCopy(el) {
        el.addEventListener(
            "copy",
            (e) => {
                e.preventDefault();
                const sel = w.getSelection();
                const docFrag = sel.getRangeAt(0).cloneContents();
                const div = document.createElement("div");
                div.appendChild(docFrag);
                const selectedHTML = div.innerHTML;
                const selectedText = sel.toString();
                const re = RegExp(SOFTHYPHEN, "g");
                e.clipboardData.setData("text/plain", selectedText.replace(re, ""));
                e.clipboardData.setData("text/html", selectedHTML.replace(re, ""));
            },
            true
        );
    }

    /**
     * Setup configurations in H.c.
     * This is a IIFE to keep complexity low.
     */
    ((H) => {
        const generalDefaults = Object.create(null, {
            "defaultLanguage": setProp("en-us", 2),
            "dontHyphenate": setProp((() => {
                const r = empty();
                const list = "abbr,acronym,audio,br,button,code,img,input,kbd,label,math,option,pre,samp,script,style,sub,sup,svg,textarea,var,video";
                list.split(",").forEach((value) => {
                /* eslint-disable security/detect-object-injection */
                    r[value] = true;
                /* eslint-enable security/detect-object-injection */
                });
                return r;
            })(), 2),
            "dontHyphenateClass": setProp("donthyphenate", 2),
            "exceptions": setProp(empty(), 2),
            "keepAlive": setProp(true, 2),
            "normalize": setProp(false, 2),
            "safeCopy": setProp(true, 2),
            "timeout": setProp(1000, 2)
        });

        const settings = Object.create(generalDefaults);

        const perSelectorDefaults = Object.create(null, {
            "compound": setProp("hyphen", 2),
            "hyphen": setProp(SOFTHYPHEN, 2),
            "leftmin": setProp(0, 2),
            "leftminPerLang": setProp(0, 2),
            "minWordLength": setProp(6, 2),
            "mixedCase": setProp(true, 2),
            "orphanControl": setProp(1, 2),
            "rightmin": setProp(0, 2),
            "rightminPerLang": setProp(0, 2)
        });

        Object.keys(H.setup).forEach((key) => {
            if (key === "selectors") {
                const selectors = Object.keys(H.setup.selectors);
                Object.defineProperty(
                    settings,
                    "selectors",
                    setProp(selectors, 2)
                );
                selectors.forEach((sel) => {
                    const tmp = empty();
                    /* eslint-disable security/detect-object-injection */
                    Object.keys(H.setup.selectors[sel]).forEach((k) => {
                        tmp[k] = setProp(H.setup.selectors[sel][k], 2);
                    });
                    /* eslint-enable security/detect-object-injection */
                    Object.defineProperty(
                        settings,
                        sel,
                        setProp(Object.create(perSelectorDefaults, tmp), 2)
                    );
                });
            } else if (key === "dontHyphenate") {
                const tmp = empty();
                Object.keys(H.setup.dontHyphenate).forEach((k) => {
                    /* eslint-disable security/detect-object-injection */
                    tmp[k] = setProp(H.setup.dontHyphenate[k], 2);
                    /* eslint-enable security/detect-object-injection */
                });
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
    })(Hyphenopoly);

    /**
     * Register Events.
     * This is a IIFE to keep complexity low.
     */
    ((H) => {
        H.events = new Map();

        /* eslint-disable array-element-newline */
        const knownEvents = new Set([
            "afterElementHyphenation",
            "beforeElementHyphenation",
            "engineReady",
            "error",
            "hyphenopolyEnd",
            "hyphenopolyStart"
        ]);
        /* eslint-enable array-element-newline */
        H.events.set("error", H.defProm());
        H.events.get("error").then((e) => {
            e.runDefault = true;
            e.preventDefault = () => {
                e.runDefault = false;
            };
        });
        if (H.handleEvent) {
            eachKey(H.handleEvent, (name) => {
                if (knownEvents.has(name)) {
                    if (!H.events.has(name)) {
                        H.events.set(name, H.defProm());
                    }
                    H.events.get(name).then((v) => {
                    // eslint-disable-next-line security/detect-object-injection
                        H.handleEvent[name](v);
                    });
                } else if (name !== "tearDown" && name !== "polyfill") {
                    H.events.get("error").resolve({
                        "msg": `unknown Event "${name}" discarded`
                    });
                }
            });
        }
        H.events.get("error").then((e) => {
            if (e.runDefault) {
                w.console.warn(e.msg);
            }
        });
    })(Hyphenopoly);

    ((H) => {
        const C = H.c;
        let mainLanguage = null;
        if (H.events.has("hyphenopolyStart")) {
            H.events.get("hyphenopolyStart").resolve("hyphenopolyStart");
        }

        /**
         * Reinitialize event promise with a pending promise.
         * @param {string} name - Name of the event
         */
        function reinitEventPromise(name) {
            H.events.delete(name);
            H.events.set(name, H.defProm());
            H.events.get(name).then((v) => {
                // eslint-disable-next-line security/detect-object-injection
                H.handleEvent[name](v);
            });
        }

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
                        if (H.events.has("hyphenopolyEnd")) {
                            H.events.get("hyphenopolyEnd").resolve("hyphenopolyEnd");
                        }
                        if (!C.keepAlive) {
                            window.Hyphenopoly = null;
                        }
                    }
                }
            }

            /**
             * Execute fn for each element
             * @param {function} fn The function to execute
             * @returns {undefined}
             */
            function each(fn) {
                list.forEach((val, key) => {
                    fn(key, val);
                });
            }

            return {
                add,
                counter,
                each,
                list,
                rem
            };
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
        function collectElements(parent = null, selector = null) {
            const elements = makeElementCollection();

            const dontHyphenateSelector = (() => {
                let s = "." + C.dontHyphenateClass;
                let k = null;
                for (k in C.dontHyphenate) {
                    /* eslint-disable security/detect-object-injection */
                    if (C.dontHyphenate[k]) {
                        s += "," + k;
                    }
                    /* eslint-enable security/detect-object-injection */
                }
                return s;
            })();
            const matchingSelectors = C.selectors.join(",") + "," + dontHyphenateSelector;

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
            function processElements(el, pLang, sel, isChild = false) {
                const eLang = getElementLanguage(el, pLang);
                /* eslint-disable security/detect-object-injection */
                if (H.cf.langs[eLang] === "H9Y") {
                    elements.add(el, eLang, sel);
                    if (!isChild && C.safeCopy) {
                        registerOnCopy(el);
                    }
                } else if (!H.cf.langs[eLang]) {
                    H.events.get("error").resolve({
                        "msg": `Element with '${eLang}' found, but '${eLang}.hpb' not loaded. Check language tags!`
                    });
                }
                /* eslint-enable security/detect-object-injection */
                el.childNodes.forEach((n) => {
                    if (n.nodeType === 1 &&
                        !nodeMatchedBy(n, matchingSelectors)) {
                        processElements(n, eLang, sel, true);
                    }
                });
            }
            if (parent === null) {
                C.selectors.forEach((sel) => {
                    w.document.querySelectorAll(sel).forEach((n) => {
                        processElements(n, getLang(n, true), sel, false);
                    });
                });
            } else {
                processElements(parent, getLang(parent, true), selector, true);
            }
            return elements;
        }

        const wordHyphenatorPool = new Map();

        /**
         * Factory for hyphenatorFunctions for a specific language and selector
         * @param {Object} lo Language-Object
         * @param {string} lang The language
         * @param {string} sel The selector
         * @returns {function} The hyphenate function
         */
        function createWordHyphenator(lo, lang, sel) {
            /* eslint-disable-next-line security/detect-object-injection */
            const selSettings = C[sel];
            const hyphen = selSettings.hyphen;
            lo.cache.set(sel, new Map());

            /**
             * HyphenateFunction for compound words
             * @param {string} word The word
             * @returns {string} The hyphenated compound word
             */
            function hyphenateCompound(word) {
                const zeroWidthSpace = "\u200B";
                let parts = null;
                let wordHyphenator = null;
                if (selSettings.compound === "auto" ||
                    selSettings.compound === "all") {
                    wordHyphenator = createWordHyphenator(lo, lang, sel);
                    parts = word.split("-").map((p) => {
                        if (p.length >= selSettings.minWordLength) {
                            return wordHyphenator(p);
                        }
                        return p;
                    });
                    if (selSettings.compound === "auto") {
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
                let hw = lo.cache.get(sel).get(word);
                if (!hw) {
                    if (lo.exc.has(word)) {
                        hw = lo.exc.get(word).replace(
                            /-/g,
                            selSettings.hyphen
                        );
                    } else if (!selSettings.mixedCase && isMixedCase(word)) {
                        hw = word;
                    } else if (word.indexOf("-") === -1) {
                        if (word.length > 61) {
                            H.events.get("error").resolve({
                                "msg": "found word longer than 61 characters"
                            });
                            hw = word;
                        } else {
                        /* eslint-disable security/detect-object-injection */
                            hw = lo.hyphenate(
                                word,
                                hyphen.charCodeAt(0),
                                selSettings.leftminPerLang[lang],
                                selSettings.rightminPerLang[lang]
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
            /* eslint-enable complexity */
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
                const selSettings = C[sel];
                /* eslint-enable security/detect-object-injection */
                if (selSettings.orphanControl === 3 && leadingWhiteSpace === " ") {
                    // \u00A0 = no-break space (nbsp)
                    leadingWhiteSpace = "\u00A0";
                }
                return leadingWhiteSpace + lastWord.replace(RegExp(selSettings.hyphen, "g"), "") + trailingWhiteSpace;
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
            const selSettings = C[sel];
            /* eslint-enable security/detect-object-injection */
            const minWordLength = selSettings.minWordLength;
            const poolKey = lang + "-" + sel;
            const wordHyphenator = (wordHyphenatorPool.has(poolKey))
                ? wordHyphenatorPool.get(poolKey)
                : createWordHyphenator(lo, lang, sel);
            const orphanController = (orphanControllerPool.has(sel))
                ? orphanControllerPool.get(sel)
                : createOrphanController(sel);
            const re = lo.re.get(sel);

            /**
             * Hyphenate text according to setting in sel
             * @param {string} text - the strint to be hyphenated
             * @returns {string} hyphenated string according to setting of sel
             */
            function hyphenateText(text) {
                let tn = null;
                if (C.normalize) {
                    tn = text.normalize("NFC").replace(re, wordHyphenator);
                } else {
                    tn = text.replace(re, wordHyphenator);
                }
                if (selSettings.orphanControl !== 1) {
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
                if (H.events.has("beforeElementHyphenation")) {
                    H.events.get("beforeElementHyphenation").resolve({
                        el,
                        lang
                    });
                    reinitEventPromise("beforeElementHyphenation");
                }
                el.childNodes.forEach((n) => {
                    if (
                        n.nodeType === 3 &&
                        (/\S/).test(n.data) &&
                        n.data.length >= minWordLength
                    ) {
                        n.data = hyphenateText(n.data);
                    }
                });
                H.res.get("els").then((elements) => {
                    elements.counter[0] -= 1;
                });
                if (H.events.has("afterElementHyphenation")) {
                    H.events.get("afterElementHyphenation").resolve({
                        el,
                        lang
                    });
                    reinitEventPromise("afterElementHyphenation");
                }
            }
            let r = null;
            if (typeof entity === "string") {
                r = hyphenateText(entity);
            } else if (entity instanceof HTMLElement) {
                hyphenateElement(entity);
            }
            return r;
        }

        H.createHyphenator = ((lang) => {
            return ((entity, sel = ".hyphenate") => {
                if (entity instanceof HTMLElement) {
                    const elements = collectElements(entity, sel);
                    elements.each((l, els) => {
                        els.forEach((elo) => {
                            hyphenate(l, elo.selector, elo.element);
                        });
                    });
                    return null;
                }
                return hyphenate(lang, sel, entity);
            });
        });

        H.unhyphenate = () => {
            return H.res.get("els").then((elements) => {
                elements.each((lang, els) => {
                    els.forEach((elo) => {
                        const n = elo.element.firstChild;
                        n.data = n.data.replace(RegExp(C[elo.selector].hyphen, "g"), "");
                    });
                });
                return elements;
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
                elArr.forEach((elo) => {
                    hyphenate(lang, elo.selector, elo.element);
                });
            } else {
                H.events.get("error").resolve({
                    "msg": `engine for language '${lang}' loaded, but no elements found.`
                });
            }
            H.res.get("els").then((elements) => {
                if (elements.counter[0] === 0) {
                    w.clearTimeout(H.timeOutHandler);
                    if (C.hide !== 0) {
                        H.hide(0, null);
                    }
                    if (H.events.has("hyphenopolyEnd")) {
                        H.events.get("hyphenopolyEnd").resolve("hyphenopolyEnd");
                    }
                    if (!C.keepAlive) {
                        window.Hyphenopoly = null;
                    }
                }
            });
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
            patternLeftmin,
            patternRightmin
        ) {
            alphabet = alphabet.replace(/-/g, "");
            const lo = createLangObj(lang);
            if (!lo.ready) {
                lo.cache = new Map();
                /* eslint-disable security/detect-object-injection */
                if (C.exceptions.global) {
                    if (C.exceptions[lang]) {
                        C.exceptions[lang] += ", " + C.exceptions.global;
                    } else {
                        C.exceptions[lang] = C.exceptions.global;
                    }
                }
                if (C.exceptions[lang]) {
                    lo.exc = new Map(C.exceptions[lang].split(", ").map((e) => {
                        return [e.replace(/-/g, ""), e];
                    }));
                    delete C.exceptions[lang];
                } else {
                    lo.exc = new Map();
                }
                /* eslint-enable security/detect-object-injection */
                lo.re = new Map();
                lo.hyphenate = hyphenateFunction;
                C.selectors.forEach((sel) => {
                    /* eslint-disable security/detect-object-injection */
                    const selSettings = C[sel];
                    /* eslint-enable security/detect-object-injection */
                    if (selSettings.leftminPerLang === 0) {
                        Object.defineProperty(
                            selSettings,
                            "leftminPerLang",
                            setProp(empty(), 2)
                        );
                    }
                    if (selSettings.rightminPerLang === 0) {
                        Object.defineProperty(
                            selSettings,
                            "rightminPerLang",
                            setProp(empty(), 2)
                        );
                    }
                    /* eslint-disable security/detect-object-injection */
                    selSettings.leftminPerLang[lang] = Math.max(
                        patternLeftmin,
                        selSettings.leftmin,
                        Number(selSettings.leftminPerLang[lang]) || 0
                    );

                    selSettings.rightminPerLang[lang] = Math.max(
                        patternRightmin,
                        selSettings.rightmin,
                        Number(selSettings.rightminPerLang[lang]) || 0
                    );
                    /* eslint-enable security/detect-object-injection */

                    /*
                     * Find words with characters from `alphabet` and
                     * `Zero Width Non-Joiner` and `-` with a min length.
                     *
                     * This regexp is not perfect. It also finds parts of words
                     * that follow a character that is not in the `alphabet`.
                     * Word delimiters are not taken in account.
                     */
                    lo.re.set(sel, RegExp(`[${alphabet}\u200C-]{${selSettings.minWordLength},}`, "gi"));
                });
                lo.ready = true;
                // eslint-disable-next-line security/detect-object-injection
                H.hyphenators[lang].resolve(H.createHyphenator(lang));
            }
            if (H.events.has("engineReady")) {
                H.events.get("engineReady").resolve(lang);
            }
            Promise.all([lo, H.res.get("els")]).then((v) => {
                hyphenateLangElements(lang, v[1].list.get(lang));
            });
        }

        const decode = (() => {
            if (w.TextDecoder) {
                const utf16ledecoder = new TextDecoder("utf-16le");
                return ((ui16) => {
                    return utf16ledecoder.decode(ui16);
                });
            }
            return ((ui16) => {
                return String.fromCharCode.apply(null, ui16);
            });
        })();

        /**
         * Setup env for hyphenateFunction
         * @param {Object} baseData baseData
         * @param {function} hyphenateFunc hyphenateFunction
         * @returns {function} hyphenateFunction with closured environment
         */
        function encloseHyphenateFunction(baseData, hyphenateFunc) {
            const wordStore = new Uint16Array(baseData.buf, baseData.wo, 64);
            const hydWrdStore = new Uint16Array(baseData.buf, baseData.hw, 128);
            wordStore[0] = 95;
            return ((word, hyphencc, leftmin, rightmin) => {
                let i = 0;
                for (const c of word) {
                    i += 1;
                    // eslint-disable-next-line security/detect-object-injection
                    wordStore[i] = c.charCodeAt(0);
                }
                wordStore[i + 1] = 95;
                wordStore[i + 2] = 0;
                if (hyphenateFunc(leftmin, rightmin, hyphencc) === 1) {
                    word = decode(hydWrdStore.subarray(1, hydWrdStore[0] + 1));
                }
                return word;
            });
        }

        /**
         * Instantiate Wasm Engine
         * @param {string} lang The language
         * @returns {undefined}
         */
        function instantiateWasmEngine(heProm, lang) {
            const wa = window.WebAssembly;
            // eslint-disable-next-line require-jsdoc
            function handleWasm(res) {
                const exp = res.instance.exports;
                const alphalen = exp.conv();
                const baseData = {
                    /* eslint-disable multiline-ternary */
                    "buf": exp.mem.buffer,
                    "hw": (wa.Global) ? exp.hwo.value : exp.hwo,
                    "lm": (wa.Global) ? exp.lmi.value : exp.lmi,
                    "rm": (wa.Global) ? exp.rmi.value : exp.rmi,
                    "wo": (wa.Global) ? exp.uwo.value : exp.uwo
                    /* eslint-enable multiline-ternary */
                };
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
            heProm.w.then((response) => {
                if (response.ok) {
                    let r2 = response;
                    if (heProm.c > 1) {
                        r2 = response.clone();
                    }
                    if (
                        wa.instantiateStreaming &&
                        (response.headers.get("Content-Type") === "application/wasm")
                    ) {
                        wa.instantiateStreaming(r2).then(handleWasm);
                    } else {
                        r2.arrayBuffer().
                            then((ab) => {
                                window.WebAssembly.instantiate(ab).
                                    then(handleWasm);
                            });
                    }
                } else {
                    H.res.get("els").then((elements) => {
                        elements.rem(lang);
                    });
                    /* eslint-disable security/detect-object-injection */
                    H.hyphenators[lang].catch((e) => {
                        H.events.get("error").resolve({
                            "msg": e.msg
                        });
                    });
                    H.hyphenators[lang].reject({
                        "msg": `File ${lang}.wasm can't be loaded from ${H.paths.patterndir}`
                    });
                    /* eslint-enable security/detect-object-injection */
                }
            });
        }

        H.res.get("DOM").then(() => {
            mainLanguage = getLang(w.document.documentElement, false);
            if (!mainLanguage && C.defaultLanguage !== "") {
                mainLanguage = C.defaultLanguage;
            }
            H.res.set("els", Promise.resolve(collectElements()));
            H.res.get("els").then((elements) => {
                elements.each((lang, values) => {
                    if (H.languages &&
                        H.languages.has(lang) &&
                        H.languages.get(lang).ready
                    ) {
                        hyphenateLangElements(lang, values);
                    }
                });
            });
        });

        H.res.get("he").forEach((heProm, lang) => {
            instantiateWasmEngine(heProm, lang);
        });
    })(Hyphenopoly);
})(window);
