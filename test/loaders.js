/* eslint-env node */
/* eslint global-require: 0, func-names: 0, no-shadow: 0 */
/* eslint-disable prefer-arrow-callback */

import t from "tap";

/**
 * Imports and returns the defaults of the hyphenopoly module.
 * Circumvents module caching by appending a query to the URL
 * LEAKS MEMORY!
 */
async function freshImport() {
    const {"default": H9Y} = await import(`../hyphenopoly.module.js?update=${Date.now()}`);
    return H9Y;
}

// eslint-disable-next-line require-jsdoc
async function https(file) {
    const https = await import("node:https");
    return new Promise((resolve, reject) => {
        https.get(`https://cdn.jsdelivr.net/npm/hyphenopoly@5.0.0-beta.5/patterns/${file}`, (res) => {
            const rawData = [];
            res.on("data", (chunk) => {
                rawData.push(chunk);
            });
            res.on("end", () => {
                resolve(Buffer.concat(rawData));
            });
            res.on("error", (e) => {
                reject(e);
            });
        });
    });
}

t.test("use https loader", async function (t) {
    const H9Y = await freshImport();
    const deHyphenator = await H9Y.config({
        "loader": https,
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

// eslint-disable-next-line require-jsdoc
function fetcher(file) {
    return fetch(`https://cdn.jsdelivr.net/npm/hyphenopoly@5.0.0-beta.5/patterns/${file}`).then((response) => {
        return response.arrayBuffer();
    });
}

if (global.fetch) {
    t.test("use fetch loader", async function (t) {
        const H9Y = await freshImport();
        const deHyphenator = await H9Y.config({
            "loader": fetcher,
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
}
