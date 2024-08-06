/* eslint-disable jsdoc/require-jsdoc */
/* eslint-env node */
/* eslint global-require: 0, func-names: 0, no-shadow: 0 */
/* eslint-disable prefer-arrow-callback */

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

async function https(file) {
    const https = await import("node:https");
    return new Promise((resolve, reject) => {
        https.get(`https://cdn.jsdelivr.net/npm/hyphenopoly@5.2.0/patterns/${file}`, (res) => {
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

function fetcher(file) {
    return fetch(`https://cdn.jsdelivr.net/npm/hyphenopoly@5.2.0/patterns/${file}`).then((response) => {
        return response.arrayBuffer();
    });
}

if (global.fetch) {
    t.test("use fetch loader", async function (t) {
        const H9Y = await freshImport();
        const deHyphenator = await H9Y.config({
            "loader": fetcher,
            "require": ["de"]
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
}

function loaderSync(file, patDir) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return readFileSync(new URL(file, patDir));
}

t.test("use readFileSync with patDir argument", async function (t) {
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

async function loader(file, patDir) {
    const {readFile} = await import("node:fs/promises");
    return readFile(new URL(file, patDir));
}

t.test("use readFile with patDir argument", async function (t) {
    const H9Y = await freshImport();
    const deHyphenator = await H9Y.config({
        loader,
        "require": ["de"]
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