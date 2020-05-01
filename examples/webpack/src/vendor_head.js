/* eslint-env node */
/* eslint-disable sort-keys */


"use strict";

const Hyphenopoly = {
    "require": {
        "es": "anticonstitucionalmente",
        "it": "precipitevolissimevolmente",
        "de": "Silbentrennungsalgorithmus",
        "en-us": "antidisestablishmentarianism"
    },
    "paths": {
        // Path to the directory of pattern files
        "patterndir": "./js/hyphenopoly/patterns/",
        // Path to the directory where the other ressources are stored
        "maindir": "./js/hyphenopoly/"
    }
};
window.Hyphenopoly = Hyphenopoly;
require("hyphenopoly/Hyphenopoly_Loader");
