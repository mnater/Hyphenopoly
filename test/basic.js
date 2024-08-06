/* eslint-env node */
/* eslint global-require: 0, func-names: 0, no-shadow: 0 */
/* eslint-disable prefer-arrow-callback */

import t from "tap";

/**
 * Imports and returns the defaults of the hyphenopoly module.
 * Circumvents module caching by appending a query to the URL
 * LEAKS MEMORY!
 * @returns {object} Hyphenopoly module
 */
async function freshImport() {
    const {"default": H9Y} = await import(`../hyphenopoly.module.js?update=${Date.now()}`);
    return H9Y;
}

// eslint-disable-next-line jsdoc/require-jsdoc
async function loader(file) {
    const {readFile} = await import("node:fs/promises");
    const {dirname} = await import("node:path");
    const {fileURLToPath} = await import("node:url");
    const cwd = dirname(fileURLToPath(import.meta.url));
    return readFile(`${cwd}/../patterns/${file}`);
}

t.test("run config with one language", async function (t) {
    const H9Y = await freshImport();
    const hc = H9Y.config({
        loader,
        "require": ["de"]
    });
    const deHyphenator = await hc.get("de");
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
    const H9Y = await freshImport();
    const hc = H9Y.config({
        loader,
        "require": ["de"],
        "substitute": {
            "de": {
                "é": "e"
            }
        }
    });
    const deHyphenator = await hc.get("de");
    t.test("hyphenate Béchamel", function (t) {
        t.equal(deHyphenator("Béchamel"), "Bé\u00ADcha\u00ADmel", deHyphenator("Béchamel"));
        t.end();
    });
    t.end();
});

t.test("substitue characters unicase", async function (t) {
    const H9Y = await freshImport();
    const hc = H9Y.config({
        loader,
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
    const enHyphenator = await hc.get("en-us");
    t.test("hyphenate 1337speak", function (t) {
        t.equal(enHyphenator("48501u73"), "48\u00AD501u73", enHyphenator("48501u73"));
        t.end();
    });
    t.end();
});

t.test("try to hyphenate a word outside alphabet", async function (t) {
    const H9Y = await freshImport();
    const hc = H9Y.config({
        loader,
        "require": ["de"]
    });
    const deHyphenator = await hc.get("de");
    t.test("hyphenate ångström", function (t) {
        t.equal(deHyphenator("ångström"), "ångström", deHyphenator("ångström"));
        t.end();
    });
    t.end();
});

t.test("disable Webassembly.Globals", async function (t) {
    const H9Y = await freshImport();
    const wag = WebAssembly.Global;
    WebAssembly.Global = null;
    const hc = H9Y.config({
        loader,
        "require": ["de"]
    });
    const deHyphenator = await hc.get("de");
    t.test("hyphenate one word with Globals disabled", function (t) {
        t.equal(deHyphenator("Silbentrennung"), "Sil\u00ADben\u00ADtren\u00ADnung", deHyphenator("Silbentrennung"));
        t.end();
        WebAssembly.Global = wag;
    });
    t.end();
});

t.test("run config with two languages", async function (t) {
    const H9Y = await freshImport();
    const hyphenators = H9Y.config({
        loader,
        "require": ["de", "en-us"]
    });
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
    const H9Y = await freshImport();
    const hc = H9Y.config({
        loader,
        "require": ["de", "de"]
    });
    const deHyphenator2 = await hc.get("de");
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

t.test("use language with private use subtag", async function (t) {
    const H9Y = await freshImport();
    const hc = H9Y.config({
        loader,
        "require": ["de-x-syllable"]
    });
    const deHyphenator2 = await hc.get("de-x-syllable");
    t.test("hyphenate one word", function (t) {
        t.equal(deHyphenator2("Autorenlesung"), "Au\u00ADto\u00ADren\u00ADle\u00ADsung", deHyphenator2("Autorenlesung"));
        t.end();
    });
    t.end();
});
