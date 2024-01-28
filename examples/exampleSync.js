import hyphenopoly from "../hyphenopoly.module.js";
import {readFileSync} from "node:fs";

function loaderSync(file, patDir) {
    return readFileSync(new URL(file, patDir));
}

const hyphenator = hyphenopoly.config({
    "exceptions": {
        "en-us": "en-han-ces"
    },
    "hyphen": "•",
    loaderSync,
    "require": ["de", "en-us"],
    "sync": true
});

const hy1 = hyphenator.get("en-us")("hyphenation enhances justification.");
const hy2 = hyphenator.get("de")("Silbentrennung verbessert den Blocksatz.");


console.log(hy1);
console.log(hy2);
