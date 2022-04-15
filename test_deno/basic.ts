/* eslint-env deno */

import {assertEquals, assertInstanceOf} from "https://deno.land/std@0.135.0/testing/asserts.ts";

/**
 * Imports and returns the defaults of the hyphenopoly module.
 * Circumvents module caching by appending a query to the URL
 * LEAKS MEMORY!
 */
async function freshImport() {
    const {"default": H9Y} = await import(`../hyphenopoly.deno.js?update=${Date.now()}`);
    return H9Y;
}

Deno.test(
    "run config with one language",
    async (t) => {
        const H9Y = await freshImport();
        const deHyphenator = await H9Y.config({"require": ["de"]});
        await t.step("return a function", () => {
            assertEquals(typeof deHyphenator, "function", typeof deHyphenator);
        });
        await t.step("hyphenate one word", () => {
            assertEquals(deHyphenator("Silbentrennung"), "Sil\u00ADben\u00ADtren\u00ADnung", deHyphenator("Silbentrennung"));
        });
        await t.step("hyphenate two words", () => {
            assertEquals(deHyphenator("Silbentrennung Algorithmus"), "Sil\u00ADben\u00ADtren\u00ADnung Al\u00ADgo\u00ADrith\u00ADmus", deHyphenator("Silbentrennung Algorithmus"));
        });
    }
);

Deno.test(
    "substitute character",
    async (t) => {
        const H9Y = await freshImport();
        const deHyphenator = await H9Y.config({
            "require": ["de"],
            "substitute": {
                "de": {
                    "é": "e"
                }
            }
        });
        await t.step("hyphenate Béchamel", () => {
            assertEquals(deHyphenator("Béchamel"), "Bé\u00ADcha\u00ADmel", deHyphenator("Béchamel"));
        });
    }
);

Deno.test(
    "substitue characters unicase",
    async (t) => {
        const H9Y = await freshImport();
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
        await t.step("hyphenate 1337speak", () => {
            assertEquals(deHyphenator("48501u73"), "48\u00AD501u73", deHyphenator("48501u73"));
        });
    }
);

Deno.test(
    "try to hyphenate a word outside alphabet",
    async (t) => {
        const H9Y = await freshImport();
        const deHyphenator = await H9Y.config({"require": ["de"]});
        await t.step("hyphenate ångström", () => {
            assertEquals(deHyphenator("ångström"), "ångström", deHyphenator("ångström"));
        });
    }
);

Deno.test(
    "force .wasm.hyphenate to return 0",
    async (t) => {
        const H9Y = await freshImport();
        const deHyphenator = await H9Y.config({"require": ["de"]});
        // eslint-disable-next-line prefer-regex-literals
        H9Y.languages.get("de").reNotAlphabet = RegExp("[^abcdefghijklmnopqrstuvwxyzåäöüßſ‌-]", "gi");
        await t.step("hyphenate ångström", () => {
            assertEquals(deHyphenator("ångström"), "ångström", deHyphenator("ångström"));
        });
    }
);

/*
 * Disabled:
 * Deno.test(
 *     "disable Webassembly.Globals",
 *     async (t) => {
 *         const H9Y = await freshImport();
 *         const wag = WebAssembly.Global;
 *         WebAssembly.Global = null;
 *         const deHyphenator = await H9Y.config({"require": ["de"]});
 *         await t.step("hyphenate one word with Globals disabled", () => {
 *             assertEquals(
 *                 deHyphenator("Silbentrennung"),
 *                 "Sil\u00ADben\u00ADtren\u00ADnung",
 *                 deHyphenator("Silbentrennung"));
 *             WebAssembly.Global = wag;
 *         });
 *     }
 * );
 */

Deno.test({
    "name": "run config with two languages",
    async fn(t) {
        const H9Y = await freshImport();
        const hyphenators = await H9Y.config({"require": ["de", "en-us"]});
        await t.step("return a Map", () => {
            assertInstanceOf(hyphenators, Map);
        });
        await t.step("get the hyphenator function promise for a language", () => {
            const deHyphenator = hyphenators.get("de");
            assertInstanceOf(deHyphenator, Promise);
        });
        await t.step("get the hyphenator function for a language", async () => {
            const deHyphenator = await hyphenators.get("de");
            assertInstanceOf(deHyphenator, Function);
        });
        await t.step("hyphenate one word of the first language", async () => {
            const deHyphenator = await hyphenators.get("de");
            assertEquals(deHyphenator("Silbentrennung"), "Sil\u00ADben\u00ADtren\u00ADnung", deHyphenator("Silbentrennung"));
        });
        await t.step("hyphenate two words of the first language", async () => {
            const deHyphenator = await hyphenators.get("de");
            assertEquals(deHyphenator("Silbentrennung Algorithmus"), "Sil\u00ADben\u00ADtren\u00ADnung Al\u00ADgo\u00ADrith\u00ADmus", deHyphenator("Silbentrennung Algorithmus"));
        });
        await t.step("hyphenate one word of the second language", async () => {
            const enHyphenator = await hyphenators.get("en-us");
            assertEquals(enHyphenator("hyphenation"), "hy\u00ADphen\u00ADation", enHyphenator("hyphenation"));
        });
        await t.step("hyphenate two words of the second language", async () => {
            const deHyphenator = await hyphenators.get("en-us");
            assertEquals(deHyphenator("hyphenation algorithm"), "hy\u00ADphen\u00ADation al\u00ADgo\u00ADrithm", deHyphenator("hyphenation algorithm"));
        });
    },
    "sanitizeOps": false,
    "sanitizeResources": false
});

Deno.test({
    "name": "run config with two same languages",
    async fn(t) {
        const H9Y = await freshImport();
        const deHyphenator2 = await H9Y.config({"require": ["de", "de"]});
        await t.step("return a function", () => {
            assertEquals(typeof deHyphenator2, "function", typeof deHyphenator2);
        });
        await t.step("hyphenate one word", () => {
            assertEquals(deHyphenator2("Silbentrennung"), "Sil\u00ADben\u00ADtren\u00ADnung", deHyphenator2("Silbentrennung"));
        });
        await t.step("hyphenate two words", () => {
            assertEquals(deHyphenator2("Silbentrennung Algorithmus"), "Sil\u00ADben\u00ADtren\u00ADnung Al\u00ADgo\u00ADrith\u00ADmus", deHyphenator2("Silbentrennung Algorithmus"));
        });
    },
    "sanitizeOps": false,
    "sanitizeResources": false
});


Deno.test({
    "name": "execute synchronically with one language",
    async fn(t) {
        const H9Y = await freshImport();
        const deHyphenator = H9Y.config({
            "require": ["de"],
            "sync": true
        });
        await t.step("return a function", () => {
            assertEquals(typeof deHyphenator, "function", typeof deHyphenator);
        });
        await t.step("hyphenate one word", () => {
            assertEquals(deHyphenator("Silbentrennung"), "Sil\u00ADben\u00ADtren\u00ADnung", deHyphenator("Silbentrennung"));
        });
        await t.step("hyphenate two words", () => {
            assertEquals(deHyphenator("Silbentrennung Algorithmus"), "Sil\u00ADben\u00ADtren\u00ADnung Al\u00ADgo\u00ADrith\u00ADmus", deHyphenator("Silbentrennung Algorithmus"));
        });
    },
    "sanitizeOps": false,
    "sanitizeResources": false
});

Deno.test({
    "name": "execute synchronically with two languages",
    async fn(t) {
        const H9Y = await freshImport();
        const hyphenators = H9Y.config({
            "require": ["de", "en-us"],
            "sync": true
        });
        await t.step("return a Map", () => {
            assertInstanceOf(hyphenators, Map);
        });
        await t.step("get the hyphenator function for a language", () => {
            const deHyphenator = hyphenators.get("de");
            assertInstanceOf(deHyphenator, Function);
        });
        await t.step("hyphenate one word of the first language", () => {
            const deHyphenator = hyphenators.get("de");
            assertEquals(deHyphenator("Silbentrennung"), "Sil\u00ADben\u00ADtren\u00ADnung", deHyphenator("Silbentrennung"));
        });
    },
    "sanitizeOps": false,
    "sanitizeResources": false
});


