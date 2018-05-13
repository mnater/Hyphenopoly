/** @license Hyphenopoly_Loader 1.0.1 - client side hyphenation for webbrowsers
 *  ©2018  Mathias Nater, Zürich (mathiasnater at gmail dot com)
 *  https://github.com/mnater/Hyphenopoly
 *
 *  Released under the MIT license
 *  http://mnater.github.io/Hyphenopoly/LICENSE
 */
/*jslint browser*/
/*global window, Hyphenopoly, fetch, WebAssembly*/

(function H9YL() {
    "use strict";
    const d = document;
    const H = Hyphenopoly;

    //polyfill Math.log2
    Math.log2 = Math.log2 || function (x) {
        return Math.log(x) * Math.LOG2E;
    };

    function empty() {
        return Object.create(null);
    }

    (function setupEvents() {
        //events known to the system
        const definedEvents = empty();
        //default events, execution deferred to Hyphenopoly.js
        const deferred = [];
        //register for custom event handlers, where event is not yet defined
        //these events will be correctly registered in Hyphenopoly.js
        const tempRegister = [];

        function define(name, defFunc, cancellable) {
            definedEvents[name] = {
                default: defFunc,
                cancellable: cancellable,
                register: []
            };
        }

        define(
            "timeout",
            function (e) {
                d.documentElement.style.visibility = "visible";
                window.console.info("Hyphenopolys 'flash of unhyphenated content'-prevention timed out after %dms", e.delay);
            },
            false
        );

        define(
            "error",
            function (e) {
                window.console.error(e.msg);
            },
            true
        );

        define(
            "contentLoaded",
            function (e) {
                deferred.push({
                    name: "contentLoaded",
                    data: e
                });
            },
            false
        );

        define(
            "engineLoaded",
            function (e) {
                deferred.push({
                    name: "engineLoaded",
                    data: e
                });
            },
            false
        );

        define(
            "hpbLoaded",
            function (e) {
                deferred.push({
                    name: "hpbLoaded",
                    data: e
                });
            },
            false
        );

        function dispatch(name, data) {
            if (!data) {
                data = empty();
            }
            data.defaultPrevented = false;
            data.preventDefault = function () {
                if (definedEvents[name].cancellable) {
                    data.defaultPrevented = true;
                }
            };
            definedEvents[name].register.forEach(function (currentHandler) {
                currentHandler(data);
            });
            if (!data.defaultPrevented && definedEvents[name].default) {
                definedEvents[name].default(data);
            }
        }

        function addListener(name, handler, final) {
            if (definedEvents[name]) {
                definedEvents[name].register.push(handler);
            } else if (!final) {
                tempRegister.push({
                    name: name,
                    handler: handler
                });
            } else {
                H.events.dispatch("error", {msg: "unknown Event \"" + name + "\" discarded"});
            }
        }

        if (H.handleEvent) {
            Object.keys(H.handleEvent).forEach(function (name) {
                addListener(name, H.handleEvent[name], false);
            });
        }

        H.events = empty();
        H.events.deferred = deferred;
        H.events.tempRegister = tempRegister;
        H.events.dispatch = dispatch;
        H.events.define = define;
        H.events.addListener = addListener;

    }());

    //normal wasm feature-test
    /*const isWASMsupported = (function featureTestWASM() {
        if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
            const module = new WebAssembly.Module(Uint8Array.from([0, 97, 115, 109, 1, 0, 0, 0]));
            if (WebAssembly.Module.prototype.isPrototypeOf(module)) {
                return WebAssembly.Instance.prototype.isPrototypeOf(new WebAssembly.Instance(module));
            }
        }
        return false;
    }());*/


    //wasm feature test with iOS bug detection (https://bugs.webkit.org/show_bug.cgi?id=181781)
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


    const scriptLoader = (function () {
        const loadedScripts = empty();
        function loadScript(path, filename) {
            if (!loadedScripts[filename]) {
                let script = d.createElement("script");
                loadedScripts[filename] = true;
                script.src = path + filename;
                if (filename === "hyphenEngine.asm.js") {
                    script.addEventListener("load", function () {
                        H.events.dispatch("engineLoaded", {msg: "asm"});
                    });
                }
                d.head.appendChild(script);
            }
        }
        return loadScript;
    }());

    const binLoader = (function () {
        const loadedBins = empty();

        function fetchBinary(path, filename, name, msg) {
            if (!loadedBins[filename]) {
                loadedBins[filename] = true;
                fetch(path + filename).then(
                    function (response) {
                        if (response.ok) {
                            if (name === "hyphenEngine") {
                                H.binaries[name] = response.arrayBuffer().then(
                                    function (buf) {
                                        return new WebAssembly.Module(buf);
                                    }
                                );
                            } else {
                                H.binaries[name] = response.arrayBuffer();
                            }
                            H.events.dispatch(msg[0], {msg: msg[1]});
                        }
                    }
                );
            }
        }

        function requestBinary(path, filename, name, msg) {
            if (!loadedBins[filename]) {
                loadedBins[filename] = true;
                const xhr = new XMLHttpRequest();
                xhr.open("GET", path + filename);
                xhr.onload = function () {
                    H.binaries[name] = xhr.response;
                    H.events.dispatch(msg[0], {msg: msg[1]});
                };
                xhr.responseType = "arraybuffer";
                xhr.send();
            }
        }

        return (isWASMsupported)
            ? fetchBinary
            : requestBinary;
    }());

    function allocateMemory(lang) {
        let wasmPages;
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
        if (!H.hasOwnProperty("specMems")) {
            H.specMems = empty();
        }
        if (isWASMsupported) {
            H.specMems[lang] = new WebAssembly.Memory({
                initial: wasmPages,
                maximum: 256
            });
        } else {
            H.specMems[lang] = new ArrayBuffer((2 << (Math.ceil(Math.log2(wasmPages)) - 1)) * 64 * 1024);
        }
    }

    function makeTests() {
        const results = {
            needsPolyfill: false,
            languages: empty()
        };

        const tester = (function () {
            let fakeBody;
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
            function appendTests(target) {
                if (fakeBody) {
                    target.appendChild(fakeBody);
                }
            }
            function clearTests() {
                if (fakeBody) {
                    fakeBody.parentNode.removeChild(fakeBody);
                }
            }
            return {
                createTest: createTest,
                appendTests: appendTests,
                clearTests: clearTests
            };
        }());

        function loadRessources(lang) {
            scriptLoader(H.paths.maindir, "Hyphenopoly.js");
            if (isWASMsupported) {
                binLoader(H.paths.maindir, "hyphenEngine.wasm", "hyphenEngine", ["engineLoaded", "wasm"]);
            } else {
                scriptLoader(H.paths.maindir, "hyphenEngine.asm.js");
            }
            binLoader(H.paths.patterndir, lang + ".hpb", lang, ["hpbLoaded", lang]);
            allocateMemory(lang);
        }

        Object.keys(H.require).forEach(function (lang) {
            if (H.require[lang] === "FORCEHYPHENOPOLY") {
                results.needsPolyfill = true;
                results.languages[lang] = "H9Y";
                loadRessources(lang);
            } else {
                tester.createTest(lang);
            }
        });
        tester.appendTests(d.documentElement);
        Object.keys(H.require).forEach(function (lang) {
            if (H.require[lang] !== "FORCEHYPHENOPOLY") {
                const el = d.getElementById(lang);
                if (window.getComputedStyle(el).hyphens === "auto" && el.offsetHeight > 12) {
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
        //set defaults for paths and setup
        if (!H.hasOwnProperty("paths")) {
            H.paths = {
                patterndir: "../patterns/",
                maindir: "../"
            };
        } else {
            if (!H.paths.hasOwnProperty("patterndir")) {
                H.paths.patterndir = "../patterns/";
            }
            if (!H.paths.hasOwnProperty("maindir")) {
                H.paths.patterndir = "../";
            }
        }
        if (!H.hasOwnProperty("setup")) {
            H.setup = {
                classnames: {
                    hyphenate: {}
                },
                timeout: 1000
            };
        } else {
            if (!H.setup.hasOwnProperty("classnames")) {
                H.setup.classnames = {
                    hyphenate: {}
                };
            }
            if (!H.setup.hasOwnProperty("timeout")) {
                H.setup.timeout = 1000;
            }
        }
        H.isWASMsupported = isWASMsupported;
        H.binaries = empty();
        H.testResults = makeTests();
        if (H.testResults.needsPolyfill) {
            d.documentElement.style.visibility = "hidden";

            H.setup.timeOutHandler = window.setTimeout(function () {
                d.documentElement.style.visibility = "visible";
                H.events.dispatch("timeout", {delay: H.setup.timeout});
            }, H.setup.timeout);
            d.addEventListener(
                "DOMContentLoaded",
                function DCL() {
                    H.events.dispatch("contentLoaded", {msg: ["contentLoaded"]});
                },
                {
                    passive: true,
                    once: true
                }
            );

        } else {
            window.Hyphenopoly = null;
        }
    }());

}());