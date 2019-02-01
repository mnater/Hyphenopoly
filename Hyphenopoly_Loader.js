/**
 * @license Hyphenopoly_Loader 2.7.0 - client side hyphenation
 * ©2019  Mathias Nater, Zürich (mathiasnater at gmail dot com)
 * https://github.com/mnater/Hyphenopoly
 *
 * Released under the MIT license
 * http://mnater.github.io/Hyphenopoly/LICENSE
 */

/* global Hyphenopoly */

(function H9YL() {
    "use strict";
    const d = document;
    const H = Hyphenopoly;

    /**
     * Create Object without standard Object-prototype
     * @returns {Object} empty object
     */
    function empty() {
        return Object.create(null);
    }


    /**
     * Shorthand for Object.keys(obj).forEach(function () {})
     * @param {Object} obj the object to iterate
     * @param {function} fn the function to execute
     * @returns {undefined}
     */
    function eachKey(obj, fn) {
        Object.keys(obj).forEach(fn);
    }

    (function configFeat() {
        // Set H.clientFeat (either from sessionStorage or empty)
        if (H.cacheFeatureTests && sessionStorage.getItem("Hyphenopoly_Loader")) {
            H.clientFeat = JSON.parse(sessionStorage.getItem("Hyphenopoly_Loader"));
        } else {
            H.clientFeat = {
                "langs": empty(),
                "polyfill": false,
                "wasm": null
            };
        }
    }());
    (function configPaths() {
        // Set defaults for paths and setup
        H.dfltPaths = Object.create({
            "maindir": "../Hyphenopoly/",
            "patterndir": "../Hyphenopoly/patterns/"
        });
        if (H.paths) {
            if (H.paths.patterndir) {
                H.dfltPaths.patterndir = H.paths.patterndir;
            }
            if (H.paths.maindir) {
                H.dfltPaths.maindir = H.paths.maindir;
            }
        }
    }());
    (function configSetup() {
        if (H.setup) {
            H.setup.selectors = H.setup.selectors || {".hyphenate": {}};
            if (H.setup.classnames) {
                // Convert classnames to selectors
                eachKey(H.setup.classnames, function cn2sel(cn) {
                    /* eslint-disable security/detect-object-injection */
                    H.setup.selectors["." + cn] = H.setup.classnames[cn];
                    /* eslint-enable security/detect-object-injection */
                });
                H.setup.classnames = null;
                delete H.setup.classnames;
            }
            H.setup.timeout = H.setup.timeout || 1000;
            H.setup.hide = H.setup.hide || "all";
        } else {
            H.setup = {
                "hide": "all",
                "selectors": {".hyphenate": {}},
                "timeout": 1000
            };
        }
    }());
    (function configRequire() {
        H.lcRequire = new Map();
        eachKey(H.require, function copyRequire(k) {
            /* eslint-disable security/detect-object-injection */
            H.lcRequire.set(k.toLowerCase(), H.require[k]);
            /* eslint-enable security/detect-object-injection */
        });
        if (H.fallbacks) {
            H.lcFallbacks = new Map();
            eachKey(H.fallbacks, function copyFallbacks(k) {
                /* eslint-disable security/detect-object-injection */
                H.lcFallbacks.set(
                    k.toLowerCase(),
                    H.fallbacks[k].toLowerCase()
                );
                /* eslint-enable security/detect-object-injection */
            });
        }
    }());

    H.toggle = function toggle(state) {
        if (state === "on") {
            const stylesNode = d.getElementById("H9Y_Styles");
            if (stylesNode) {
                stylesNode.parentNode.removeChild(stylesNode);
            }
        } else {
            const vis = " {visibility: hidden !important}\n";
            const sc = d.createElement("style");
            sc.id = "H9Y_Styles";
            switch (H.setup.hide) {
            case "all":
                sc.innerHTML = "html" + vis;
                break;
            case "element":
                eachKey(H.setup.selectors, function eachSelector(sel) {
                    sc.innerHTML += sel + vis;
                });
                break;
            case "text":
                eachKey(H.setup.selectors, function eachSelector(sel) {
                    sc.innerHTML += sel + " {color: transparent !important}\n";
                });
                break;
            default:
                sc.innerHTML = "";
            }
            d.getElementsByTagName("head")[0].appendChild(sc);
        }
    };

    (function setupEvents() {
        // Events known to the system
        const definedEvents = new Map();
        // Default events, execution deferred to Hyphenopoly.js
        const deferred = [];

        /*
         * Eegister for custom event handlers, where event is not yet defined
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
                window.console.info(
                    "Hyphenopolys 'FOUHC'-prevention timed out after %dms",
                    e.delay
                );
            },
            false
        );

        define(
            "error",
            function def(e) {
                window.console.error(e.msg);
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

        /**
         * Dispatch error <name> with arguments <data>
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
                    {"msg": "unknown Event \"" + name + "\" discarded"}
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
     * Test if wasm is supported
     * @returns {undefined}
     */
    function featureTestWasm() {
        /* eslint-disable no-prototype-builtins */
        /**
         * Feature test for wasm
         * @returns {boolean} support
         */
        function runWasmTest() {
            /*
             * This is the original test, without webkit workaround
             * if (typeof WebAssembly === "object" &&
             *     typeof WebAssembly.instantiate === "function") {
             *     const module = new WebAssembly.Module(Uint8Array.from(
             *         [0, 97, 115, 109, 1, 0, 0, 0]
             *     ));
             *     if (WebAssembly.Module.prototype.isPrototypeOf(module)) {
             *         return WebAssembly.Instance.prototype.isPrototypeOf(
             *             new WebAssembly.Instance(module)
             *         );
             *     }
             * }
             * return false;
             */

            /*
             * Wasm feature test with iOS bug detection
             * (https://bugs.webkit.org/show_bug.cgi?id=181781)
             */
            if (
                typeof WebAssembly === "object" &&
                typeof WebAssembly.instantiate === "function"
            ) {
                /* eslint-disable array-element-newline */
                const module = new WebAssembly.Module(Uint8Array.from([
                    0, 97, 115, 109, 1, 0, 0, 0, 1, 6, 1, 96, 1, 127, 1, 127,
                    3, 2, 1, 0, 5, 3, 1, 0, 1, 7, 8, 1, 4, 116, 101, 115,
                    116, 0, 0, 10, 16, 1, 14, 0, 32, 0, 65, 1, 54, 2, 0, 32,
                    0, 40, 2, 0, 11
                ]));
                /* eslint-enable array-element-newline */
                if (WebAssembly.Module.prototype.isPrototypeOf(module)) {
                    const inst = new WebAssembly.Instance(module);
                    return WebAssembly.Instance.prototype.isPrototypeOf(inst) &&
                            (inst.exports.test(4) !== 0);
                }
            }
            return false;
        }
        /* eslint-enable no-prototype-builtins */
        if (H.clientFeat.wasm === null) {
            H.clientFeat.wasm = runWasmTest();
        }
    }

    const scriptLoader = (function scriptLoader() {
        const loadedScripts = new Map();

        /**
         * Load script by adding <script>-tag
         * @param {string} path Where the script is stored
         * @param {string} filename Filename of the script
         * @returns {undefined}
         */
        return function loadScript(path, filename) {
            if (!loadedScripts.has(filename)) {
                const script = d.createElement("script");
                loadedScripts.set(filename, true);
                script.src = path + filename;
                if (filename === "hyphenEngine.asm.js") {
                    script.addEventListener("load", function listener() {
                        H.events.dispatch("engineLoaded", {"msg": "asm"});
                    });
                }
                d.head.appendChild(script);
            }
        };
    }());

    const loadedBins = new Map();

    /**
     * Load binary files either with fetch (on new browsers that support wasm)
     * or with xmlHttpRequest
     * @param {string} path Where the script is stored
     * @param {string} fne Filename of the script with extension
     * @param {string} name Name of the ressource
     * @param {Object} msg Message
     * @returns {undefined}
     */
    function binLoader(path, fne, name, msg) {
        /**
         * Get bin file using fetch
         * @param {string} p Where the script is stored
         * @param {string} f Filename of the script with extension
         * @param {string} n Name of the ressource
         * @param {Object} m Message
         * @returns {undefined}
         */
        function fetchBinary(p, f, n, m) {
            if (!loadedBins.has(n)) {
                loadedBins.set(n, true);
                window.fetch(p + f).then(
                    function resolve(response) {
                        if (response.ok) {
                            if (n === "hyphenEngine") {
                                H.binaries.set(n, response.arrayBuffer().then(
                                    function getModule(buf) {
                                        return new WebAssembly.Module(buf);
                                    }
                                ));
                            } else {
                                H.binaries.set(n, response.arrayBuffer());
                            }
                            H.events.dispatch(m[0], {"msg": m[1]});
                        }
                    }
                );
            }
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
            if (!loadedBins.has(n)) {
                loadedBins.set(n, true);
                const xhr = new XMLHttpRequest();
                xhr.onload = function onload() {
                    H.binaries.set(n, xhr.response);
                    H.events.dispatch(m[0], {"msg": m[1]});
                };
                xhr.open("GET", p + f);
                xhr.responseType = "arraybuffer";
                xhr.send();
            }
        }
        if (H.clientFeat.wasm) {
            fetchBinary(path, fne, name, msg);
        } else {
            requestBinary(path, fne, name, msg);
        }
    }

    /**
     * Pre-Allocate memory for (w)asm
     * Default is 32 wasm Pages (). For languages with larger .hpb
     * files a higher value is needed.
     * Get the value from baseData.heapSize in Hyphenopoly.js
     * @param {string} lang Language
     * @returns {undefined}
     */
    function allocateMemory(lang) {
        const specVal = new Map(
            [["de", 55], ["hu", 207], ["nb-no", 92], ["nl", 41]]
        );
        const wasmPages = specVal.get(lang) || 32;
        H.specMems = H.specMems || new Map();
        if (H.clientFeat.wasm) {
            H.specMems.set(lang, new WebAssembly.Memory({
                "initial": wasmPages,
                "maximum": 256
            }));
        } else {
            /**
             * Polyfill Math.log2
             * @param {number} x argument
             * @return {number} Log2(x)
             */
            Math.log2 = Math.log2 || function polyfillLog2(x) {
                return Math.log(x) * Math.LOG2E;
            };
            /* eslint-disable no-bitwise */
            const asmPages = (2 << Math.floor(Math.log2(wasmPages))) * 65536;
            /* eslint-enable no-bitwise */
            H.specMems.set(lang, new ArrayBuffer(asmPages));
        }
    }

    (function featureTestCSSHyphenation() {
        const tester = (function tester() {
            let fakeBody = null;

            const css = (function createCss() {
                /* eslint-disable array-element-newline */
                const props = [
                    "visibility:hidden;",
                    "-moz-hyphens:auto;",
                    "-webkit-hyphens:auto;",
                    "-ms-hyphens:auto;",
                    "hyphens:auto;",
                    "width:48px;",
                    "font-size:12px;",
                    "line-height:12px;",
                    "border:none;",
                    "padding:0;",
                    "word-wrap:normal"
                ];
                /* eslint-enable array-element-newline */
                return props.join("");
            }());

            /**
             * Create and append div with CSS-hyphenated word
             * @param {string} lang Language
             * @returns {undefined}
             */
            function create(lang) {
                /* eslint-disable security/detect-object-injection */
                if (H.clientFeat.langs[lang]) {
                    return;
                }
                /* eslint-enable security/detect-object-injection */
                fakeBody = fakeBody || d.createElement("body");
                const testDiv = d.createElement("div");
                testDiv.lang = lang;
                testDiv.id = lang;
                testDiv.style.cssText = css;
                testDiv.appendChild(d.createTextNode(H.lcRequire.get(lang)));
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

            /**
             * Remove fakeBody
             * @returns {undefined}
             */
            function clear() {
                if (fakeBody) {
                    fakeBody.parentNode.removeChild(fakeBody);
                }
            }
            return {
                "append": append,
                "clear": clear,
                "create": create
            };
        }());

        /**
         * Checks if hyphens (ev.prefixed) is set to auto for the element.
         * @param {Object} elm - the element
         * @returns {Boolean} result of the check
         */
        function checkCSSHyphensSupport(elm) {
            return (
                elm.style.hyphens === "auto" ||
                elm.style.webkitHyphens === "auto" ||
                elm.style.msHyphens === "auto" ||
                elm.style["-moz-hyphens"] === "auto"
            );
        }

        /**
         * Expose the hyphenate-function of a specific language to
         * Hyphenopoly.hyphenators.<language>
         *
         * Hyphenopoly.hyphenators.<language> is a Promise that fullfills
         * to hyphenate(entity, sel) as soon as the ressources are loaded
         * and the engine is ready.
         * If Promises aren't supported (e.g. IE11) a error message is produced.
         *
         * @param {string} lang - the language
         * @returns {undefined}
         */
        function exposeHyphenateFunction(lang) {
            /* eslint-disable security/detect-object-injection */
            H.hyphenators = H.hyphenators || empty();
            if (!H.hyphenators[lang]) {
                if (window.Promise) {
                    H.hyphenators[lang] = new Promise(function pro(rs, rj) {
                        H.events.addListener("engineReady", function handler(e) {
                            if (e.msg === lang) {
                                rs(H.createHyphenator(e.msg));
                            }
                        }, true);
                        H.events.addListener("error", function handler(e) {
                            if (e.key === lang || e.key === "hyphenEngine") {
                                rj(e.msg);
                            }
                        }, true);
                    });
                } else {
                    H.hyphenators[lang] = {

                        /**
                         * Fires an error message, if then is called
                         * @returns {undefined}
                         */
                        "then": function () {
                            H.events.dispatch(
                                "error",
                                {"msg": "Promises not supported in this engine. Use a polyfill (e.g. https://github.com/taylorhakes/promise-polyfill)!"}
                            );
                        }
                    };
                }
            }
            /* eslint-enable security/detect-object-injection */
        }

        /**
         * Load all ressources for a required <lang>, check if wasm is supported
         * and expose the hyphenate function.
         * @param {string} lang The language
         * @returns {undefined}
         */
        function loadRessources(lang) {
            let filename = lang + ".hpb";
            if (H.lcFallbacks && H.lcFallbacks.has(lang)) {
                filename = H.lcFallbacks.get(lang) + ".hpb";
            }
            H.binaries = H.binaries || new Map();
            featureTestWasm();
            scriptLoader(H.dfltPaths.maindir, "Hyphenopoly.js");
            if (H.clientFeat.wasm) {
                binLoader(
                    H.dfltPaths.maindir,
                    "hyphenEngine.wasm",
                    "hyphenEngine",
                    ["engineLoaded", "wasm"]
                );
            } else {
                scriptLoader(H.dfltPaths.maindir, "hyphenEngine.asm.js");
            }
            binLoader(H.dfltPaths.patterndir, filename, lang, ["hpbLoaded", lang]);
            allocateMemory(lang);
            exposeHyphenateFunction(lang);
        }
        H.lcRequire.forEach(function eachReq(value, lang) {
            /* eslint-disable security/detect-object-injection */
            if (value === "FORCEHYPHENOPOLY") {
                H.clientFeat.polyfill = true;
                H.clientFeat.langs[lang] = "H9Y";
                loadRessources(lang);
            } else if (
                H.clientFeat.langs[lang] &&
                H.clientFeat.langs[lang] === "H9Y"
            ) {
                loadRessources(lang);
            } else {
                tester.create(lang);
            }
            /* eslint-enable security/detect-object-injection */
        });
        const testContainer = tester.append(d.documentElement);
        if (testContainer !== null) {
            H.lcRequire.forEach(function eachReq(value, lang) {
                if (value !== "FORCEHYPHENOPOLY") {
                    const el = d.getElementById(lang);
                    /* eslint-disable security/detect-object-injection */
                    if (checkCSSHyphensSupport(el) && el.offsetHeight > 12) {
                        H.clientFeat.langs[lang] = "CSS";
                    } else {
                        H.clientFeat.polyfill = true;
                        H.clientFeat.langs[lang] = "H9Y";
                        loadRessources(lang);
                    }
                    /* eslint-enable security/detect-object-injection */
                }
            });
            tester.clear();
        }
    }());

    /**
     * Hides the specified elements and starts the process by
     * dispatching a "contentLoaded"-event in Hyphenopoly
     * @returns {undefined}
     */
    function handleDCL() {
        if (H.setup.hide.match(/^(element|text)$/)) {
            H.toggle("off");
        }
        H.events.dispatch(
            "contentLoaded",
            {"msg": ["contentLoaded"]}
        );
    }

    if (H.clientFeat.polyfill) {
        if (H.setup.hide === "all") {
            H.toggle("off");
        }
        if (H.setup.hide !== "none") {
            H.setup.timeOutHandler = window.setTimeout(function timedOut() {
                H.toggle("on");
                H.events.dispatch("timeout", {"delay": H.setup.timeout});
            }, H.setup.timeout);
        }
        if (d.readyState === "loading") {
            d.addEventListener(
                "DOMContentLoaded",
                handleDCL,
                {
                    "once": true,
                    "passive": true
                }
            );
        } else {
            handleDCL();
        }
    } else {
        window.Hyphenopoly = null;
    }

    if (H.cacheFeatureTests) {
        sessionStorage.setItem(
            "Hyphenopoly_Loader",
            JSON.stringify(H.clientFeat)
        );
    }
}());
