/* eslint-env node */
"use strict";

const time = process.hrtime();
const Hyphenopoly = require("./hyphenopoly.module");

const textHyphenators = Hyphenopoly.config({
    "require": ["en"],
    //"require": ["de", "en-us"],
    "paths": {
        "maindir": "./",
        "patterndir": "./patterns/"
    },
    "hyphen": "•"
});

textHyphenators.then(
//textHyphenators.get("de").then(
    function ff(hyphenateText) {
        console.log(hyphenateText("Silbentrennung verbessert den Blocksatz."));
        console.log(`${process.hrtime(time)[1] / 1e6}ms`);
    },
    function err(e) {
        console.log(e);
    }
);
