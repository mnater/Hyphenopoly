/**
 * @license Hyphenopoly_Loader 4.3.0 - client side hyphenation
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
            H.cf = new Map(JSON.parse(store.getItem(scriptName)));
            H.cf.set("langs", new Map(H.cf.get("langs")));
        } else {
            H.cf = new Map([["langs", new Map()], ["pf", false]]);
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
            const tr = new Map([["all", 1], ["element", 2], ["text", 3]]);
            return tr.get(H.setup.hide) || 0;
        })();
    })();

    /**
     * Copy required languages to local lcRequire (lowercaseRequire) and
     * eventually fallbacks to local lcFallbacks (lowercaseFallbacks).
     * This is in an iife to keep complexity low.
     */
    (() => {
        const require = new Map(o.entries(H.require));
        const fallbacks = (H.fallbacks)
            ? new Map(o.entries(H.fallbacks))
            : new Map();
        require.forEach((longWord, lang) => {
            const fn = fallbacks.get(lang) || lang;
            lcRequire.set(lang.toLowerCase(), new Map(
                [["fn", fn], ["wo", longWord]]
            ));
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
                stylesNode.remove();
            }
        } else {
            const vis = "{visibility:hidden!important}";
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
                        myStyle += sel + "{color:transparent!important}";
                    }
                });
            }
            sc[shortcuts.ac](d[shortcuts.ct](myStyle));
            d.head[shortcuts.ac](sc);
        }
    };

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
                if (H.cf.get("langs").get(lang)) {
                    return;
                }
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

    H.res = new Map([["he", new Map()]]);
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
        const filename = lcRequire.get(lang).get("fn") + ".wasm";
        H.cf.set("pf", true);
        H.cf.get("langs").set(lang, "H9Y");
        if (fw.has(filename)) {
            const hyphenEngineWrapper = H.res.get("he").get(fw.get(filename));
            hyphenEngineWrapper.c += 1;
            H.res.get("he").set(lang, hyphenEngineWrapper);
        } else {
            H.res.get("he").set(
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
        if (value.get("wo") === "FORCEHYPHENOPOLY" || H.cf.get("langs").get(lang) === "H9Y") {
            loadhyphenEngine(lang);
        } else {
            tester.cr(lang);
        }
    });
    const testContainer = tester.ap();
    if (testContainer) {
        const nl = testContainer.querySelectorAll("div");
        nl.forEach((n) => {
            if (checkCSSHyphensSupport(n.style) && n.offsetHeight > 12) {
                H.cf.get("langs").set(n.lang, "CSS");
            } else {
                loadhyphenEngine(n.lang);
            }
        });
        tester.cl();
    }
    const he = H.handleEvent;
    if (H.cf.get("pf")) {
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
            H.timeOutHandler = w.setTimeout(() => {
                H.hide(0, null);
                // eslint-disable-next-line no-console
                console.info(scriptName + " timed out.");
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
        H.hy6ors = new Map();
        H.cf.get("langs").forEach((langDef, lang) => {
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
            const langs = [...H.cf.get("langs").entries()];
            store.setItem(scriptName, JSON.stringify(
                [["langs", langs], ["pf", H.cf.get("pf")]]
            ));
        }
    })();
})(window, document, Hyphenopoly, Object);
