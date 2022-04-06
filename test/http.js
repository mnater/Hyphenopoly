/* eslint-env node */
/* eslint global-require: 0, func-names: 0, no-shadow: 0 */
/* eslint-disable prefer-arrow-callback */

import H9Y from "../hyphenopoly.module.js";
import t from "tap";

t.test("use https loader", async function (t) {
    const deHyphenator = await H9Y.config({
        "loader": "https",
        "paths": {
            "maindir": "https://cdn.jsdelivr.net/npm/hyphenopoly@5.0.0-beta.1/Hyphenopoly_Loader.js",
            "patterndir": "https://cdn.jsdelivr.net/npm/hyphenopoly@5.0.0-beta.1/patterns/"
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
