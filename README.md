# Hyphenopoly.js

[![CircleCI](https://circleci.com/gh/mnater/Hyphenopoly/tree/master.svg?style=shield)](https://circleci.com/gh/mnater/Hyphenopoly/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/mnater/Hyphenopoly/badge.svg?branch=master)](https://coveralls.io/github/mnater/Hyphenopoly?branch=master)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/de50e1ae70a64a47b0bd9b5449f89353)](https://app.codacy.com/gh/mnater/Hyphenopoly/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

Hyphenopoly.js is a __JavaScript-polyfill for hyphenation in HTML__: it hyphenates text if the user agent does not support CSS-hyphenation at all or not for the required languages and it is a __Node.js-module__.

The package consists of the following parts:
- _Hyphenopoly_Loader.js_ (~11KB unpacked, ~2KB minified and compressed): feature-checks the client and loads other resources if necessary.
- _Hyphenopoly.js_ (~36KB unpacked, ~5KB minified and compressed): does the whole DOM-foo and wraps wasm.
- _wasm-Modules_ (sizes differ! e.g. en-us.wasm: ~21KB uncompressed, ~15KB compressed): core hyphenation functions and hyphenation patterns in a space saving binary format (including pattern license).
- _hyphenopoly.module.js_: the node module to hyphenate plain text strings.

## Usage (Browser)
Place all the code for Hyphenopoly at the top of the header (immediately after the `<title>` tag) to ensure resources are loaded as early as possible.

You'll have to insert two script blocks. In the first block, load Hyphenopoly_Loader.js as an external script.
In the second block, provide the initial configurations for Hyphenopoly_Loader as an inline script. This also triggers all further steps.

Also, don't forget to enable CSS hyphenation.

[Example](http://mnater.github.io/Hyphenopoly/min/example.html):
```html
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8">
        <title>Example 1</title>
        <script src="./Hyphenopoly_Loader.js"></script>
        <script>
        Hyphenopoly.config({
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
        });
        </script>
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

### script blocks – load, configure and run Hyphenopoly_Loader.js
Hyphenopoly_Loader.js needs some information to run. This information is provided as a parameter object to the function `Hyphenopoly.config()`. This information is stored in a globally accessible Object called `window.Hyphenopoly`. Hyphenopoly_Loader.js and (if necessary) Hyphenopoly.js will add other methods and properties only to this object – there will be no other global variables or functions beyond this object.

#### require
The configuration object must have exactly one property called `require` which itself is an object containing at least one nameValuePair where the name is a language code string (Some languages are region-specific. See the patterns directory for supported languages. E.g. just using `en` won't work, use `en-us`or `en-gb`) and the value is a long word string in that language (preferably more than 12 characters long).

If you want to force the usage of Hyphenopoly.js for a language (e.g. for testing purposes), write `"FORCEHYPHENOPOLY"` instead of the long word.

Hyphenopoly_Loader.js tests if the client (aka browser, aka user agent) supports CSS hyphenation for the language(s) given in `require`. In the example above, it will test if the client supports CSS-hyphenation for Latin, German and US-English.

If one of the given languages isn't supported, it automatically hides the document's contents and loads Hyphenopoly.js and the necessary WebAssembly modules.

Hyphenopoly.js – once loaded – will hyphenate the elements according to the settings and unhide the document when it's done.

If something goes wrong and Hyphenopoly.js is unable to unhide the document, Hyphenopoly_Loader.js has a timeout that kicks in after some time (defaults to 1000ms) and unhides the document and writes a message to the console.

If the browser supports all required languages, the script deletes the `Hyphenopoly`-object and terminates without further ado.

### enable CSS-hyphenation
Hyphenopoly by default hyphenates elements (and their children) with the classname `.hyphenate`. Don't forget to enable CSS-hyphenation for the classes eventually handled by Hyphenopoly.

## Usage (node)
Install:
````shell
npm i hyphenopoly
````

````javascript
import hyphenopoly from "hyphenopoly";

const hyphenator = hyphenopoly.config({
    "exceptions": {
        "en-us": "en-han-ces"
    },
    "hyphen": "•",
    "loader": async (file, patDir) => {
        const {readFile} = await import("node:fs/promises");
        return readFile(new URL(file, patDir));
    },
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
````

## Support this project
[![PayPal](https://www.paypal.com/en_US/i/btn/btn_donateCC_LG_global.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=SYNZKB8Z2FRQY)

<a href="https://opencollective.com/hyphenopoly/donate" target="_blank">
  <img src="https://opencollective.com/hyphenopoly/donate/button@2x.png?color=blue" width=300 />
</a>

## Automatic hyphenation
The algorithm used for hyphenation was developed by Franklin M. Liang for TeX. It works more or less like this:

1. Load a set of precomputed language specific patterns. The patterns are stored in a structure called a trie, which is very efficient for this task.
2. Collect all patterns that are a substring of the word to be hyphenated.
3. Combine the numerical values between characters: higher values overwrite lower values.
4. Odd values are hyphenation points (except if the hyphenation point is left from `leftmin` and right from `rightmin`), replace them with a soft hyphen and drop the other values.
5. Repeat steps 2. - 4. for all words longer than minWordLength

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

The patterns are precomputed and available for many languages on [CTAN](https://www.ctan.org/tex-archive/language/hyphenation/) and [tex-hyphen](https://github.com/hyphenation/tex-hyphen). For Hyphenopoly.js they are converted to a succinct trie data structure (including pattern license, metadata, and the patterns).

The original patterns are computed from a large list of hyphenated words by a program called `patgen`. They aim to find some hyphenation points – not all – because it's better to miss a hyphenation point than to have some false hyphenation points. Most patterns are really good, but none are error free.

These patterns vary in size. This is mostly due to the different linguistic characteristics of the languages.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://github.com/StephanHoyer"><img src="https://avatars.githubusercontent.com/u/54701?v=4?s=100" width="100px;" alt="Stephan Hoyer"/><br /><sub><b>Stephan Hoyer</b></sub></a><br /><a href="https://github.com/mnater/Hyphenopoly/commits?author=StephanHoyer" title="Documentation">📖</a> <a href="https://github.com/mnater/Hyphenopoly/commits?author=StephanHoyer" title="Code">💻</a></td>
      <td align="center"><a href="http://thomasbroadley.com"><img src="https://avatars0.githubusercontent.com/u/8731922?v=4?s=100" width="100px;" alt="Thomas Broadley"/><br /><sub><b>Thomas Broadley</b></sub></a><br /><a href="https://github.com/mnater/Hyphenopoly/commits?author=tbroadley" title="Documentation">📖</a></td>
      <td align="center"><a href="https://kailueke.gitlab.io/"><img src="https://avatars0.githubusercontent.com/u/1189130?v=4?s=100" width="100px;" alt="Kai Lüke"/><br /><sub><b>Kai Lüke</b></sub></a><br /><a href="https://github.com/mnater/Hyphenopoly/commits?author=pothos" title="Code">💻</a></td>
      <td align="center"><a href="http://www.data-factory.net/"><img src="https://avatars2.githubusercontent.com/u/998558?v=4?s=100" width="100px;" alt="Sebastian Blank"/><br /><sub><b>Sebastian Blank</b></sub></a><br /><a href="#example-blankse" title="Examples">💡</a></td>
      <td align="center"><a href="https://www.ghsvs.de"><img src="https://avatars2.githubusercontent.com/u/20780646?v=4?s=100" width="100px;" alt="ReLater"/><br /><sub><b>ReLater</b></sub></a><br /><a href="#maintenance-ReLater" title="Maintenance">🚧</a></td>
      <td align="center"><a href="https://github.com/julian-zatloukal"><img src="https://avatars3.githubusercontent.com/u/58230917?v=4?s=100" width="100px;" alt="julian-zatloukal"/><br /><sub><b>julian-zatloukal</b></sub></a><br /><a href="https://github.com/mnater/Hyphenopoly/commits?author=julian-zatloukal" title="Documentation">📖</a></td>
      <td align="center"><a href="http://www.neoskop.de/"><img src="https://avatars1.githubusercontent.com/u/1702250?v=4?s=100" width="100px;" alt="Maik Jablonski"/><br /><sub><b>Maik Jablonski</b></sub></a><br /><a href="https://github.com/mnater/Hyphenopoly/commits?author=jablonski" title="Documentation">📖</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/yashha"><img src="https://avatars0.githubusercontent.com/u/4728786?v=4?s=100" width="100px;" alt="yashha"/><br /><sub><b>yashha</b></sub></a><br /><a href="https://github.com/mnater/Hyphenopoly/commits?author=yashha" title="Code">💻</a></td>
      <td align="center"><a href="http://danburzo.ro/"><img src="https://avatars3.githubusercontent.com/u/205375?v=4?s=100" width="100px;" alt="Dan Burzo"/><br /><sub><b>Dan Burzo</b></sub></a><br /><a href="https://github.com/mnater/Hyphenopoly/commits?author=danburzo" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/CommanderRoot"><img src="https://avatars.githubusercontent.com/u/4395417?v=4?s=100" width="100px;" alt="Tobias Speicher"/><br /><sub><b>Tobias Speicher</b></sub></a><br /><a href="https://github.com/mnater/Hyphenopoly/commits?author=CommanderRoot" title="Code">💻</a></td>
    </tr>
  </tbody>
  <tfoot>
    
  </tfoot>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
