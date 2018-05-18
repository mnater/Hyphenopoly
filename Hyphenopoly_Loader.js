/*
 * @license Hyphenopoly_Loader 1.0.0 - client side hyphenation for webbrowsers
 *  ©2018  Mathias Nater, Zürich (mathiasnater at gmail dot com)
 *  https://github.com/mnater/Hyphenopoly
 *
 *  Released under the MIT license
 *  http://mnater.github.io/Hyphenopoly/LICENSE
 */

(function H9YL() {
    "use strict";
    const d = document;
    const H = Hyphenopoly;

    /**
     * Polyfill Math.log2
     * @param {number} x argument
     * @return {number} Log2(x)
     */
    Math.log2 = Math.log2 || function polyfillLog2(x) {
        return Math.log(x) * Math.LOG2E;
    };

    /**
     * Create Object without standard Object-prototype
     * @returns {Object} empty object
     */
    function empty() {
        return Object.create(null);
    }

    (function setupEvents() {
        // Events known to the system
        const definedEvents = empty();
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
            definedEvents[name] = {
                "cancellable": cancellable,
                "default": defFunc,
                "register": []
            };
        }

        define(
            "timeout",
            function def(e) {
                d.documentElement.style.visibility = "visible";
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
            if (!data) {
                data = empty();
            }
            data.defaultPrevented = false;
            data.preventDefault = function preventDefault() {
                if (definedEvents[name].cancellable) {
                    data.defaultPrevented = true;
                }
            };
            definedEvents[name].register.forEach(function call(currentHandler) {
                currentHandler(data);
            });
            if (!data.defaultPrevented && definedEvents[name].default) {
                definedEvents[name].default(data);
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
            if (definedEvents[name]) {
                definedEvents[name].register.push(handler);
            } else if (defer) {
                tempRegister.push({
                    "handler": handler,
                    "name": name
                });
            } else {
                H.events.dispatch(
                    "error",
                    {"msg": `unknown Event "${name}" discarded`}
                );
            }
        }

        if (H.handleEvent) {
            Object.keys(H.handleEvent).forEach(function add(name) {
                addListener(name, H.handleEvent[name], true);
            });
        }

        H.events = empty();
        H.events.deferred = deferred;
        H.events.tempRegister = tempRegister;
        H.events.dispatch = dispatch;
        H.events.define = define;
        H.events.addListener = addListener;
    }());

    /* eslint-disable max-len, no-magic-numbers, no-prototype-builtins */
    /*
     * Normal wasm feature-test:
     * const isWASMsupported = (function featureTestWASM() {
     *      if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
     *          const module = new WebAssembly.Module(Uint8Array.from([0, 97, 115, 109, 1, 0, 0, 0]));
     *          if (WebAssembly.Module.prototype.isPrototypeOf(module)) {
     *              return WebAssembly.Instance.prototype.isPrototypeOf(new WebAssembly.Instance(module));
     *          }
     *      }
     *      return false;
     *  }());
     */


    // Wasm feature test with iOS bug detection (https://bugs.webkit.org/show_bug.cgi?id=181781)
    const isWASMsupported = (function featureTestWASM() {
        if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
            const module = new WebAssembly.Module(Uint8Array.from([0, 97, 115, 109, 1, 0, 0, 0, 1, 6, 1, 96, 1, 127, 1, 127, 3, 2, 1, 0, 5, 3, 1, 0, 1, 7, 8, 1, 4, 116, 101, 115, 116, 0, 0, 10, 16, 1, 14, 0, 32, 0, 65, 1, 54, 2, 0, 32, 0, 40, 2, 0, 11]));
            if (WebAssembly.Module.prototype.isPrototypeOf(module)) {
                const inst = new WebAssembly.Instance(module);
                return WebAssembly.Instance.prototype.isPrototypeOf(inst) && (inst.exports.test(4) !== 0);
            }
        }
        return false;
    }());
    /* eslint-enable max-len, no-magic-numbers, no-prototype-builtins */

    const scriptLoader = (function scriptLoader() {
        const loadedScripts = empty();

        /**
         * Load script by adding <script>-tag
         * @param {string} path Where the script is stored
         * @param {string} filename Filename of the script
         * @returns {undefined}
         */
        function loadScript(path, filename) {
            if (!loadedScripts[filename]) {
                const script = d.createElement("script");
                loadedScripts[filename] = true;
                script.src = path + filename;
                if (filename === "hyphenEngine.asm.js") {
                    script.addEventListener("load", function listener() {
                        H.events.dispatch("engineLoaded", {"msg": "asm"});
                    });
                }
                d.head.appendChild(script);
            }
        }
        return loadScript;
    }());

    const binLoader = (function binLoader() {
        const loadedBins = empty();

        /**
         * Get bin file using fetch
         * @param {string} path Where the script is stored
         * @param {string} fne Filename of the script with extension
         * @param {Object} msg Message
         * @returns {undefined}
         */
        function fetchBinary(path, fne, msg) {
            if (!loadedBins[fne]) {
                loadedBins[fne] = true;
                fetch(path + fne).then(
                    function then(response) {
                        if (response.ok) {
                            const name = fne.slice(0, fne.lastIndexOf("."));
                            if (name === "hyphenEngine") {
                                H.binaries[name] = response.arrayBuffer().then(
                                    function getModule(buf) {
                                        return new WebAssembly.Module(buf);
                                    }
                                );
                            } else {
                                H.binaries[name] = response.arrayBuffer();
                            }
                            H.events.dispatch(msg[0], {"msg": msg[1]});
                        }
                    }
                );
            }
        }

        /**
         * Get bin file using XHR
         * @param {string} path Where the script is stored
         * @param {string} fne Filename of the script with extension
         * @param {Object} msg Message
         * @returns {undefined}
         */
        function requestBinary(path, fne, msg) {
            if (!loadedBins[fne]) {
                loadedBins[fne] = true;
                const xhr = new XMLHttpRequest();
                xhr.open("GET", path + fne);
                xhr.onload = function onload() {
                    const name = fne.slice(0, fne.lastIndexOf("."));
                    H.binaries[name] = xhr.response;
                    H.events.dispatch(msg[0], {"msg": msg[1]});
                };
                xhr.responseType = "arraybuffer";
                xhr.send();
            }
        }

        return (isWASMsupported)
            ? fetchBinary
            : requestBinary;
    }());

    /**
     * Allocate memory for (w)asm
     * @param {string} lang Language
     * @returns {undefined}
     */
    function allocateMemory(lang) {
        let wasmPages = 0;
        switch (lang) {
        case "nl":
            wasmPages = 41;
            break;
        case "de":
            wasmPages = 75;
            break;
        case "nb-no":
            wasmPages = 92;
            break;
        case "hu":
            wasmPages = 207;
            break;
        default:
            wasmPages = 32;
        }
        if (!H.specMems) {
            H.specMems = empty();
        }
        if (isWASMsupported) {
            H.specMems[lang] = new WebAssembly.Memory({
                "initial": wasmPages,
                "maximum": 256
            });
        } else {
            /* eslint-disable no-bitwise */
            const asmPages = (2 << Math.floor(Math.log2(wasmPages))) * 65536;
            /* eslint-enable no-bitwise */
            H.specMems[lang] = new ArrayBuffer(asmPages);
        }
    }

    /**
     * Make feature tests
     * @returns {undefined}
     */
    function makeTests() {
        const results = {
            "languages": empty(),
            "needsPolyfill": false
        };

        const tester = (function tester() {
            let fakeBody = null;

            /**
             * Create and append div with CSS-hyphenated word
             * @param {string} lang Language
             * @returns {undefined}
             */
            function createTest(lang) {
                if (!fakeBody) {
                    fakeBody = d.createElement("body");
                }
                const testDiv = d.createElement("div");
                testDiv.lang = lang;
                testDiv.id = lang;
                testDiv.style.cssText = "visibility:hidden;-moz-hyphens:auto;-webkit-hyphens:auto;-ms-hyphens:auto;hyphens:auto;width:48px;font-size:12px;line-height:12px;boder:none;padding:0;word-wrap:normal";
                testDiv.appendChild(d.createTextNode(H.require[lang]));
                fakeBody.appendChild(testDiv);
            }

            /**
             * Append fakeBody with tests to target (document)
             * @param {Object} target Where to append fakeBody
             * @returns {undefined}
             */
            function appendTests(target) {
                if (fakeBody) {
                    target.appendChild(fakeBody);
                }
            }

            /**
             * Remove fakeBody
             * @returns {undefined}
             */
            function clearTests() {
                if (fakeBody) {
                    fakeBody.parentNode.removeChild(fakeBody);
                }
            }
            return {
                "appendTests": appendTests,
                "clearTests": clearTests,
                "createTest": createTest
            };
        }());

        /**
         * Load all ressources for a required <lang>
         * @param {string} lang The language
         * @returns {undefined}
         */
        function loadRessources(lang) {
            scriptLoader(H.paths.maindir, "Hyphenopoly.js");
            if (isWASMsupported) {
                binLoader(
                    H.paths.maindir,
                    "hyphenEngine.wasm",
                    ["engineLoaded", "wasm"]
                );
            } else {
                scriptLoader(H.paths.maindir, "hyphenEngine.asm.js");
            }
            binLoader(H.paths.patterndir, `${lang}.hpb`, ["hpbLoaded", lang]);
            allocateMemory(lang);
        }

        Object.keys(H.require).forEach(function doReqLangs(lang) {
            if (H.require[lang] === "FORCEHYPHENOPOLY") {
                results.needsPolyfill = true;
                results.languages[lang] = "H9Y";
                loadRessources(lang);
            } else {
                tester.createTest(lang);
            }
        });
        tester.appendTests(d.documentElement);
        Object.keys(H.require).forEach(function checkReqLangs(lang) {
            if (H.require[lang] !== "FORCEHYPHENOPOLY") {
                const el = d.getElementById(lang);
                if (window.getComputedStyle(el).hyphens === "auto" &&
                    el.offsetHeight > 12) {
                    results.needsPolyfill = results.needsPolyfill || false;
                    results.languages[lang] = "CSS";
                } else {
                    results.needsPolyfill = true;
                    results.languages[lang] = "H9Y";
                    loadRessources(lang);
                }
            }
        });
        tester.clearTests();
        return results;
    }

    (function run() {
        // Set defaults for paths and setup
        if (H.paths) {
            if (!H.paths.patterndir) {
                H.paths.patterndir = "../patterns/";
            }
            if (!H.paths.maindir) {
                H.paths.patterndir = "../";
            }
        } else {
            H.paths = {
                "maindir": "../",
                "patterndir": "../patterns/"
            };
        }
        if (H.setup) {
            if (!H.setup.classnames) {
                H.setup.classnames = {"hyphenate": {}};
            }
            if (!H.setup.timeout) {
                H.setup.timeout = 1000;
            }
        } else {
            H.setup = {
                "classnames": {"hyphenate": {}},
                "timeout": 1000
            };
        }
        H.isWASMsupported = isWASMsupported;
        H.binaries = empty();
        H.testResults = makeTests();
        if (H.testResults.needsPolyfill) {
            d.documentElement.style.visibility = "hidden";

            H.setup.timeOutHandler = window.setTimeout(function timedOut() {
                d.documentElement.style.visibility = "visible";
                H.events.dispatch("timeout", {"delay": H.setup.timeout});
            }, H.setup.timeout);
            d.addEventListener(
                "DOMContentLoaded",
                function DCL() {
                    H.events.dispatch("contentLoaded", {"msg": ["contentLoaded"]});
                },
                {
                    "once": true,
                    "passive": true
                }
            );
        } else {
            window.Hyphenopoly = null;
        }
    }());
}());
