/* eslint-env node */
/* eslint global-require: 0, func-names: 0, no-shadow: 0 */
/* eslint-disable prefer-arrow-callback */
"use strict";
const t = require("tap");

let H9Y = null;
t.beforeEach(function setup(done) {
    H9Y = require("../hyphenopoly.module");
    done();
});

t.afterEach(function tearDown(done) {
    H9Y = null;
    delete require.cache[require.resolve("../hyphenopoly.module")];
    done();
});

t.test("run config with one language", async function (t) {
    const deHyphenator = await H9Y.config({"require": ["de"]});
    t.test("return a function", function (t) {
        t.equal(typeof deHyphenator, "function", typeof deHyphenator);
        t.end();
    });
    t.test("hyphenate one word", function (t) {
        t.equal(deHyphenator("Silbentrennung"), "Sil\u00ADben\u00ADtren\u00ADnung", deHyphenator("Silbentrennung"));
        t.end();
    });
    t.test("hyphenate two words", function (t) {
        t.equal(deHyphenator("Silbentrennung Algorithmus"), "Sil\u00ADben\u00ADtren\u00ADnung Al\u00ADgo\u00ADrith\u00ADmus", deHyphenator("Silbentrennung Algorithmus"));
        t.end();
    });
    t.end();
});

t.test("substitue characters", async function (t) {
    const deHyphenator = await H9Y.config({
        "require": ["de"],
        "substitute": {
            "de": {
                "å": "a"
            }
        }
    });
    t.test("hyphenate ångström", function (t) {
        t.equal(deHyphenator("ångström"), "ångst\u00ADröm", deHyphenator("ångström"));
        t.end();
    });
    t.end();
});

t.test("substitue characters unicase", async function (t) {
    const deHyphenator = await H9Y.config({
        "require": ["en-us"],
        "substitute": {
            "en-us": {
                "0": "o",
                "1": "l",
                "3": "e",
                "4": "a",
                "5": "s",
                "7": "t",
                "8": "b"
            }
        }
    });
    t.test("hyphenate 1337speak", function (t) {
        t.equal(deHyphenator("48501u73"), "48\u00AD501u73", deHyphenator("48501u73"));
        t.end();
    });
    t.end();
});

t.test("try to hyphenate a word outside alphabet", async function (t) {
    const deHyphenator = await H9Y.config({"require": ["de"]});
    t.test("hyphenate ångström", function (t) {
        t.equal(deHyphenator("ångström"), "ångström", deHyphenator("ångström"));
        t.end();
    });
    t.end();
});

t.test("force .wasm.hyphenate to return 0", async function (t) {
    const deHyphenator = await H9Y.config({"require": ["de"]});
    // eslint-disable-next-line prefer-regex-literals
    H9Y.languages.get("de").reNotAlphabet = RegExp("[^abcdefghijklmnopqrstuvwxyzåäöüßſ‌-]", "gi");
    t.test("hyphenate ångström", function (t) {
        t.equal(deHyphenator("ångström"), "ångström", deHyphenator("ångström"));
        t.end();
    });
    t.end();
});

t.test("disable Webassembly.Globals", async function (t) {
    const wag = WebAssembly.Global;
    WebAssembly.Global = null;
    const deHyphenator = await H9Y.config({"require": ["de"]});
    t.test("hyphenate one word with Globals disabled", function (t) {
        t.equal(deHyphenator("Silbentrennung"), "Sil\u00ADben\u00ADtren\u00ADnung", deHyphenator("Silbentrennung"));
        t.end();
        WebAssembly.Global = wag;
    });
    t.end();
});

t.test("run config with two languages", async function (t) {
    const hyphenators = await H9Y.config({"require": ["de", "en-us"]});
    t.test("return a Map", function (t) {
        t.type(hyphenators, Map);
        t.end();
    });
    t.test("get the hyphenator function promise for a language", function (t) {
        const deHyphenator = hyphenators.get("de");
        t.type(deHyphenator, Promise);
        t.end();
    });
    t.test("get the hyphenator function for a language", async function (t) {
        const deHyphenator = await hyphenators.get("de");
        t.type(deHyphenator, Function);
        t.end();
    });
    t.test("hyphenate one word of the first language", async function (t) {
        const deHyphenator = await hyphenators.get("de");
        t.equal(deHyphenator("Silbentrennung"), "Sil\u00ADben\u00ADtren\u00ADnung", deHyphenator("Silbentrennung"));
        t.end();
    });
    t.test("hyphenate two words of the first language", async function (t) {
        const deHyphenator = await hyphenators.get("de");
        t.equal(deHyphenator("Silbentrennung Algorithmus"), "Sil\u00ADben\u00ADtren\u00ADnung Al\u00ADgo\u00ADrith\u00ADmus", deHyphenator("Silbentrennung Algorithmus"));
        t.end();
    });
    t.test("hyphenate one word of the second language", async function (t) {
        const enHyphenator = await hyphenators.get("en-us");
        t.equal(enHyphenator("hyphenation"), "hy\u00ADphen\u00ADation", enHyphenator("hyphenation"));
        t.end();
    });
    t.test("hyphenate two words of the second language", async function (t) {
        const deHyphenator = await hyphenators.get("en-us");
        t.equal(deHyphenator("hyphenation algorithm"), "hy\u00ADphen\u00ADation al\u00ADgo\u00ADrithm", deHyphenator("hyphenation algorithm"));
        t.end();
    });
    t.end();
});

t.test("run config with two same languages", async function (t) {
    const deHyphenator2 = await H9Y.config({"require": ["de", "de"]});
    t.test("return a function", function (t) {
        t.equal(typeof deHyphenator2, "function", typeof deHyphenator2);
        t.end();
    });
    t.test("hyphenate one word", function (t) {
        t.equal(deHyphenator2("Silbentrennung"), "Sil\u00ADben\u00ADtren\u00ADnung", deHyphenator2("Silbentrennung"));
        t.end();
    });
    t.test("hyphenate two words", function (t) {
        t.equal(deHyphenator2("Silbentrennung Algorithmus"), "Sil\u00ADben\u00ADtren\u00ADnung Al\u00ADgo\u00ADrith\u00ADmus", deHyphenator2("Silbentrennung Algorithmus"));
        t.end();
    });
    t.end();
});

t.test("execute synchronically with one language", function (t) {
    const deHyphenator = H9Y.config({
        "require": ["de"],
        "sync": true
    });
    t.test("return a function", function (t) {
        t.equal(typeof deHyphenator, "function", typeof deHyphenator);
        t.end();
    });
    t.test("hyphenate one word", function (t) {
        t.equal(deHyphenator("Silbentrennung"), "Sil\u00ADben\u00ADtren\u00ADnung", deHyphenator("Silbentrennung"));
        t.end();
    });
    t.test("hyphenate two words", function (t) {
        t.equal(deHyphenator("Silbentrennung Algorithmus"), "Sil\u00ADben\u00ADtren\u00ADnung Al\u00ADgo\u00ADrith\u00ADmus", deHyphenator("Silbentrennung Algorithmus"));
        t.end();
    });
    t.end();
});

t.test("execute synchronically with two languages", function (t) {
    const hyphenators = H9Y.config({
        "require": ["de", "en-us"],
        "sync": true
    });
    t.test("return a Map", function (t) {
        t.type(hyphenators, Map);
        t.end();
    });
    t.test("get the hyphenator function for a language", function (t) {
        const deHyphenator = hyphenators.get("de");
        t.type(deHyphenator, Function);
        t.end();
    });
    t.test("hyphenate one word of the first language", function (t) {
        const deHyphenator = hyphenators.get("de");
        t.equal(deHyphenator("Silbentrennung"), "Sil\u00ADben\u00ADtren\u00ADnung", deHyphenator("Silbentrennung"));
        t.end();
    });
    t.end();
});
