// For RunKit:
//const hyphenopoly = require("hyphenopoly");

// For local node:
console.time("req");
 const hyphenopoly = require("./hyphenopoly.module.js");
console.timeEnd("req");
console.time("conf");
const hyphenator = hyphenopoly.config({
    "sync": true,
    "require": ["de", "en-us"],
    "hyphen": "•",
    "exceptions": {
        "en-us": "en-han-ces"
    }
});
console.timeEnd("conf");

console.time("hyp");
const hy1 = hyphenator.get("en-us")("hyphenation enhances justification.");
const hy2 = hyphenator.get("de")("Silbentrennung verbessert den Blocksatz.");


console.log(hy1);
console.log(hy2);
console.timeEnd("hyp");