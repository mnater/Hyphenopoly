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

t.test("path to patternfile not resolvable", async function (t) {
    const H9Y = await freshImport();
    await H9Y.config({
        "paths": {
            "maindir": "./",
            "patterndir": "./patterns/"
        },
        "require": ["en"]
    }).catch(
        function (e) {
            t.equal(e, "./patterns/en.wasm not found.");
            t.end();
        }
    );
});

t.test("run config with two languages", async function (t) {
    const H9Y = await freshImport();
    const hyphenators = await H9Y.config({"require": ["de", "en"]});
    t.test("get the hyphenator function for a language", async function (t) {
        await hyphenators.get("en").catch(
            function (e) {
                t.equal(e.slice(-28), "/patterns/en.wasm not found.");
            }
        );
        t.end();
    });
});

t.test("incomplete setup (forget require)", async function (t) {
    const H9Y = await freshImport();
    const laHyphenator = await H9Y.config({});
    t.test("get empty map", function (t) {
        t.equal(laHyphenator.size, 0);
        t.end();
    });
    t.end();
});

t.test("fail when word is to long", async function (t) {
    const H9Y = await freshImport();
    const nlHyphenator = await H9Y.config({"require": ["nl"]});
    t.test("hyphenate one word", function (t) {
        t.equal(nlHyphenator("Kindercarnavalsoptochtvoorbereidingswerkzaamhedenplankindercarnavals"), "Kindercarnavalsoptochtvoorbereidingswerkzaamhedenplankindercarnavals");
        t.end();
    });
    t.end();
});
