/**
 * @license Hyphenopoly_Loader 4.6.0 - client side hyphenation
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

    const shortcuts = {
        "ac": "appendChild",
        "ce": "createElement",
        "ct": "createTextNode"
    };

    /**
     * Set H.cf (Hyphenopoly.clientFeatures) either by reading out previously
     * computed settings from sessionStorage or creating a template object.
     * This is in an iife to keep complexity low.
     */
    (() => {
        if (H.cacheFeatureTests && store.getItem(scriptName)) {
            H.cf = JSON.parse(store.getItem(scriptName));
            H.cf.langs = new Map(H.cf.langs);
        } else {
            H.cf = {
                "langs": new Map(),
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
        const maindir = d.currentScript.src.slice(0, -(scriptName.length));
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
            H.setup.CORScredentials = H.setup.CORScredentials || "include";
            H.setup.hide = H.setup.hide || "all";
            H.setup.selectors = H.setup.selectors || {".hyphenate": {}};
            H.setup.timeout = H.setup.timeout || 1000;
        } else {
            H.setup = {
                "CORScredentials": "include",
                "hide": "all",
                "selectors": {".hyphenate": {}},
                "timeout": 1000
            };
        }

        // Change mode string to mode int
        H.setup.hide = (() => {
            return ["all", "element", "text"].indexOf(H.setup.hide);
        })();
    })();

    /**
     * Copy required languages to local lcRequire (lowercaseRequire) and
     * eventually fallbacks to local lcFallbacks (lowercaseFallbacks).
     * This is in an iife to keep complexity low.
     */
    (() => {
        const fallbacks = (H.fallbacks)
            ? new Map(o.entries(H.fallbacks))
            : new Map();
        o.entries(H.require).forEach(([lang, wo]) => {
            lcRequire.set(lang.toLowerCase(), {
                "fn": fallbacks.get(lang) || lang,
                wo
            });
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

    let stylesNode = null;

    /**
     * Define function H.hide.
     * This function hides (state = 1) or unhides (state = 0)
     * the whole document (mode == 0) or
     * each selected element (mode == 1) or
     * text of each selected element (mode == 2) or
     * nothing (mode == -1)
     * @param {integer} state - State
     * @param {integer} mode  - Mode
     */
    H.hide = (state, mode) => {
        if (state === 0) {
            if (stylesNode) {
                stylesNode.remove();
            }
        } else {
            const vis = "{visibility:hidden!important}";
            stylesNode = d[shortcuts.ce]("style");
            stylesNode.id = "H9Y_Styles";
            let myStyle = "";
            if (mode === 0) {
                myStyle = "html" + vis;
            } else {
                o.keys(H.setup.selectors).forEach((sel) => {
                    if (mode === 1) {
                        myStyle += sel + vis;
                    } else {
                        myStyle += sel + "{color:transparent!important}";
                    }
                });
            }
            stylesNode[shortcuts.ac](d[shortcuts.ct](myStyle));
            d.head[shortcuts.ac](stylesNode);
        }
    };

    const tester = (() => {
        let fakeBody = null;
        return {

            /**
             * Append fakeBody with tests to target (document)
             * @param {Object} target Where to append fakeBody
             * @returns {Object|null} The body element or null, if no tests
             */
            "ap": () => {
                if (fakeBody) {
                    d.documentElement[shortcuts.ac](fakeBody);
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
                    fakeBody.remove();
                }
            },

            /**
             * Create and append div with CSS-hyphenated word
             * @param {string} lang Language
             * @returns {undefined}
             */
            "cr": (lang) => {
                if (H.cf.langs.has(lang)) {
                    return;
                }
                fakeBody = fakeBody || d[shortcuts.ce]("body");
                const testDiv = d[shortcuts.ce]("div");
                const ha = "hyphens:auto";
                testDiv.lang = lang;
                testDiv.style.cssText = `visibility:hidden;-webkit-${ha};-ms-${ha};${ha};width:48px;font-size:12px;line-height:12px;border:none;padding:0;word-wrap:normal`;
                testDiv[shortcuts.ac](
                    d[shortcuts.ct](lcRequire.get(lang).wo.toLowerCase())
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

    H.res = {
        "he": new Map()
    };
    const fw = new Map();

    /**
     * Load hyphenEngines
     *
     * Make sure each .wasm is loaded exactly once, even for fallbacks
     * fw: fetched wasm (maps filename to language)
     * he: hyphenEngines (maps lang to wasm and counter)
     * c (counter) is needed in Hyphenopoly.js to decide
     * if wasm needs to be cloned
     * @param {string} lang The language
     * @returns {undefined}
     */
    function loadhyphenEngine(lang) {
        const filename = lcRequire.get(lang).fn + ".wasm";
        H.cf.pf = true;
        H.cf.langs.set(lang, "H9Y");
        if (fw.has(filename)) {
            const hyphenEngineWrapper = H.res.he.get(fw.get(filename));
            hyphenEngineWrapper.c += 1;
            H.res.he.set(lang, hyphenEngineWrapper);
        } else {
            H.res.he.set(
                lang,
                {
                    "c": 1,
                    "w": w.fetch(H.paths.patterndir + filename, {"credentials": H.setup.CORScredentials})
                }
            );
            fw.set(filename, lang);
        }
    }
    lcRequire.forEach((value, lang) => {
        if (value.wo === "FORCEHYPHENOPOLY" || H.cf.langs.get(lang) === "H9Y") {
            loadhyphenEngine(lang);
        } else {
            tester.cr(lang);
        }
    });
    const testContainer = tester.ap();
    if (testContainer) {
        testContainer.querySelectorAll("div").forEach((n) => {
            if (checkCSSHyphensSupport(n.style) && n.offsetHeight > 12) {
                H.cf.langs.set(n.lang, "CSS");
            } else {
                loadhyphenEngine(n.lang);
            }
        });
        tester.cl();
    }
    const he = H.handleEvent;
    if (H.cf.pf) {
        H.res.DOM = new Promise((res) => {
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
        });
        if (H.setup.hide === 0) {
            H.hide(1, 0);
        }
        if (H.setup.hide !== -1) {
            H.timeOutHandler = w.setTimeout(() => {
                H.hide(0, null);
                // eslint-disable-next-line no-console
                console.info(scriptName + " timed out.");
            }, H.setup.timeout);
        }
        H.res.DOM.then(() => {
            if (H.setup.hide > 0) {
                H.hide(1, H.setup.hide);
            }
        });
        // Load main script
        const script = d[shortcuts.ce]("script");
        script.src = H.paths.maindir + "Hyphenopoly.js";
        d.head[shortcuts.ac](script);
        H.hy6ors = new Map();
        H.cf.langs.forEach((langDef, lang) => {
            if (langDef === "H9Y") {
                H.hy6ors.set(lang, H.defProm());
            }
        });
        H.hy6ors.set("HTML", H.defProm());
        H.hyphenators = new Proxy(H.hy6ors, {
            "get": (target, key) => {
                return target.get(key);
            },
            "set": () => {
                // Inhibit setting of hyphenators
                return true;
            }
        });
        (() => {
            if (he && he.polyfill) {
                he.polyfill();
            }
        })();
    } else {
        (() => {
            if (he && he.tearDown) {
                he.tearDown();
            }
            w.Hyphenopoly = null;
        })();
    }
    (() => {
        if (H.cacheFeatureTests) {
            store.setItem(scriptName, JSON.stringify(
                {
                    "langs": [...H.cf.langs.entries()],
                    "pf": H.cf.pf
                }
            ));
        }
    })();
})(window, document, Hyphenopoly, Object);
