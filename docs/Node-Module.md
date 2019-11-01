# node.js module

The Hyphenopoly-package contains a file called `hyphenopoly.module.js`.
This module provides hyphenation for node.js applications.

## Install

````
npm install hyphenopoly
````

## Usage

One language:

````javascript
const Hyphenopoly = require("hyphenopoly");

const textHyphenators = Hyphenopoly.config({
    "require": ["en-us"],
    "hyphen": "•"
});

textHyphenators.then(
    function ff(hyphenateText) {
        console.log(hyphenateText("Hyphenation enhances justification."));
    }
).catch(
    function err(e) {
        console.log(e);
    }
);
````

More then one language:

````javascript
const Hyphenopoly = require("hyphenopoly");

const textHyphenators = Hyphenopoly.config({
    "require": ["de", "en-us"],
    "hyphen": "•"
});

textHyphenators.get("de").then(
    function ff(hyphenateText) {
        console.log(hyphenateText("Silbentrennung verbessert den Blocksatz."));
    }
);

textHyphenators.get("en-us").then(
    function ff(hyphenateText) {
        console.log(hyphenateText("Hyphenation enhances justification."));
    }
);
````

## Synchronous mode

By default, `Hyphenopoly.config` returns a promise (or a `Map` of promises). Some code bases are not yet capable of handling async code.
By setting `"sync" : true` the hyphenopoly module switches to a sync mode.

````javascript
const hyphenopoly = require("hyphenopoly");

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
````

## Configuration

The `.config`-method takes an object as argument:

Defaults:
````javascript
{
    "compound": "hyphen",
    "exceptions": {},
    "hyphen": String.fromCharCode(173),
    "leftmin": 0,
    "loader": "fs",
    "minWordLength": 6,
    "mixedCase": true,
    "normalize": false,
    "orphanControl": 1,
    "paths": {
        "maindir": `${__dirname}/`,
        "patterndir": `${__dirname}/patterns/
    },
    "require": [],
    "rightmin": 0,
    "sync": false
}
````

The only option that Must be set is `require` which takes an array of language-tags.

### loader
By default hyphenopoly.module.js loads pattern files and hyphenEnginge by using nodes "fs"-module.
This can be changed to the "http"-module by setting the `loader` to "http":
````javascript
const hyphenator = hyphenopoly.config({
    "require": […],
    "loader": "http"
});

````
This is useful if the module is transformed to a script used in a webbrowser (e.g. by using [browserify](http://browserify.org)).

### other options
For documentation about the other options see the `Hyphenopoly.js`-documentation:

- [compound](./Setup.md#compound)
- [exceptions](./Setup.md#exceptions)
- [hyphen](./Setup.md#hyphen)
- [leftmin](./Setup.md#leftmin-and-rightmin)
- [minWordLength](./Setup.md#minwordlength)
- [mixedCase](./Setup.md#mixedcase)
- [normalize](./Setup.md#normalize)
- [orphanControl](./Setup.md#orphancontrol)
- [paths](./Global-Hyphenopoly-Object.md#paths)
- [rightmin](./Setup.md#leftmin-and-rightmin)

## Supported languages (since Version 2.8.0)
A list of supported languages can be programmatically obtained by looking at `Hyphenopoly.supportedLanguages`:
````javascript
const Hyphenopoly = require("hyphenopoly");
Hyphenopoly.supportedLanguages.includes("en-us"); //true
Hyphenopoly.supportedLanguages.includes("en"); //false
````

## Performance

On my machine with node.js 10.0.1:

| module        | setup         | hyphenate 100 de words |
| ------------- | -------------:| ----------------------:|
| _hyphenopoly_ | _12ms_        | _2ms_                  |
| [hyphen](https://www.npmjs.com/package/hyphen)        | 40ms          | 370ms                  |
| [hypher](https://www.npmjs.com/package/hypher)        | 70ms          | 3ms                    |


