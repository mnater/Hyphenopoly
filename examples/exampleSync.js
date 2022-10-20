import hyphenopoly from "../hyphenopoly.module.js";
import {dirname} from "path";
import {fileURLToPath} from "url";
import {readFileSync} from "node:fs";

function loaderSync(file) {
    const cwd = dirname(fileURLToPath(import.meta.url));
    return readFileSync(`${cwd}/../patterns/${file}`);
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
