/* eslint-env node */
/* eslint no-console: 0 */
"use strict";
// For RunKit:
const hyphenopoly = require("hyphenopoly");

/*
 * For local node:
 * const hyphenopoly = require("./hyphenopoly.module.js");
 */

const hyphenator = hyphenopoly.config({
    "exceptions": {
        "en-us": "en-han-ces"
    },
    "hyphen": "•",
    "require": ["de", "en-us"],
    "sync": true
});

const hy1 = hyphenator.get("en-us")("hyphenation enhances justification.");
const hy2 = hyphenator.get("de")("Silbentrennung verbessert den Blocksatz.");


console.log(hy1);
console.log(hy2);
