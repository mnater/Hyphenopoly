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
    var scriptPath = (function () {
        if (document.currentScript) {
            var src = document.currentScript.src;
            return src.substring(0, src.lastIndexOf("/") + 1);
        }
    }());

    var loadScriptList = {};

    function loadScript(path, filename, msg) {
        var script = d.createElement("script");
        var H = Hyphenopoly;
        if (loadScriptList[filename]) {
            return;
        }
        loadScriptList[filename] = true;
        script.src = path + filename;
        script.type = "text/javascript";
        script.addEventListener("load", function () {
            H.evt(msg);
        });
        d.getElementsByTagName('head')[0].appendChild(script);
    }

    function makeTests() {
        var needsPolyfill = false;
        var languages = {};
        var fakeBody = d.createElement("body");

        function createTest(lang) {
            if (Hyphenopoly.require[lang] === "FORCEHYPHENOPOLY") {
                return;
            }
            var testDiv = d.createElement("div");
            var s = testDiv.style;
            testDiv.lang = lang;
            testDiv.id = lang;
            s.visibility = "hidden";
            s.MozHyphens = "auto";
            s["-webkit-hyphens"] = "auto";
            s["-ms-hyphens"] = "auto";
            s.hyphens = "auto";
            s.width = "48px";
            s.fontSize = "12px";
            s.lineHeight = "12px";
            s.border = "none";
            s.padding = "0";
            s.wordWrap = "normal";
            testDiv.appendChild(d.createTextNode(Hyphenopoly.require[lang]));
            fakeBody.appendChild(testDiv);
        }

        Object.keys(Hyphenopoly.require).forEach(createTest);

        d.documentElement.appendChild(fakeBody);

        Object.keys(Hyphenopoly.require).forEach(function measure(lang) {
            if (Hyphenopoly.require[lang] === "FORCEHYPHENOPOLY") {
                needsPolyfill = needsPolyfill || true;
                languages[lang] = "H9Y";
                loadScript(scriptPath, "Hyphenopoly.js", ["void"]);
                loadScript(scriptPath + "patterns/", lang + ".js", ["loaded", lang]);
            } else {
                if (d.getElementById(lang).offsetHeight > 12) {
                    needsPolyfill = needsPolyfill || false;
                    languages[lang] = "CSS";
                } else {
                    needsPolyfill = needsPolyfill || true;
                    languages[lang] = "H9Y";
                    loadScript(scriptPath, "Hyphenopoly.js", ["void"]);
                    loadScript(scriptPath + "patterns/", lang + ".js", ["loaded", lang]);
                }
            }
        });

        fakeBody.parentNode.removeChild(fakeBody);
        return {
            needsPolyfill: needsPolyfill,
            languages: languages
        };
    }

    function run() {
        var result = makeTests();
        var H = Hyphenopoly;
        if (!H.hasOwnProperty("timeout")) {
            H.timeout = 1000;
        }
        if (!H.hasOwnProperty("onTimeOut")) {
            H.onTimeOut = function () {
                window.console.warn("Hyphenopoly timed out after " + H.timeout + "ms");
            };
        }
        if (result.needsPolyfill) {
            d.firstElementChild.style.visibility = "hidden";

            H.timeOutHandler = window.setTimeout(function () {
                d.firstElementChild.style.visibility = "visible";
                H.onTimeOut();
            }, H.timeout);

            H.testResults = result;
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