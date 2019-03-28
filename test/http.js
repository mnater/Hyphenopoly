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
    const deHyphenator = await H9Y.config({
        "loader": "http",
        "paths": {
            "maindir": "http://mnater.github.io/Hyphenopoly/",
            "patterndir": "http://mnater.github.io/Hyphenopoly/patterns/"
        },
        "require": ["de"]
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
