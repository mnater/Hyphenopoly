/* eslint-env node */
/* eslint global-require: 0, func-names: 0, no-shadow: 0 */
/* eslint-disable prefer-arrow-callback */

import {dirname} from "path";
import {fileURLToPath} from "url";
import {readFileSync} from "node:fs";
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
function loaderSync(file) {
    const cwd = dirname(fileURLToPath(import.meta.url));
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return readFileSync(`${cwd}/../patterns/${file}`);
}

t.test("execute synchronically with one language", async function (t) {
    const H9Y = await freshImport();
    const deHyphenator = H9Y.config({
        loaderSync,
        "require": ["de"],
        "sync": true
    }).get("de");
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

t.test("execute synchronically with two languages", async function (t) {
    const H9Y = await freshImport();
    const hyphenators = H9Y.config({
        loaderSync,
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
