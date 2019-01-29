// For RunKit:
const hyphenopoly = require("hyphenopoly");

// For local node:
// const hyphenopoly = require("./hyphenopoly.module.js");
const hyphenator = hyphenopoly.config({
    "sync": true,
    "require": ["de", "en-us"],
    "hyphen": "•",
    "exceptions": {
        "en-us": "en-han-ces"
    }
});

const hy1 = hyphenator.get("en-us")("hyphenation enhances justification.");
const hy2 = hyphenator.get("de")("Silbentrennung verbessert den Blocksatz.");


console.log(hy1);
console.log(hy2);