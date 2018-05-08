/** @license Hyphenopoly_Loader 0.2(beta) - client side hyphenation for webbrowsers
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

    Math.log2 = Math.log2 || function(x) {
        return Math.log(x) * Math.LOG2E;
    };

    (function createEventSystem() {
        const definedEvents = Object.create(null);
        Hyphenopoly.events = Object.create(null);
        Hyphenopoly.events.notHandled = [];
        Hyphenopoly.events.tempRegister = [];

        function defineEvent(name, defFunc, cancellable) {
            definedEvents[name] = {
                default: defFunc,
                cancellable: cancellable,
                register: []
            };
        }

        defineEvent(
            "timeout",
            function (e) {
                d.documentElement.style.visibility = "visible";
                window.console.info("Hyphenopolys 'flash of unhyphenated content'-prevention timed out after %dms", e.delay);
            },
            false
        );

        defineEvent(
            "error",
            function (e) {
                window.console.error(e.msg);
            },
            true
        );

        defineEvent(
            "contentLoaded",
            function (e) {
                Hyphenopoly.events.notHandled.push({
                    name: "contentLoaded",
                    data: e
                });
            },
            false
        );

        defineEvent(
            "engineLoaded",
            function (e) {
                Hyphenopoly.events.notHandled.push({
                    name: "engineLoaded",
                    data: e
                });
            },
            false
        );

        defineEvent(
            "hpbLoaded",
            function (e) {
                Hyphenopoly.events.notHandled.push({
                    name: "hpbLoaded",
                    data: e
                });
            },
            false
        );

        function dispatchEvent(name, data) {
            if (!data) {
                data = Object.create(null);
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

        function addEventListener(name, handler, final) {
            if (definedEvents[name]) {
                definedEvents[name].register.push(handler);
            } else if (!final) {
                Hyphenopoly.events.tempRegister.push({
                    name: name,
                    handler: handler
                });
            } else {
                Hyphenopoly.events.dispatch("error", {msg: "unknown Event \"" + name + "\" discarded"});
            }
        }

        if (Hyphenopoly.handleEvent) {
            Object.keys(Hyphenopoly.handleEvent).forEach(function (name) {
                addEventListener(name, Hyphenopoly.handleEvent[name]);
            });
        }

        Hyphenopoly.events.dispatch = dispatchEvent;
        Hyphenopoly.events.define = defineEvent;
        Hyphenopoly.events.addListener = addEventListener;

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
        const loadedScripts = {};
        function loadScript(path, filename) {
            if (!loadedScripts[filename]) {
                let script = d.createElement("script");
                loadedScripts[filename] = true;
                script.src = path + filename;
                if (filename === "hyphenEngine.asm.js") {
                    script.addEventListener("load", function () {
                        Hyphenopoly.events.dispatch("engineLoaded", {msg: "asm"});
                    });
                }
                d.head.appendChild(script);
            }
        }
        return loadScript;
    }());

    const assetLoader = (function () {
        const loadedAssets = {};

        function fetchBinary(path, filename, assetName, msg) {
            if (!loadedAssets[filename]) {
                loadedAssets[filename] = true;
                fetch(path + filename).then(
                    function (response) {
                        if (response.ok) {
                            if (assetName === "hyphenEngine") {
                                Hyphenopoly.assets[assetName] = response.arrayBuffer().then(
                                    function (buf) {
                                        return new WebAssembly.Module(buf);
                                    }
                                );
                            } else {
                                Hyphenopoly.assets[assetName] = response.arrayBuffer();
                            }
                            Hyphenopoly.events.dispatch(msg[0], {msg: msg[1]});
                        }
                    }
                );
            }
        }

        function requestBinary(path, filename, assetName, msg) {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", path + filename);
            xhr.onload = function () {
                Hyphenopoly.assets[assetName] = xhr.response;
                Hyphenopoly.events.dispatch(msg[0], {msg: msg[1]});
            };
            xhr.responseType = "arraybuffer";
            xhr.send();
        }
        return (isWASMsupported)
            ? fetchBinary
            : requestBinary;
    }());

    function allocateSpeculativeMemory(lang) {
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
        if (!Hyphenopoly.hasOwnProperty("specMems")) {
            Hyphenopoly.specMems = {};
        }
        if (isWASMsupported) {
            Hyphenopoly.specMems[lang] = new WebAssembly.Memory({
                initial: wasmPages,
                maximum: 256
            });
        } else {
            Hyphenopoly.specMems[lang] = new ArrayBuffer((2 << (Math.ceil(Math.log2(wasmPages)) - 1)) * 64 * 1024);
        }
    }

    function makeTests() {
        const results = {
            needsPolyfill: false,
            languages: {}
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
                testDiv.appendChild(d.createTextNode(Hyphenopoly.require[lang]));
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
            scriptLoader(Hyphenopoly.paths.maindir, "Hyphenopoly.js");
            if (isWASMsupported) {
                assetLoader(Hyphenopoly.paths.maindir, "hyphenEngine.wasm", "hyphenEngine", ["engineLoaded", "wasm"]);
            } else {
                scriptLoader(Hyphenopoly.paths.maindir, "hyphenEngine.asm.js");
            }
            assetLoader(Hyphenopoly.paths.patterndir, lang + ".hpb", lang, ["hpbLoaded", lang]);
            allocateSpeculativeMemory(lang);
        }

        Object.keys(Hyphenopoly.require).forEach(function (lang) {
            if (Hyphenopoly.require[lang] === "FORCEHYPHENOPOLY") {
                results.needsPolyfill = true;
                results.languages[lang] = "H9Y";
                loadRessources(lang);
            } else {
                tester.createTest(lang);
            }
        });
        tester.appendTests(d.documentElement);
        Object.keys(Hyphenopoly.require).forEach(function (lang) {
            if (Hyphenopoly.require[lang] !== "FORCEHYPHENOPOLY") {
                if (d.getElementById(lang).offsetHeight > 12) {
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

    function run() {
        const H = Hyphenopoly;
        H.isWASMsupported = isWASMsupported;
        H.assets = {};
        H.testResults = makeTests();
        if (!H.setup.hasOwnProperty("timeout")) {
            H.setup.timeout = 1000;
        }
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
    }

    run();

}());