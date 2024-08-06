/* eslint-disable jsdoc/require-jsdoc */
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

async function loader(file) {
    const {readFile} = await import("node:fs/promises");
    const {dirname} = await import("node:path");
    const {fileURLToPath} = await import("node:url");
    const cwd = dirname(fileURLToPath(import.meta.url));
    return readFile(`${cwd}/../patterns/${file}`);
}

t.test("path to patternfile not resolvable", async function (t) {
    const H9Y = await freshImport();
    const hc = H9Y.config({
        loader,
        "require": ["en"]
    });
    await hc.get("en").catch(
        function (e) {
            t.equal(e, "en.wasm not found.");
            t.end();
        }
    );
});

t.test("loader not defined", async function (t) {
    const H9Y = await freshImport();
    try {
        H9Y.config({
            "handleEvent": {
                error(e) {
                    e.preventDefault();
                    throw e.msg;
                }
            },
            "require": ["en-us"]
        });
    } catch (e) {
        t.equal(e, "loader/loaderSync has not been configured.");
        t.end();
    }
});

t.test("loader not a function", async function (t) {
    const H9Y = await freshImport();
    try {
        H9Y.config({
            "handleEvent": {
                error(e) {
                    e.preventDefault();
                    throw e.msg;
                }
            },
            "loader": "fs",
            "require": ["en-us"]
        });
    } catch (e) {
        t.equal(e, "Loader must be a function.");
        t.end();
    }
});

t.test("run config with two languages", async function (t) {
    const H9Y = await freshImport();
    const hyphenators = H9Y.config({
        loader,
        "require": ["de", "en"]
    });
    t.test("get the hyphenator function for a language", async function (t) {
        await hyphenators.get("en").catch(
            function (e) {
                t.equal(e.slice(-28), "en.wasm not found.");
            }
        );
        t.end();
    });
});

t.test("incomplete setup (forget require)", async function (t) {
    const H9Y = await freshImport();
    const laHyphenator = H9Y.config({
        loader
    });
    t.test("get empty map", function (t) {
        t.equal(laHyphenator.size, 0);
        t.end();
    });
    t.end();
});

t.test("fail when word is to long", async function (t) {
    const H9Y = await freshImport();
    const hc = H9Y.config({
        loader,
        "require": ["nl"]
    });
    const nlHyphenator = await hc.get("nl");
    t.test("hyphenate one word", function (t) {
        t.equal(nlHyphenator("Kindercarnavalsoptochtvoorbereidingswerkzaamhedenplankindercarnavals"), "Kindercarnavalsoptochtvoorbereidingswerkzaamhedenplankindercarnavals");
        t.end();
    });
    t.end();
});
