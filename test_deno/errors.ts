
/* global Deno */

import {assertEquals} from "https://deno.land/std@0.135.0/testing/asserts.ts";

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
    "path to patternfile not resolvable",
    async () => {
        const H9Y = await freshImport();
        await H9Y.config({
            "paths": {
                "maindir": "./",
                "patterndir": "./patterns/"
            },
            "require": ["en"]
        }).catch(
            (e: string) => {
                assertEquals(e, "./patterns/en.wasm not found.");
            }
        );
    }
);

Deno.test({
    "name": "run config with two languages",
    async fn(t) {
        const H9Y = await freshImport();
        const hyphenators = await H9Y.config({"require": ["de", "en"]});
        await t.step("get the hyphenator function for a language", async () => {
            await hyphenators.get("en").catch(
                (e: string) => {
                    assertEquals(e.slice(-28), "/patterns/en.wasm not found.");
                }
            );
        });
    },
    "sanitizeOps": false,
    "sanitizeResources": false
});

Deno.test({
    "name": "incomplete setup (forget require)",
    async fn(t) {
        const H9Y = await freshImport();
        const laHyphenator = await H9Y.config({});
        await t.step("get empty map", () => {
            assertEquals(laHyphenator.size, 0);
        });
    },
    "sanitizeOps": false,
    "sanitizeResources": false
});

Deno.test({
    "name": "fail when word is to long",
    async fn(t) {
        const H9Y = await freshImport();
        const nlHyphenator = await H9Y.config({"require": ["nl"]});
        await t.step("hyphenate one word", () => {
            assertEquals(nlHyphenator("Kindercarnavalsoptochtvoorbereidingswerkzaamhedenplankindercarnavals"), "Kindercarnavalsoptochtvoorbereidingswerkzaamhedenplankindercarnavals");
        });
    },
    "sanitizeOps": false,
    "sanitizeResources": false
});
