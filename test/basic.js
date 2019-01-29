/* eslint-env node */
/* eslint global-require: 0, func-names: 0, no-shadow: 0 */
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
