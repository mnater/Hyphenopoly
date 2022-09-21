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
    "set options: compound",
    async (t) => {
        await t.step("compound: all", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "compound": "all",
                "hyphen": "•",
                "require": ["de"]
            });
            assertEquals(hyphenator("Silbentrennungs-Algorithmus"), "Sil•ben•tren•nungs-\u200BAl•go•rith•mus");
        });
        await t.step("compound: auto", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "compound": "auto",
                "hyphen": "•",
                "require": ["de"]
            });
            assertEquals(hyphenator("Silbentrennungs-Algorithmus"), "Sil•ben•tren•nungs-Al•go•rith•mus");
        });
        await t.step("compound: hyphen", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "compound": "hyphen",
                "hyphen": "•",
                "require": ["de"]
            });
            assertEquals(hyphenator("Silbentrennungs-Algorithmus"), "Silbentrennungs-\u200BAlgorithmus");
        });
        await t.step("compound: auto, one part too small", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "compound": "auto",
                "hyphen": "•",
                "require": ["de"]
            });
            assertEquals(hyphenator("Test-Algorithmus"), "Test-Al•go•rith•mus");
        });
        await t.step("compound: all, one part too small", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "compound": "all",
                "hyphen": "•",
                "require": ["de"]
            });
            assertEquals(hyphenator("Test-Algorithmus"), "Test-\u200BAl•go•rith•mus");
        });
    }
);

Deno.test(
    "set options: exceptions",
    async (t) => {
        await t.step("exceptions: global (only)", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "exceptions": {"global": "Silben-trennung"},
                "hyphen": "•",
                "require": ["de"]
            });
            assertEquals(hyphenator("Silbentrennung"), "Silben•trennung");
        });
        await t.step("exceptions: global and lang", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "exceptions": {
                    "de": "Algo-rithmus",
                    "global": "Silben-trennung"
                },
                "hyphen": "•",
                "require": ["de"]
            });
            assertEquals(hyphenator("Silbentrennung Algorithmus"), "Silben•trennung Algo•rithmus");
        });
        await t.step("exceptions: double entry", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "exceptions": {"de": "Algo-rithmus, Algo-rithmus"},
                "hyphen": "•",
                "require": ["de"]
            });
            assertEquals(hyphenator("Algorithmus"), "Algo•rithmus");
        });
        await t.step("exceptions: double entry", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "hyphen": "•",
                "require": ["en-us"]
            });
            assertEquals(hyphenator("reformation"), "ref•or•ma•tion");
        });
    }
);

Deno.test(
    "set options: hyphen",
    async (t) => {
        await t.step("hyphen: •", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "hyphen": "•",
                "require": ["de"]
            });
            assertEquals(hyphenator("Silbentrennung"), "Sil•ben•tren•nung");
        });
        await t.step("hyphen: |", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "hyphen": "|",
                "require": ["de"]
            });
            assertEquals(hyphenator("Silbentrennung"), "Sil|ben|tren|nung");
        });
    }
);

Deno.test(
    "set options: left-/rightmin (patterns: 2/2)",
    async (t) => {
        await t.step("left-/rightmin: 4, 5", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "hyphen": "•",
                "leftmin": 4,
                "require": ["de"],
                "rightmin": 5
            });
            assertEquals(hyphenator("Silbentrennung"), "Silben•trennung");
        });

        await t.step("left-/rightminPerLang: 4, 5", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "hyphen": "•",
                "leftminPerLang": {
                    "de": 4
                },
                "require": ["de"],
                "rightminPerLang": {
                    "de": 5
                }
            });
            assertEquals(hyphenator("Silbentrennung"), "Silben•trennung");
        });
    }
);

Deno.test(
    "set options: left-/rightmin (patterns: 2/3)",
    async (t) => {
        await t.step("left-/rightmin: 2, 2", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "hyphen": "•",
                "leftmin": 2,
                "require": ["pt"],
                "rightmin": 2
            });
            assertEquals(hyphenator("relativo"), "re•la•tivo");
        });

        await t.step("left-/rightmin: def, def", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "hyphen": "•",
                "require": ["pt"]
            });
            assertEquals(hyphenator("relativo"), "re•la•tivo");
        });
    }
);

Deno.test(
    "set options: minWordLength",
    async (t) => {
        await t.step("minWordLength: 7", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "hyphen": "•",
                "minWordLength": 7,
                "require": ["de"]
            });
            assertEquals(hyphenator("Die Asse essen lieber gesunde Esswaren"), "Die Asse essen lieber ge•sun•de Ess•wa•ren");
        });
    }
);

Deno.test(
    "set options: mixedCase",
    async (t) => {
        await t.step("mixedCase: false", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "hyphen": "•",
                "mixedCase": false,
                "require": ["de"]
            });
            assertEquals(hyphenator("silbentrennen Silbentrennung camelCase"), "sil•ben•tren•nen Silbentrennung camelCase");
        });
    }
);

Deno.test(
    "set options: normalize",
    async (t) => {
        await t.step("normalize: true", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "hyphen": "•",
                "normalize": true,
                "require": ["de"]
            });
            assertEquals(hyphenator("Ba\u0308rento\u0308ter"), "Bä•ren•tö•ter");
        });
    }
);

Deno.test(
    "set options: orphanControl",
    async (t) => {
        await t.step("orphanControl: 1 (default)", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "hyphen": "•",
                "require": ["de"]
            });
            assertEquals(hyphenator("Die Asse essen lieber gesunde Esswaren"), "Die Asse essen lie•ber ge•sun•de Ess•wa•ren");
        });
        await t.step("orphanControl: 2", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "hyphen": "•",
                "orphanControl": 2,
                "require": ["de"]
            });
            assertEquals(hyphenator("Die Asse essen lieber gesunde Esswaren"), "Die Asse essen lie•ber ge•sun•de Esswaren");
        });
        await t.step("orphanControl: 2, hyphen: |", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "hyphen": "|",
                "orphanControl": 2,
                "require": ["de"]
            });
            assertEquals(hyphenator("Die Asse essen lieber gesunde Esswaren"), "Die Asse essen lie|ber ge|sun|de Esswaren");
        });
        await t.step("orphanControl: 3", async () => {
            const H9Y = await freshImport();
            const hyphenator = await H9Y.config({
                "hyphen": "•",
                "orphanControl": 3,
                "require": ["de"]
            });
            assertEquals(hyphenator("Die Asse essen lieber gesunde Esswaren"), "Die Asse essen lie•ber ge•sun•de\u00A0Esswaren");
        });
    }
);
