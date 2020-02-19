/**
 * @license Hyphenopoly_Loader 4.1.0 - client side hyphenation
 * ©2020  Mathias Nater, Güttingen (mathiasnater at gmail dot com)
 * https://github.com/mnater/Hyphenopoly
 *
 * Released under the MIT license
 * http://mnater.github.io/Hyphenopoly/LICENSE
 */
/* globals Hyphenopoly:readonly */
((w, d, H, o) => {
    "use strict";

    const store = sessionStorage;
    const scriptName = "Hyphenopoly_Loader.js";
    const lcRequire = new Map();

    /**
     * Create Object without standard Object-prototype
     * @returns {Object} empty object
     */
    const empty = () => {
        return o.create(null);
    };

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
    const eachKey = (obj, fn) => {
        return o.keys(obj).forEach(fn);
    };

    /**
     * Set H.cf (Hyphenopoly.clientFeatures) either by reading out previously
     * computed settings from sessionStorage or creating an template object.
     * This is in an iife to keep complexity low.
     */
    (() => {
        if (H.cacheFeatureTests && store.getItem(scriptName)) {
            H.cf = JSON.parse(store.getItem(scriptName));
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
        const maindir = d.currentScript.src.replace(scriptName, "");
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
     * Define function H.hide.
     * This function hides (state = 1) or unhides (state = 0)
     * the whole document (mode == 1) or
     * each selected element (mode == 2) or
     * text of each selected element (mode == 3) or
     * nothing (mode == 0)
     * @param {integer} state - State
     * @param {integer} mode  - Mode
     */
    H.hide = (state, mode) => {
        const sid = "H9Y_Styles";
        if (state === 0) {
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

    H.res = new Map([["he", new Map()], ["fw", new Map()]]);

    (() => {
        const tester = (() => {
            let fakeBody = null;
            const ha = "hyphens:auto";
            const css = `visibility:hidden;-webkit-${ha};-ms-${ha};${ha};width:48px;font-size:12px;line-height:12px;border:none;padding:0;word-wrap:normal`;

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
        function checkCSSHyphensSupport(elmStyle) {
            const h = elmStyle.hyphens ||
                elmStyle.webkitHyphens ||
                elmStyle.msHyphens;
            return (h === "auto");
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
            if (H.res.get("fw").has(filename)) {
                H.res.get("he").get(H.res.get("fw").get(filename)).c += 1;
                H.res.get("he").set(
                    lang,
                    H.res.get("he").get(H.res.get("fw").get(filename))
                );
            } else {
                H.res.get("he").set(
                    lang,
                    {
                        "c": 1,
                        "w": w.fetch(H.paths.patterndir + filename, {"credentials": "include"})
                    }
                );
                H.res.get("fw").set(filename, lang);
            }
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
                if (checkCSSHyphensSupport(n.style) && n.offsetHeight > 12) {
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
                H.hide(1, 1);
            }
            if (H.setup.hide !== 0) {
                H.setup.timeOutHandler = w.setTimeout(() => {
                    H.hide(0, null);
                    // eslint-disable-next-line no-console
                    console.error(`${scriptName} timed out after ${H.setup.timeout}ms`);
                }, H.setup.timeout);
            }
            H.res.get("DOM").then(() => {
                if (H.setup.hide > 1) {
                    H.hide(1, H.setup.hide);
                }
            });
            // Load main script
            const script = d[shortcuts.ce]("script");
            script.src = H.paths.maindir + "Hyphenopoly.js";
            d.head[shortcuts.ac](script);
            H.hyphenators = empty();
            eachKey(H.cf.langs, (lang) => {
                /* eslint-disable security/detect-object-injection */
                if (H.cf.langs[lang] === "H9Y") {
                    H.hyphenators[lang] = H.defProm();
                }
                /* eslint-enable security/detect-object-injection */
            });

            polyfill();
        } else {
            tearDown();
        }
        if (H.cacheFeatureTests) {
            store.setItem(scriptName, JSON.stringify(H.cf));
        }
    })();
})(window, document, Hyphenopoly, Object);
