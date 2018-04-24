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
    var d = document;

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

    //wasm feature test with iOS bug detection
    const isWASMsupported = !(function featureTestWASM() {
        if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
            const module = new WebAssembly.Module(Uint8Array.from([0, 97, 115, 109, 1, 0, 0, 0, 1, 6, 1, 96, 1, 127, 1, 127, 3, 2, 1, 0, 5, 3, 1, 0, 1, 7, 8, 1, 4, 116, 101, 115, 116, 0, 0, 10, 16, 1, 14, 0, 32, 0, 65, 1, 54, 2, 0, 32, 0, 40, 2, 0, 11]));
            if (WebAssembly.Module.prototype.isPrototypeOf(module)) {
                const inst = new WebAssembly.Instance(module);
                return WebAssembly.Instance.prototype.isPrototypeOf(inst) && (inst.exports.test(4) !== 0);
            }
        }
        return false;
    }());


    var scriptLoader = (function () {
        var loadedScripts = {};
        function loadScript(path, filename, msg) {
            var script;
            if (!loadedScripts[filename]) {
                script = d.createElement("script");
                loadedScripts[filename] = true;
                script.src = path + filename;
                script.addEventListener("load", function () {
                    Hyphenopoly.evt(msg);
                });
                d.head.appendChild(script);
            }
        }
        return loadScript;
    }());

    var assetLoader = (function () {
        var loadedAssets = {};

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
                            Hyphenopoly.evt(msg);
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
                Hyphenopoly.evt(msg);
            };
            xhr.responseType = "arraybuffer";
            xhr.send();
        }
        return (isWASMsupported)
            ? fetchBinary
            : requestBinary;
    }());

    function allocateSpeculativeMemory(lang) {
        var wasmPages = 0;
        var asmSize = 0;
        switch (lang) {
        case "nl":
            wasmPages = 43;
            asmSize = 64;
            break;
        case "de":
            wasmPages = 77;
            asmSize = 128;
            break;
        case "nb-no":
            wasmPages = 94;
            asmSize = 128;
            break;
        case "hu":
            wasmPages = 209;
            asmSize = 256;
            break;
        default:
            wasmPages = 32;
            asmSize = 32;
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
            Hyphenopoly.specMems[lang] = new ArrayBuffer(asmSize * 64 * 1024);
        }
    }

    function makeTests() {
        var results = {
            needsPolyfill: false,
            languages: {}
        };

        var tester = (function () {
            var fakeBody;
            function createTest(lang) {
                if (!fakeBody) {
                    fakeBody = d.createElement("body");
                }
                var testDiv = d.createElement("div");
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
            scriptLoader(Hyphenopoly.paths.maindir, "Hyphenopoly.js", ["Hyphenopoly loaded"]);
            if (isWASMsupported) {
                assetLoader(Hyphenopoly.paths.maindir, "hyphenEngine.wasm", "hyphenEngine", ["engineLoaded", "wasm"]);
            } else {
                scriptLoader(Hyphenopoly.paths.maindir, "hyphenEngine.asm.js", ["engineLoaded", "asm"]);
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
        var H = Hyphenopoly;
        H.isWASMsupported = isWASMsupported;
        H.assets = {};
        H.evtList = [];
        H.evt = function (m) {
            H.evtList.push(m);
        };
        H.testResults = makeTests();
        if (!H.setup.hasOwnProperty("timeout")) {
            H.setup.timeout = 1000;
        }
        if (!H.setup.hasOwnProperty("onTimeOut")) {
            H.setup.onTimeOut = function () {
                window.console.warn("Hyphenopolys 'flash of unhyphenated content'-prevention timed out after " + H.setup.timeout + "ms");
            };
        }
        if (H.testResults.needsPolyfill) {
            d.documentElement.style.visibility = "hidden";

            H.setup.timeOutHandler = window.setTimeout(function () {
                d.documentElement.style.visibility = "visible";
                H.setup.onTimeOut();
            }, H.setup.timeout);
            d.addEventListener(
                "DOMContentLoaded",
                function DCL() {
                    H.evt(["DOMContentLoaded"]);
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