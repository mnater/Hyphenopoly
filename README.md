# Hyphenopoly.js
[![Build Status](https://travis-ci.org/mnater/Hyphenopoly.svg?branch=master)](https://travis-ci.org/mnater/Hyphenopoly) [![Coverage Status](https://coveralls.io/repos/github/mnater/Hyphenopoly/badge.svg?branch=master)](https://coveralls.io/github/mnater/Hyphenopoly?branch=master) [![dependencies Status](https://david-dm.org/mnater/Hyphenopoly/status.svg)](https://david-dm.org/mnater/Hyphenopoly) [![devDependencies Status](https://david-dm.org/mnater/Hyphenopoly/dev-status.svg)](https://david-dm.org/mnater/Hyphenopoly?type=dev) [![npms score](https://badges.npms.io/hyphenopoly.svg)](https://npms.io/search?q=hyphenopoly) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/de50e1ae70a64a47b0bd9b5449f89353)](https://www.codacy.com/app/mnater/Hyphenopoly?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=mnater/Hyphenopoly&amp;utm_campaign=Badge_Grade)
[![Backers on Open Collective](https://opencollective.com/Hyphenopoly/backers/badge.svg)](#backers) 
[![Sponsors on Open Collective](https://opencollective.com/Hyphenopoly/sponsors/badge.svg)](#sponsors) 

Hyphenopoly.js is a __JavaScript-polyfill for hyphenation in HTML__: it hyphenates text if the user agent does not support CSS-hyphenation at all or not for the required languages and it is a __Node.js-module__.

The package consists of the following parts:
-   _Hyphenopoly_Loader.js_ (~24KB unpacked, ~3KB minified and compressed): feature-checks the client and loads other resources if necessary.
-   _Hyphenopoly.js_ (~41KB unpacked, ~4KB minified and compressed): does the whole DOM-foo and wraps (w)asm.
-   _hyphenEngine.wasm_ (~1KB uncompressed): wasm code for creating pattern trie and finding hyphenation points.
-   _hyphenEngine.asm.js_ (~10KB uncompressed, ~1KB minified and compressed): fallback for clients that don't support wasm.
-   _pattern.hpb_ (sizes differ! e.g. en-us.hpb: ~27KB uncompressed, ~16KB compressed): space saving binary format of the hyphenation patterns (including their license).
-   _hyphenopoly.module.js_: the node module

## Usage (Browser)
Place all code for Hyphenopoly at the top of the header (immediately after the `<title>` tag) to ensure resources are loaded as early as possible.
You'll have to insert two script blocks. In the first block provide the initial configurations for Hyphenopoly_Loader as inline script. In the second block load Hyphenopoly_Loader.js as external script.
Also, don't forget to enable CSS hyphenation.

[Example](http://mnater.github.io/Hyphenopoly/example1.html):
```html
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8">
        <title>Example 1</title>
        <script>
        var Hyphenopoly = {
            require: {
                "la": "honorificabilitudinitas",
                "de": "Silbentrennungsalgorithmus",
                "en-us": "Supercalifragilisticexpialidocious"
            },
            setup: {
                selectors: {
                    ".container": {}
                }
            }
        };
        </script>
        <script src="./Hyphenopoly_Loader.js"></script>
        <style type="text/css">
            body {
                width:60%;
                margin-left:20%;
            }
            p {
                text-align: justify;
                margin: 0 2em 0 0;
            }
            .container {
                display: flex;
                hyphens: auto;
                -ms-hyphens: auto;
                -moz-hyphens: auto;
                -webkit-hyphens: auto;
            }
        </style>
    </head>
    <body>
        <h1>Example 1</h1>
        <div class="container">
            <p lang="la">Qua de causa Helvetii quoque reliquos Gallos virtute praecedunt, quod fere cotidianis proeliis cum Germanis contendunt, cum aut suis finibus eos prohibent aut ipsi in eorum finibus bellum gerunt.</p>
            <p lang="en-us">For which reason the Helvetii also surpass the rest of the Gauls in valor, as they contend with the Germans in almost daily battles, when they either repel them from their own territories, or themselves wage war on their frontiers.</p>
            <p lang="de">Aus diesem Grund übertreffen auch die Helvetier die übrigen Gallier an Tapferkeit, weil sie sich in fast täglichen Gefechten mit den Germanen messen, wobei sie diese entweder von ihrem Gebiet fernhalten oder selbst in deren Gebiet kämpfen.</p>
        </div>
    </body>
</html>
```
Let's go through this example step by step:

### UTF-8
Make sure your page is encoded as utf-8.

### First script block – configurations
Hyphenopoly_Loader.js needs some information to run. This information is provided in a globally accessible Object called `Hyphenopoly`. Hyphenopoly_Loader.js and (if necessary) Hyphenopoly.js will add other methods and properties only to this object – there will be no other global variables/functions beyond this object.

#### require
The `Hyphenopoly` object must have exactly one property called `require` which itself is an object containing at least one nameValuePair where the name is a language code string (Some patterns are region-specific. See the patterns directory for supported languages. E.g. just using `en` won't work, use either `en-us`or `en-gb`) and the value is a long word string in that language (preferably more than 12 characters long).

Hyphenator_Loader.js will feature test the client (aka browser, aka user agent) for CSS-hyphens support for the given languages with the given words respectively. In the example above it will test if the client supports CSS-hyphenation for latin, german and us-english.

If you want to force the usage of Hyphenopoly.js for a language (e.g. for testing purposes) write `"FORCEHYPHENOPOLY"` instead of the long word.

### Second script block – load and run Hyphenopoly_Loader.js
Hyphenopoly_Loader.js tests if the browser supports CSS hyphenation for the language(s) given in `Hyphenopoly.require`. If one of the given languages isn't supported it automatically hides the documents contents and loads Hyphenopoly.js and the necessary patterns. Hyphenopoly.js – once loaded – will hyphenate the elements according to the settings and unhide the document when it's done. If something goes wrong and Hyphenopoly.js is unable to unhide the document Hyphenopoly_Loader.js has a timeout that kicks in after some time (defaults to 1000ms) and unhides the document and writes a message to the console.
If the browser supports all required languages the script deletes the `Hyphenopoly`-object and terminates without further ado.

### enable CSS-hyphenation
Hyphenopoly by default hyphenates elements (and their children) with the classname `.hyphenate`. Don't forget to enable CSS-hyphenation for the classes eventually handled by Hyphenopoly.

## Usage (node)
[![Try hyphenopoly on RunKit](https://badge.runkitcdn.com/hyphenopoly.svg)](https://npm.runkit.com/hyphenopoly)

Install:
````shell
npm i hyphenopoly
````

````javascript
"use strict";

const hyphenopoly = require("hyphenopoly");

const hyphenator = hyphenopoly.config({
    "require": ["de", "en-us"],
    "hyphen": "•",
    "exceptions": {
        "en-us": "en-han-ces"
    }
});

async function hyphenate_en(text) {
    const hyphenateText = await hyphenator.get("en-us");
    console.log(hyphenateText(text));
}

async function hyphenate_de(text) {
    const hyphenateText = await hyphenator.get("de");
    console.log(hyphenateText(text));
}

hyphenate_en("hyphenation enhances justification.");
hyphenate_de("Silbentrennung verbessert den Blocksatz.");
````

## Support this project
[![paypal](https://www.paypal.com/en_US/i/btn/btn_donateCC_LG_global.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=SYNZKB8Z2FRQY)

<a href="https://opencollective.com/hyphenopoly/donate" target="_blank">
  <img src="https://opencollective.com/hyphenopoly/donate/button@2x.png?color=blue" width=300 />
</a>

## Automatic hyphenation
The algorithm used for hyphenation was developed by Franklin M. Liang for TeX. It works more or less like this:

1.  Load a set of precomputed language specific patterns. The patterns are stored in a structure called a trie, which is very efficient for this task.
2.  Collect all patterns that are a substring of the word to be hyphenated.
3.  Combine the numerical values between characters: higher values overwrite lower values.
4.  Odd values are hyphenation points (except if the hyphenation point is left from leftmin and right from rightmin), replace them with a soft hyphen and drop the other values.
5.  Repeat 2. - 4. for all words longer than minWordLength

Example:
````text
Hyphenation
h y p h e n a t i o n
h y3p h
      h e2n
      h e n a4
      h e n5a t
         1n a
          n2a t
             1t i o
               2i o
                  o2n
h0y3p0h0e2n5a4t2i0o2n
Hy-phen-ation
````

The patterns are precomputed and available for many languages on CTAN. Hyphenopoly.js uses a proprietary binary format (including pattern licence, metadata and the patterns). Patterns are computed from a large list of hyphenated words by a program called patgen. They aim to find some hyphenation points – not all – because it's better to miss a hyphenation point then to have some false hyphenation points. Most patterns are really good but none is error free.

These pattern vary in size. This is mostly due to the different linguistic characteristics of the languages.

## Hyphenopoly.js vs. Hyphenator.js
[Hyphenator.js](https://github.com/mnater/Hyphenator) started 2007 and had evolved ever since.
But web browsers have evolved much more!
Almost all of them support [native hyphenation](https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens) for a [specific set of languages](https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens#Browser_compatibility). So it was time for something new!

Hyphenopoly.js is based on Hyphenator.js (they share some code) but - in favor of simplicity and speed – lacks many features of Hyphenator.js. Most of these features aren't needed in modern webdesign anymore:
-   dropped support for usage as bookmarklet
-   dropped support for frames
-   dropped support for ancient browsers
-   dropped caching of patterns in browser storage
-   dropped breaking of non-textual content (urls, code etc.)
-   and some more…

If you need one of those features use Hyphenator.js – or give some feedback and proof that the feature is really useful and should be implemented in Hyphenopoly.js

On the other hand Hyphenopoly has a much finer-grained configuration system that allows you to make settings based on CSS-classes.
And last but not least it is faster than Hyphenator.js

## Contributors

This project exists thanks to all the people who contribute. 
<a href="https://github.com/mnater/Hyphenopoly/graphs/contributors"><img src="https://opencollective.com/Hyphenopoly/contributors.svg?width=890&button=false" /></a>


## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/Hyphenopoly#backer)]

<a href="https://opencollective.com/Hyphenopoly#backers" target="_blank"><img src="https://opencollective.com/Hyphenopoly/backers.svg?width=890"></a>


## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/Hyphenopoly#sponsor)]

<a href="https://opencollective.com/Hyphenopoly/sponsor/0/website" target="_blank"><img src="https://opencollective.com/Hyphenopoly/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/Hyphenopoly/sponsor/1/website" target="_blank"><img src="https://opencollective.com/Hyphenopoly/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/Hyphenopoly/sponsor/2/website" target="_blank"><img src="https://opencollective.com/Hyphenopoly/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/Hyphenopoly/sponsor/3/website" target="_blank"><img src="https://opencollective.com/Hyphenopoly/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/Hyphenopoly/sponsor/4/website" target="_blank"><img src="https://opencollective.com/Hyphenopoly/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/Hyphenopoly/sponsor/5/website" target="_blank"><img src="https://opencollective.com/Hyphenopoly/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/Hyphenopoly/sponsor/6/website" target="_blank"><img src="https://opencollective.com/Hyphenopoly/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/Hyphenopoly/sponsor/7/website" target="_blank"><img src="https://opencollective.com/Hyphenopoly/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/Hyphenopoly/sponsor/8/website" target="_blank"><img src="https://opencollective.com/Hyphenopoly/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/Hyphenopoly/sponsor/9/website" target="_blank"><img src="https://opencollective.com/Hyphenopoly/sponsor/9/avatar.svg"></a>


