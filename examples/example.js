// For RunKit:
const hyphenopoly = require("hyphenopoly");


// For local node:
// const hyphenopoly = require("../hyphenopoly.module.js");

const hyphenator = hyphenopoly.config({
    "exceptions": {
        "en-us": "en-han-ces"
    },
    "hyphen": "•",
    "require": ["de", "en-us"]
});

async function hyphenateEn(text) {
    const hyphenateText = await hyphenator.get("en-us");
    console.log(hyphenateText(text));
}

async function hyphenateDe(text) {
    const hyphenateText = await hyphenator.get("de");
    console.log(hyphenateText(text));
}

hyphenateEn("hyphenation enhances justification.");
hyphenateDe("Silbentrennung verbessert den Blocksatz.");
