/* eslint-env node */
/* eslint no-console: 0 */

"use strict";

// For RunKit:
const hyphenopoly = require("hyphenopoly");

// For local node:
// const hyphenopoly = require("./hyphenopoly.module.js");

const hyphenator = hyphenopoly.config({
    "exceptions": {
        "en-us": "en-han-ces"
    },
    "hyphen": "•",
    "require": ["de", "en-us"]
});

/**
 * Asyncly hyphenate english text
 * @param {string} text - Words to by hyphenated
 */
async function hyphenateEn(text) {
    const hyphenateText = await hyphenator.get("en-us");
    console.log(hyphenateText(text));
}

/**
 * Asyncly hyphenate germam text
 * @param {string} text - Words to by hyphenated
 */
async function hyphenateDe(text) {
    const hyphenateText = await hyphenator.get("de");
    console.log(hyphenateText(text));
}

hyphenateEn("hyphenation enhances justification.");
hyphenateDe("Silbentrennung verbessert den Blocksatz.");
