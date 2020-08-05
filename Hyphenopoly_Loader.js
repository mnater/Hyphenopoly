/**
 * @license Hyphenopoly_Loader 4.7.0 - client side hyphenation
 * ©2020  Mathias Nater, Güttingen (mathiasnater at gmail dot com)
 * https://github.com/mnater/Hyphenopoly
 *
 * Released under the MIT license
 * http://mnater.github.io/Hyphenopoly/LICENSE
 */
/* globals Hyphenopoly:readonly */
((w, d, H, o) => {
    "use strict";

    /**
     * Shortcut for new Map
     * @param {any} init - initialiser for new Map
     * @returns {Map}
     */
    const mp = (init) => {
        return new Map(init);
    };

    /**
     * Sets default properties for an Object
     * @param {object} obj - The object to set defaults to
     * @param {object} defaults - The defaults to set
     * @returns {object}
     */
    const setDefaults = (obj, defaults) => {
        if (obj) {
            o.entries(defaults).forEach(([k, v]) => {
                // eslint-disable-next-line security/detect-object-injection
                obj[k] = obj[k] || v;
            });
            return obj;
        }
        return defaults;
    };

    const store = sessionStorage;
    const scriptName = "Hyphenopoly_Loader.js";
    const lcRequire = mp();

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
            H.cf.langs = mp(H.cf.langs);
        } else {
            H.cf = {
                "langs": mp(),
                "pf": false
            };
        }
    })();

    /**
     * Set H.paths and some H.s (setup) fields to defaults or
     * overwrite with user settings.
     * These is an iife to keep complexity low.
     */
    (() => {
        const thisScript = d.currentScript.src;
        const maindir = thisScript.slice(0, (thisScript.lastIndexOf("/") + 1));
        const patterndir = maindir + "patterns/";
        H.paths = setDefaults(H.paths, {
            maindir,
            patterndir
        });

        H.s = setDefaults(H.setup, {
            "CORScredentials": "include",
            "hide": "all",
            "selectors": {".hyphenate": {}},
            "timeout": 1000
        });
        // Change mode string to mode int
        H.s.hide = ["all", "element", "text"].indexOf(H.s.hide);
    })();

    /**
     * Copy required languages to local lcRequire (lowercaseRequire) and
     * eventually fallbacks to local lcFallbacks (lowercaseFallbacks).
     * This is in an iife to keep complexity low.
     */
    (() => {
        const fallbacks = mp(o.entries(H.fallbacks || {}));
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
    const defProm = () => {
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
            let myStyle = "";
            if (mode === 0) {
                myStyle = "html" + vis;
            } else {
                o.keys(H.s.selectors).forEach((sel) => {
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
             * Append fakeBody with tests to document
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
    const checkCSSHyphensSupport = (elmStyle) => {
        const h = elmStyle.hyphens ||
            elmStyle.webkitHyphens ||
            elmStyle.msHyphens;
        return (h === "auto");
    };

    H.res = {
        "he": mp()
    };
    const fw = mp();

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
    const loadhyphenEngine = (lang) => {
        const filename = lcRequire.get(lang).fn + ".wasm";
        H.cf.pf = true;
        H.cf.langs.set(lang, "H9Y");
        if (fw.has(filename)) {
            const hyphenEngineWrapper = H.res.he.get(fw.get(filename));
            hyphenEngineWrapper.c = true;
            H.res.he.set(lang, hyphenEngineWrapper);
        } else {
            H.res.he.set(
                lang,
                {
                    "w": w.fetch(H.paths.patterndir + filename, {"credentials": H.s.CORScredentials})
                }
            );
            fw.set(filename, lang);
        }
    };
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
        const hide = H.s.hide;
        if (hide === 0) {
            H.hide(1, 0);
        }
        if (hide !== -1) {
            H.timeOutHandler = w.setTimeout(() => {
                H.hide(0, null);
                // eslint-disable-next-line no-console
                console.info(scriptName + " timed out.");
            }, H.s.timeout);
        }
        H.res.DOM.then(() => {
            if (hide > 0) {
                H.hide(1, hide);
            }
        });
        // Load main script
        const script = d[shortcuts.ce]("script");
        script.src = H.paths.maindir + "Hyphenopoly.js";
        d.head[shortcuts.ac](script);
        H.hy6ors = mp();
        H.cf.langs.forEach((langDef, lang) => {
            if (langDef === "H9Y") {
                H.hy6ors.set(lang, defProm());
            }
        });
        H.hy6ors.set("HTML", defProm());
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
