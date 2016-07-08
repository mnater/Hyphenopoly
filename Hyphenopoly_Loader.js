/** @license Hyphenopoly_Loader 0.1(beta) - client side hyphenation for webbrowsers
 *  ©2016  Mathias Nater, Zürich (mathiasnater at gmail dot com)
 *  https://github.com/mnater/Hyphenopoly
 *
 *  Released under the MIT license
 *  http://mnater.github.io/Hyphenopoly/LICENSE.txt
 */
/*jslint browser*/
/*global window, Hyphenopoly*/

(function H9YL() {
    "use strict";
    var d = document;

    function scriptLoader(loadTarget, messageTarget) {
        var loadedScripts = {};
        return function loadScript(path, filename, msg) {
            var script;
            if (!loadedScripts[filename]) {
                script = loadTarget.createElement("script");
                loadedScripts[filename] = true;
                script.src = path + filename;
                script.addEventListener("load", function () {
                    messageTarget.evt(msg);
                });
                loadTarget.head.appendChild(script);
                //loadTarget.getElementsByTagName("head")[0].appendChild(script);
            }
        };
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
                if (!!fakeBody) {
                    target.appendChild(fakeBody);
                }
            }
            function clearTests() {
                if (!!fakeBody) {
                    fakeBody.parentNode.removeChild(fakeBody);
                }
            }
            return {
                createTest: createTest,
                appendTests: appendTests,
                clearTests: clearTests
            };
        }());

        var myScriptLoader;
        function loadBothScripts(lang) {
            if (!myScriptLoader) {
                myScriptLoader = scriptLoader(document, Hyphenopoly);
            }
            myScriptLoader(Hyphenopoly.paths.maindir, "Hyphenopoly.js", ["void"]);
            myScriptLoader(Hyphenopoly.paths.patterndir, lang + ".js", ["loaded", lang]);
        }

        Object.keys(Hyphenopoly.require).forEach(function (lang) {
            if (Hyphenopoly.require[lang] === "FORCEHYPHENOPOLY") {
                results.needsPolyfill = true;
                results.languages[lang] = "H9Y";
                loadBothScripts(lang);
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
                    loadBothScripts(lang);
                }
            }
        });
        tester.clearTests();
        return results;
    }

    function run() {
        var H = Hyphenopoly;
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
            H.languages = {};
            H.evtList = [];
            H.evt = function (m) {
                H.evtList.push(m);
            };
            d.addEventListener("DOMContentLoaded", function DCL() {
                H.evt(["DOMContentLoaded"]);
            });

        } else {
            window.Hyphenopoly = null;
        }
    }

    run();

}());