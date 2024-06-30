# hyphenopoly module

The Hyphenopoly package contains a file called `hyphenopoly.module.js`.
This module provides hyphenation of plain text for applications beyond the browser.

_Note 1: The node module of Hyphenopoly does not support hyphenation of strings containing HTML — just plain text. If you need to hyphenate HTML-Strings, you must first [parse them](./Special-use-cases.md#hyphenate-html-strings-using-hyphenopolymodulejs)._

_Note 2: Even if it is possible, it is not recommended to use `hyphenopoly.module.js` in browser environments. Use `Hyphenopoly_Loader.js` and `Hyphenopoly.js` instead._

## Install

````
npm install hyphenopoly
````

## Usage

Hyphenopoly needs two things to run correctly:
- a [`loader`](#loader) or [`loaderSync`](#loadersync) function that tells how to load the language-specific Webassembly modules.
- an array of needed languages.

These things are configured in the `hyphenopoly.config()` function, which returns a `Map` of either promises for language specific hyphenators (default async case) or a `Map` of language specific hyphenators (sync case).

### Usage with one language:

````javascript
import hyphenopoly from "hyphenopoly";
import {readFile} from "node:fs/promises";

function loader(file, patDir) {
    return readFile(new URL(file, patDir));
}

const textHyphenators = hyphenopoly.config({
    "hyphen": "•",
    loader,
    "require": ["en-us"]
});

textHyphenators.get("en-us").then(
    (hyphenateText) => {
        console.log(hyphenateText("Hyphenation enhances justification."));
    }
).catch(
    (e) => {
        console.log(e);
    }
);
````

### More then one language:

````javascript
import hyphenopoly from "hyphenopoly";
import {readFile} from "node:fs/promises";

function loader(file, patDir) {
    return readFile(new URL(file, patDir));
}

const textHyphenators = hyphenopoly.config({
    "hyphen": "•",
    loader,
    "require": ["de", "en-us"]
});

textHyphenators.get("de").then(
    (hyphenateText) => {
        console.log(hyphenateText("Silbentrennung verbessert den Blocksatz."));
    }
);

textHyphenators.get("en-us").then(
    (hyphenateText) => {
        console.log(hyphenateText("Hyphenation enhances justification."));
    }
);
````

## Synchronous mode

By default, `hyphenopoly.config` returns a `Map` of promises. Some code bases are not yet capable of handling async code.
By setting `"sync" : true` the hyphenopoly module switches to a sync mode and returns a `Map` of hyphenators. Consequently, a synchronous loader `loaderSync` must also be used.

````javascript
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

````

## Configuration

The `.config`-method takes an object as an argument:

Defaults:
````javascript
{
    "compound": "hyphen",
    "exceptions": {},
    "hyphen": String.fromCharCode(173),
    "leftmin": 0,
    "loader": undefined, //required
    "loaderSync": undefined,
    "minWordLength": 6,
    "mixedCase": true,
    "normalize": false,
    "orphanControl": 1,
    "require": [], //required
    "rightmin": 0,
    "sync": false
}
````

### loader
The `loader` function is called with two arguments:
* a string (the name of the .wasm file to load, e.g. `"en-us.wasm"`)
* an URL-Object (`new URL('./patterns/', import.meta.url)`)

It must return a `promise` that resolves with a buffer of the language file.

Here are some examples:

````javascript
/* A typical node loader using fs/promises */
import hyphenopoly from "hyphenopoly";
import {readFile} from "node:fs/promises";

function loader(file) {
    return readFile(new URL(file, patDir));
}
const hyphenator = hyphenopoly.config({
    loader,
    "require": […]
});
````

````javascript
/* A typical deno loader using Deno.readFile (--allow-read) */
import hyphenopoly from "hyphenopoly";

function loader(file) {
    return Deno.readFile(new URL(file, patDir));
}
const hyphenator = hyphenopoly.config({
    loader,
    "require": […]
});
````

````javascript
/* A node loader using https */
import hyphenopoly from "hyphenopoly";

async function https(file) {
    const https = await import("node:https");
    return new Promise((resolve, reject) => {
        https.get(`https://cdn.jsdelivr.net/npm/hyphenopoly@5.0.0-beta.5/patterns/${file}`, (res) => {
            const rawData = [];
            res.on("data", (chunk) => {
                rawData.push(chunk);
            });
            res.on("end", () => {
                resolve(Buffer.concat(rawData));
            });
            res.on("error", (e) => {
                reject(e);
            });
        });
    });
}
const hyphenator = hyphenopoly.config({
    "loader": https,
    "require": […]
});
````

````javascript
/* A node loader using fetch */
import hyphenopoly from "hyphenopoly";

function fetcher(file) {
    return fetch(`https://cdn.jsdelivr.net/npm/hyphenopoly@5.0.0-beta.5/patterns/${file}`).then((response) => {
        return response.arrayBuffer();
    });
}
const hyphenator = hyphenopoly.config({
    "loader": fetcher,
    "require": […]
});
````

### loaderSync
If hyphenopoly is run in sync-mode, a `loaderSync` must be defined instead of `loader`.
The `loaderSync` function is called with two arguments:
* a string (the name of the .wasm file to load, e.g. `"en-us.wasm"`)
* an URL-Object (`new URL('./patterns/', import.meta.url)`)

It must return a `promise` that resolves with a buffer of the language file.

Of course, this does not work with fetch and https, which are inherently async.

````javascript
/* A snchrounous node loader using fs */
import hyphenopoly from "../hyphenopoly.module.js";
import {readFileSync} from "node:fs";

function loaderSync(file) {
    return readFileSync(new URL(file, patDir));
}

const hyphenator = hyphenopoly.config({
    loaderSync,
    "require": […]
});
````

### Other options
For documentation about the other options see the `Hyphenopoly.js`-documentation:

- [compound](./Setup.md#compound)
- [exceptions](./Setup.md#exceptions)
- [hyphen](./Setup.md#hyphen)
- [leftmin](./Setup.md#leftmin-and-rightmin)
- [minWordLength](./Setup.md#minwordlength)
- [mixedCase](./Setup.md#mixedcase)
- [normalize](./Setup.md#normalize)
- [orphanControl](./Setup.md#orphancontrol)
- [rightmin](./Setup.md#leftmin-and-rightmin)

## Supported languages
A list of supported languages can be programmatically obtained by looking at `Hyphenopoly.supportedLanguages`:
````javascript
import hyphenopoly from "hyphenopoly";
hyphenopoly.supportedLanguages.includes("en-us"); //true
hyphenopoly.supportedLanguages.includes("en"); //false
````
