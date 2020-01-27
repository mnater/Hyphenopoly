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

<<<<<<< HEAD
/* globals Hyphenopoly:readonly */

/**
 * Wrap all code in an iife to keep a scope. Important objects are parameters
 * of this iife to keep codesize low.
 * @param {Object} w shorthand for window
 * @param {Object} d shorthand for document
 * @param {Object} H shorthand for Hyphenopoly
 * @param {Object} o shorthand for object
 */
(function H9YL(w, d, H, o) {
=======
((w, d, H, o) => {
>>>>>>> noIE
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
<<<<<<< HEAD
                eachKey(H.setup.selectors, function eachSelector(sel) {
                    myStyle += sel + " {color: transparent !important}\n";
                });
                break;
            // No Default
=======
                return 3;
            default:
                return 0;
>>>>>>> noIE
            }
        })();
    })();

    /**
     * Copy required languages to local lcRequire (lowercaseRequire) and
     * eventually fallbacks to local lcFallbacks (lowercaseFallbacks).
     * This is in an iife to keep complexity low.
     */
<<<<<<< HEAD
    (function setupEvents() {
        // Events known to the system
        const definedEvents = new Map();
        // Default events, execution deferred to Hyphenopoly.js
        const deferred = [];

        /*
         * Register for custom event handlers, where event is not yet defined
         * these events will be correctly registered in Hyphenopoly.js
         */
        const tempRegister = [];

        /**
         * Create Event Object
         * @param {string} name The Name of the event
         * @param {function} defFunc The default method of the event
         * @param {boolean} cancellable Is the default cancellable
         * @returns {undefined}
         */
        function define(name, defFunc, cancellable) {
            definedEvents.set(name, {
                "cancellable": cancellable,
                "default": defFunc,
                "register": []
            });
        }

        define(
            "timeout",
            function def(e) {
                H.toggle("on");
                w.console.info(
                    "Hyphenopolys 'FOUHC'-prevention timed out after %dms",
                    e.delay
                );
            },
            false
        );

        define(
            "error",
            function def(e) {
                switch (e.lvl) {
                case "info":
                    w.console.info(e.msg);
                    break;
                case "warn":
                    w.console.warn(e.msg);
                    break;
                default:
                    w.console.error(e.msg);
                }
            },
            true
        );

        define(
            "contentLoaded",
            function def(e) {
                deferred.push({
                    "data": e,
                    "name": "contentLoaded"
                });
            },
            false
        );

        define(
            "engineLoaded",
            function def(e) {
                deferred.push({
                    "data": e,
                    "name": "engineLoaded"
                });
            },
            false
        );

        define(
            "hpbLoaded",
            function def(e) {
                deferred.push({
                    "data": e,
                    "name": "hpbLoaded"
                });
            },
            false
        );

        define(
            "loadError",
            function def(e) {
                deferred.push({
                    "data": e,
                    "name": "loadError"
                });
            },
            false
        );

        define(
            "tearDown",
            null,
            true
        );

        /**
         * Dispatch event <name> with arguments <data>
         * @param {string} name The name of the event
         * @param {Object|undefined} data Data of the event
         * @returns {undefined}
         */
        function dispatch(name, data) {
            data = data || empty();
            let defaultPrevented = false;
            definedEvents.get(name).register.forEach(
                function call(currentHandler) {
                    data.preventDefault = function preventDefault() {
                        if (definedEvents.get(name).cancellable) {
                            defaultPrevented = true;
                        }
                    };
                    currentHandler(data);
                }
            );
            if (
                !defaultPrevented &&
                definedEvents.get(name).default
            ) {
                definedEvents.get(name).default(data);
            }
        }

        /**
         * Add EventListender <handler> to event <name>
         * @param {string} name The name of the event
         * @param {function} handler Function to register
         * @param {boolean} defer If the registration is deferred
         * @returns {undefined}
         */
        function addListener(name, handler, defer) {
            if (definedEvents.has(name)) {
                definedEvents.get(name).register.push(handler);
            } else if (defer) {
                tempRegister.push({
                    "handler": handler,
                    "name": name
                });
            } else {
                H.events.dispatch(
                    "error",
                    {
                        "lvl": "warn",
                        "msg": "unknown Event \"" + name + "\" discarded"
                    }
                );
            }
        }

        if (H.handleEvent) {
            eachKey(H.handleEvent, function add(name) {
                /* eslint-disable security/detect-object-injection */
                addListener(name, H.handleEvent[name], true);
                /* eslint-enable security/detect-object-injection */
            });
        }

        H.events = empty();
        H.events.deferred = deferred;
        H.events.tempRegister = tempRegister;
        H.events.dispatch = dispatch;
        H.events.define = define;
        H.events.addListener = addListener;
    }());

    /**
     * Feature test for wasm.
     * @returns {boolean} support
     */
    function runWasmTest() {
        /*
         * Wasm feature test with iOS bug detection
         * (https://bugs.webkit.org/show_bug.cgi?id=181781)
         */
        if (
            typeof wa === "object" &&
            typeof wa.Instance === "function"
        ) {
            /* eslint-disable array-element-newline */
            const module = new wa.Module(Uint8Array.from([
                0, 97, 115, 109, 1, 0, 0, 0, 1, 6, 1, 96, 1, 127, 1, 127,
                3, 2, 1, 0, 5, 3, 1, 0, 1, 7, 5, 1, 1, 116, 0, 0,
                10, 16, 1, 14, 0, 32, 0, 65, 1, 54, 2, 0, 32, 0, 40, 2,
                0, 11
            ]));
            /* eslint-enable array-element-newline */
            return (new wa.Instance(module).exports.t(4) !== 0);
        }
        return false;
    }
=======
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
>>>>>>> noIE

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
<<<<<<< HEAD
    function loadBinary(path, fne, name, msg) {
        /**
         * Get bin file using fetch
         * @param {string} p Where the script is stored
         * @param {string} f Filename of the script with extension
         * @param {string} n Name of the ressource
         * @param {Object} m Message
         * @returns {undefined}
         */
        function fetchBinary(p, f, n, m) {
            w.fetch(p + f, {"credentials": "include"}).then(
                function resolve(response) {
                    if (response.ok) {
                        if (n === "hyphenEngine") {
                            H.bins.set(n, response.arrayBuffer().then(
                                function getModule(buf) {
                                    return new wa.Module(buf);
                                }
                            ));
                            H.events.dispatch("engineLoaded", {"msg": m});
                        } else {
                            const files = loadedBins.get(f);
                            files.forEach(function eachHpb(rn) {
                                H.bins.set(
                                    rn,
                                    (files.length > 1)
                                        ? response.clone().arrayBuffer()
                                        : response.arrayBuffer()
                                );
                                H.events.dispatch(
                                    "hpbLoaded",
                                    {"msg": rn}
                                );
                            });
                        }
=======
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
>>>>>>> noIE
                    } else {
                        myStyle += sel + " {color: transparent !important}\n";
                    }
<<<<<<< HEAD
                }
            );
        }

        /**
         * Get bin file using XHR
         * @param {string} p Where the script is stored
         * @param {string} f Filename of the script with extension
         * @param {string} n Name of the ressource
         * @param {Object} m Message
         * @returns {undefined}
         */
        function requestBinary(p, f, n, m) {
            const xhr = new XMLHttpRequest();
            xhr.onload = function onload() {
                if (xhr.status === 200) {
                    loadedBins.get(f).
                        forEach(function eachHpb(rn) {
                            H.bins.set(
                                rn,
                                xhr.response
                            );
                            H.events.dispatch(
                                "hpbLoaded",
                                {"msg": rn}
                            );
                        });
                } else {
                    H.events.dispatch("loadError", {
                        "file": f,
                        "msg": m,
                        "name": n,
                        "path": p
                    });
                }
            };
            xhr.open("GET", p + f);
            xhr.responseType = "arraybuffer";
            xhr.send();
        }
        if (!loadedBins.has(fne)) {
            loadedBins.set(fne, [msg]);
            if (H.cf.wasm) {
                fetchBinary(path, fne, name, msg);
            } else {
                requestBinary(path, fne, name, msg);
=======
                });
>>>>>>> noIE
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
<<<<<<< HEAD
            const css = [
                "visibility:hidden",
                "-moz-hyphens:auto",
                "-webkit-hyphens:auto",
                "-ms-hyphens:auto",
                "hyphens:auto",
                "width:48px",
                "font-size:12px",
                "line-height:12px",
                "border:none",
                "padding:0",
                "word-wrap:normal"
            ].join(";");
            /* eslint-enable array-element-newline */

            /**
             * Create and append div with CSS-hyphenated word
             * @param {string} lang Language
             * @returns {undefined}
             */
            function create(lang) {
                /* eslint-disable security/detect-object-injection */
                if (H.cf.langs[lang]) {
                    return;
                }
                /* eslint-enable security/detect-object-injection */
                fakeBody = fakeBody || d.createElement("body");
                const testDiv = d.createElement("div");
                testDiv.lang = lang;
                testDiv.style.cssText = css;
                testDiv.appendChild(
                    d.createTextNode(lcRequire.get(lang).toLowerCase())
                );
                fakeBody.appendChild(testDiv);
            }

            /**
             * Append fakeBody with tests to target (document)
             * @param {Object} target Where to append fakeBody
             * @returns {Object|null} The body element or null, if no tests
             */
            function append(target) {
                if (fakeBody) {
                    target.appendChild(fakeBody);
                    return fakeBody;
                }
                return null;
            }
=======
            const css = `visibility:hidden;-moz-${ha};-webkit-${ha};-ms-${ha};${ha};width:48px;font-size:12px;line-height:12px;border:none;padding:0;word-wrap:normal`;
            /* eslint-enable array-element-newline */

            return {
>>>>>>> noIE

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
<<<<<<< HEAD
        function exposeHyphenateFunction(lang) {
            /* eslint-disable security/detect-object-injection */
            H.hyphenators = H.hyphenators || empty();
            if (!H.hyphenators[lang]) {
                if (w.Promise) {
                    H.hyphenators[lang] = new Promise(function pro(rs, rj) {
                        H.events.addListener(
                            "engineReady",
                            function handler(e) {
                                if (e.msg === lang) {
                                    rs(H.createHyphenator(e.msg));
                                }
                            },
                            true
                        );
                        H.events.addListener(
                            "loadError",
                            function handler(e) {
                                if (e.name === lang || e.name === "hyphenEngine") {
                                    rj(new Error("File " + e.file + " can't be loaded from " + e.path));
                                }
                            },
                            false
                        );
                    });
                    H.hyphenators[lang].catch(function catchPromiseError(e) {
                        H.events.dispatch(
                            "error",
                            {
                                "lvl": "error",
                                "msg": e.message
                            }
                        );
                    });
                } else {
                    H.hyphenators[lang] = {
=======
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
>>>>>>> noIE

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
<<<<<<< HEAD
            Array.prototype.forEach.call(nl, function eachNode(n) {
                if (checkCSSHyphensSupport(n) && n.offsetHeight > 12) {
                    H.cf.langs[n.lang] = "CSS";
                } else {
                    loadPattern(n.lang);
=======
            nl.forEach((n) => {
                if (checkCSSHyphensSupport(n) && n.offsetHeight > 12) {
                    H.cf.langs[n.lang] = "CSS";
                } else {
                    loadhyphenEngine(n.lang);
>>>>>>> noIE
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
