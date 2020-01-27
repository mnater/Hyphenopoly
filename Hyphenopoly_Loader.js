/**
<<<<<<< HEAD
 * @license Hyphenopoly_Loader 3.4.0 - client side hyphenation
 * ©2019  Mathias Nater, Zürich (mathiasnater at gmail dot com)
=======
 * @license Hyphenopoly_Loader 4.0.0 - client side hyphenation
 * ©2020  Mathias Nater, Güttingen (mathiasnater at gmail dot com)
>>>>>>> noIE
 * https://github.com/mnater/Hyphenopoly
 *
 * Released under the MIT license
 * http://mnater.github.io/Hyphenopoly/LICENSE
 */

((w, d, H, o) => {
    "use strict";

    const store = sessionStorage;
    const storeID = "Hyphenopoly_Loader";
    const lcRequire = new Map();

    /**
     * Create Object without standard Object-prototype
     * @returns {Object} empty object
     */
    const empty = () => o.create(null);

    const shortcuts = {
        "ac": "appendChild",
        "ce": "createElement",
        "ct": "createTextNode"
    };

    /**
     * Shorthand for Object.keys(obj).forEach(function () {})
     * @param {Object} obj the object to iterate
     * @param {function} fn the function to execute
     * @returns {undefined}
     */
    const eachKey = (obj, fn) => o.keys(obj).forEach(fn);

    /**
     * Set H.cf (Hyphenopoly.clientFeatures) either by reading out previously
     * computed settings from sessionStorage or creating an template object.
     * This is in an iife to keep complexity low.
     */
    (() => {
        if (H.cacheFeatureTests && store.getItem(storeID)) {
            H.cf = JSON.parse(store.getItem(storeID));
        } else {
            H.cf = {
                "langs": empty(),
                "pf": false
            };
        }
    })();

    /**
     * Set H.paths and some H.setup fields to defaults or
     * overwrite with user settings.
     * These are iifes to keep complexity low.
     */
    (() => {
        const maindir = d.currentScript.src.replace(/Hyphenopoly_Loader.js/i, "");
        const patterndir = maindir + "patterns/";
        if (H.paths) {
            H.paths.maindir = H.paths.maindir || maindir;
            H.paths.patterndir = H.paths.patterndir || patterndir;
        } else {
            H.paths = {
                maindir,
                patterndir
            };
        }
    })();

    (() => {
        if (H.setup) {
            H.setup.hide = H.setup.hide || "all";
            H.setup.selectors = H.setup.selectors || {".hyphenate": {}};
            H.setup.timeout = H.setup.timeout || 1000;
        } else {
            H.setup = {
                "hide": "all",
                "selectors": {".hyphenate": {}},
                "timeout": 1000
            };
        }
        // Change mode string to mode int
        H.setup.hide = (() => {
            switch (H.setup.hide) {
            case "all":
                return 1;
            case "element":
                return 2;
            case "text":
                return 3;
            default:
                return 0;
            }
        })();
    })();

    /**
     * Copy required languages to local lcRequire (lowercaseRequire) and
     * eventually fallbacks to local lcFallbacks (lowercaseFallbacks).
     * This is in an iife to keep complexity low.
     */
    (() => {
        eachKey(H.require, (k) => {
            /* eslint-disable security/detect-object-injection */
            const fn = (H.fallbacks && H.fallbacks[k])
                ? H.fallbacks[k]
                : k;
            lcRequire.set(k.toLowerCase(), new Map(
                [["fn", fn], ["wo", H.require[k]]]
            ));
            /* eslint-enable security/detect-object-injection */
        });
    })();

    /**
     * Create deferred Promise
     *
     * Kudos to http://lea.verou.me/2016/12/resolve-promises-externally-with-
     * this-one-weird-trick/
     * @return {promise}
     */
    H.defProm = () => {
        let res = null;
        let rej = null;
        const promise = new Promise((resolve, reject) => {
            res = resolve;
            rej = reject;
        });
        promise.resolve = res;
        promise.reject = rej;

        return promise;
    };

    /**
     * Define function H.toggle.
     * This function hides (state = 0) or unhides (state = 1)
     * the whole document (mode == 1) or
     * each selected element (mode == 2) or
     * text of each selected element (mode == 3) or
     * nothing (mode == 0)
     * @param {integer} state - State
     * @param {integer} mode  - Mode
     */
    H.hiding = (state, mode) => {
        const sid = "H9Y_Styles";
        if (state === 1) {
            const stylesNode = d.getElementById(sid);
            if (stylesNode) {
                stylesNode.parentNode.removeChild(stylesNode);
            }
        } else {
            const vis = " {visibility: hidden !important}\n";
            const sc = d[shortcuts.ce]("style");
            let myStyle = "";
            sc.id = sid;
            if (mode === 1) {
                myStyle = "html" + vis;
            } else {
                eachKey(H.setup.selectors, (sel) => {
                    if (mode === 2) {
                        myStyle += sel + vis;
                    } else {
                        myStyle += sel + " {color: transparent !important}\n";
                    }
                });
            }
            sc[shortcuts.ac](d[shortcuts.ct](myStyle));
            d.head[shortcuts.ac](sc);
        }
    };

    H.res = new Map();
    H.res.set("he", new Map());

    (() => {
        const tester = (() => {
            let fakeBody = null;
            const ha = "hyphens:auto";
            /* eslint-disable array-element-newline */
            const css = `visibility:hidden;-moz-${ha};-webkit-${ha};-ms-${ha};${ha};width:48px;font-size:12px;line-height:12px;border:none;padding:0;word-wrap:normal`;
            /* eslint-enable array-element-newline */

            return {

                /**
                 * Append fakeBody with tests to target (document)
                 * @param {Object} target Where to append fakeBody
                 * @returns {Object|null} The body element or null, if no tests
                 */
                "ap": (target) => {
                    if (fakeBody) {
                        target[shortcuts.ac](fakeBody);
                        return fakeBody;
                    }
                    return null;
                },

                /**
                 * Remove fakeBody
                 * @returns {undefined}
                 */
                "cl": () => {
                    if (fakeBody) {
                        fakeBody.parentNode.removeChild(fakeBody);
                    }
                },

                /**
                 * Create and append div with CSS-hyphenated word
                 * @param {string} lang Language
                 * @returns {undefined}
                 */
                "cr": (lang) => {
                    /* eslint-disable security/detect-object-injection */
                    if (H.cf.langs[lang]) {
                        return;
                    }
                    /* eslint-enable security/detect-object-injection */
                    fakeBody = fakeBody || d[shortcuts.ce]("body");
                    const testDiv = d[shortcuts.ce]("div");
                    testDiv.lang = lang;
                    testDiv.style.cssText = css;
                    testDiv[shortcuts.ac](
                        d[shortcuts.ct](
                            lcRequire.get(lang).get("wo").
                                toLowerCase()
                        )
                    );
                    fakeBody[shortcuts.ac](testDiv);
                }
            };
        })();

        /**
         * Checks if hyphens (ev.prefixed) is set to auto for the element.
         * @param {Object} elm - the element
         * @returns {Boolean} result of the check
         */
        function checkCSSHyphensSupport(elm) {
            const a = "auto";
            const h = elm.style.hyphens ||
                elm.style.webkitHyphens ||
                elm.style.msHyphens ||
                elm.style["-moz-hyphens"];
            return (h === a);
        }

        /**
         * Load hyphenEngines
         *
         * @param {string} lang The language
         * @returns {undefined}
         */
        function loadhyphenEngine(lang) {
            const filename = lcRequire.get(lang).get("fn") + ".wasm";
            H.cf.pf = true;
            // eslint-disable-next-line security/detect-object-injection
            H.cf.langs[lang] = "H9Y";
            H.res.get("he").set(
                lang,
                w.fetch(H.paths.patterndir + filename, {"credentials": "include"})
            );
        }

        /**
         * Tear Down Hyphenopoly
         */
        function tearDown() {
            if (H.handleEvent && H.handleEvent.tearDown) {
                H.handleEvent.tearDown();
            }
            w.Hyphenopoly = null;
        }

        /**
         * Polyfill event
         */
        function polyfill() {
            if (H.handleEvent && H.handleEvent.polyfill) {
                H.handleEvent.polyfill();
            }
        }

        lcRequire.forEach((value, lang) => {
            if (value.get("wo") === "FORCEHYPHENOPOLY" ||
                // eslint-disable-next-line security/detect-object-injection
                (H.cf.langs[lang] && H.cf.langs[lang] === "H9Y")
            ) {
                loadhyphenEngine(lang);
            } else {
                tester.cr(lang);
            }
        });

        const testContainer = tester.ap(d.documentElement);
        if (testContainer !== null) {
            const nl = testContainer.querySelectorAll("div");
            nl.forEach((n) => {
                if (checkCSSHyphensSupport(n) && n.offsetHeight > 12) {
                    H.cf.langs[n.lang] = "CSS";
                } else {
                    loadhyphenEngine(n.lang);
                }
            });
            tester.cl();
        }
        if (H.cf.pf) {
            H.res.set("DOM", new Promise((res) => {
                if (d.readyState === "loading") {
                    d.addEventListener(
                        "DOMContentLoaded",
                        res,
                        {
                            "once": true,
                            "passive": true
                        }
                    );
                } else {
                    res();
                }
            }));
            if (H.setup.hide === 1) {
                H.hiding(0, 1);
            }
            if (H.setup.hide !== 0) {
                H.setup.timeOutHandler = w.setTimeout(() => {
                    H.hiding(1, null);
                    // eslint-disable-next-line no-console
                    console.error(`Hyphenopoly timed out after ${H.setup.timeout}ms`);
                }, H.setup.timeout);
            }
            H.res.get("DOM").then(() => {
                if (H.setup.hide > 1) {
                    H.hiding(0, H.setup.hide);
                }
            });
            // Load main script
            const script = d[shortcuts.ce]("script");
            script.src = H.paths.maindir + "Hyphenopoly.js";
            d.head[shortcuts.ac](script);

            eachKey(H.cf.langs, (lang) => {
                /* eslint-disable security/detect-object-injection */
                if (H.cf.langs[lang] === "H9Y") {
                    H.hyphenators = H.hyphenators || empty();
                    if (!H.hyphenators[lang]) {
                        H.hyphenators[lang] = H.defProm();
                    }
                }
                /* eslint-enable security/detect-object-injection */
            });

            polyfill();
        } else {
            tearDown();
        }
        if (H.cacheFeatureTests) {
            store.setItem(storeID, JSON.stringify(H.cf));
        }
    })();
})(window, document, Hyphenopoly, Object);
