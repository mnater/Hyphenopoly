# Special use cases and how-to's

1. [Webpack, using hyphenopoly.module.js](#webpack-hyphenopoly-module)
1. [Webpack, using Hyphenopoly_Loader.js](#webpack-hyphenopoly-loader)
1. [Hyphenate depending on media queries](#hyphenate-depending-on-media-queries)
1. [Set .focus() while Hyphenopoly is running](#set-focus-while-hyphenopoly-is-running)
1. [Words containing special format characters](#format-chars)
1. [Hyphenate HTML-Strings using using hyphenopoly.module.js](#hyphenate-html-strings-using-hyphenopolymodulejs)
1. [Usage of .wasm Modules outside Hyphenopoly](#usage-of-wasm-modules-outside-hyphenopoly)
1. [Syllabification (german only)](#syllabification)

**Note: It's not recommended to use `hyphenopoly.module.js` in a browser environment. See e.g. [this guide](./Hyphenators.md#use-case-hyphenopoly-in-react) on how to use Hyphenopoly in react.**

## Webpack, using hyphenopoly.module.js {#webpack-hyphenopoly-module}

**Note: The webpacked hyphenopoly.module.js is by far larger than the Hyphenopoly_Loader.js and Hyphenopoly.js scripts, which are optimized for usage in browsers.**

To use `hyphenopoly.module.js` in a browser environment, you'll need to provide a browser-friendly loader: Use `fetch`:

```javascript
import hyphenopoly from "hyphenopoly";

function fetcher(file) {
    return fetch(`https://cdn.jsdelivr.net/npm/hyphenopoly@5.0.0-beta.5/patterns/${file}`).then((response) => {
        return response.arrayBuffer();
    });
}

const hyphenator = hyphenopoly.config({
    "hyphen": "•",
    "loader": fetcher,
    "require": ["de", "en-us"]
});

async function addDiv(lang, text) {
    const hyphenateText = await hyphenator.get(lang);
    const element = document.createElement('div');
    element.innerHTML = hyphenateText(text);
    document.body.appendChild(element);
}

(async function () {
    await addDiv("de", "Silbentrennung verbessert den Blocksatz.");
    await addDiv("en-us", "hyphenation enhances justification.");
})();
```

## Webpack, using Hyphenopoly_Loader.js {#webpack-hyphenopoly-loader}

If you're working in a browser environment, you can add the required files, such as Hyphenopoly.js and the essential patterns, by copying them with the [copy-webpack-plugin](https://www.npmjs.com/package/copy-webpack-plugin) into your distribution folder.

_webpack.config.js_
```javascript
"use strict";
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const HtmlWebpackInjector = require("html-webpack-injector");

module.exports = {
    "entry": {
        "main": "./src/index.js",
        "vendor_head": "./src/vendor_head.js"
    },
    "mode": "production",
    "module": {
        "rules": [
            {
                "loader": "html-loader",
                "test": /\.html$/i
            }
        ]
    },
    "optimization": {
        "minimizer": [new TerserPlugin()],
        "runtimeChunk": "single"
    },
    "output": {
        "filename": "js/[name].[contenthash].bundle.js",
        "path": path.resolve(__dirname, "dist")
    },
    "performance": {
        "hints": false
    },
    "plugins": [
        new CleanWebpackPlugin(), new CopyPlugin({
            "patterns": [
                {
                    "context": "./",
                    "from": "node_modules/hyphenopoly/min/Hyphenopoly.js",
                    "to": "./js/hyphenopoly/"
                }, {
                    "context": "./",
                    "from": "node_modules/hyphenopoly/min/patterns/{es,it,de,en-us}.wasm",
                    "to": "./js/hyphenopoly/patterns/[name].[ext]"
                }
            ]
        }), new HtmlWebpackPlugin({
            "template": "./src/index.html"
        }), new HtmlWebpackInjector()
    ]
};
```

Then, inside the vendor_head.js, create the proper Hyphenopoly object describing the directories where the files are copied and finally import Hyphenopoly_Loader.js.

_vendor_head.js_
```javascript
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
```

A demo can be found at _/examples/webpack_. [Live preview.](./dist/index.html)

## Hyphenate depending on media queries

In CSS, hyphenation can be restricted to special media-queries. If hyphenation on a website must be dependent on e.g. the width of the window and only active on small screens, you'd do something like this:

```css
@media (max-width: 600px) {
  .hyphenate {
    hyphens: auto;
    -ms-hyphens: auto;
    -moz-hyphens: auto;
    -webkit-hyphens: auto;
  }
}
@media (min-width: 601px) {
  .hyphenate {
    hyphens: none;
    -ms-hyphens: none;
    -moz-hyphens: none;
    -webkit-hyphens: none;
  }
}
```

To polyfill hyphenation for browsers that don't support hyphenation (or don't support the required language), we'll have to tell Hyphenopoly to behave the same.

The standard way to enable Hyphenopoly would just hyphenate, regardless of the screen width. We'll have to tell the browser to run Hyphenopoly_Loader.js only for small screens and react to changes in the screen width (e.g. when rotating a mobile device). Therefore, instead of including Hyphenopoly the standard way:

```html
<script>
  var startTime;
  var Hyphenopoly = {
    require: {
      "en-us": "FORCEHYPHENOPOLY"
    },
    paths: {
      maindir: "../",
      patterndir: "../patterns/"
    }
  };
</script>
<script src="../Hyphenopoly_Loader.js"></script>
```

we'll define a `selectiveLoad` IIFE:

```javascript
<script>
  (function selectiveLoad() {
    let H9YLisLoaded = false;
    let elements = null;
    function handleSize(mql) {
      if (mql.matches) {
        //i.e. if width <= 600px
        if (H9YLisLoaded) {
          window.Hyphenopoly.hyphenators["en-us"].then(deh => {
            elements.list.get("en-us").forEach(elo => {
              deh(elo.element, elo.selector);
            });
          });
        } else {
          // Hyphenopoly isn't loaded yet, so load the Loader
          // with the following settings:
          window.Hyphenopoly = {
            require: {
              "en-us": "supercalifragilisticexpialidocious"
            },
            paths: {
              maindir: "../",
              patterndir: "../patterns/"
            },
            setup: {
              selectors: {
                ".hyphenate": {}
              }
            }
          };
          const loaderScript = document.createElement("script");
          loaderScript.src = "../Hyphenopoly_Loader.js";
          document.head.appendChild(loaderScript);
          H9YLisLoaded = true;
        }
      } else {
        //i.e. if width > 600px
        if (H9YLisLoaded) {
          //remove hyphenation previously applied by Hyphenopoly
          window.Hyphenopoly.unhyphenate().then(els => {
            elements = els;
          });
        }
      }
    }
    // Create a Media-Query-List
    const mql = window.matchMedia("(max-width: 600px)");
    // Listen to changes
    mql.addListener(handleSize);
    // call handleSize on init
    handleSize(mql);
  })();
</script>
```

## Set .focus() while Hyphenopoly is running

By default `Hyphenopoly_Loader.js` hides the whole document to prevent a "Flash of unhyphenated content" (FOUHC) until hyphenation has finished. If `focus()` is called while the document is hidden, the focus will not change.

To prevent this behavior, experiment with [different settings for hiding](./Setup.md#hide). Using "element" or "text" should work in most cases.

## Format chars

Hyphenopoly does NOT hyphenate words that contain one of the following special format characters:

* SOFT HYPHEN (\u00AD)
* ZERO WIDTH SPACE (\u200B)
* ZERO WIDTH NON-JOINER (\u200C)
* ZERO WIDTH JOINER (\u200D)

## Hyphenate HTML-Strings using hyphenopoly.module.js

`hyphenopoly.module.js` only hyphenates plain text strings. If the string contains HTML tags, it must first be parsed. The textContent of the nodes may then be hyphenated using hyphenopoly:

````javascript
import {JSDOM} from "jsdom";
import hyphenopoly from "hyphenopoly";

const hyphenator = hyphenopoly.config({
  sync: true,
  require: ["de"],
  defaultLanguage: "de",
  minWordLength: 6,
  hyphen: "•"
})

function hyphenateText(text) {
  if (typeof text === "string") {
    return hyphenator(text)
  } else {
    return undefined
  }
}

function hyphenateHtml(html) {
  if (typeof html === "string") {
    if (html.trim().startsWith("<")) {
      const fragment = JSDOM.fragment(html)
      const hyphenateNode = (node) => {
        for (node = node.firstChild; node; node = node.nextSibling) {
          if (node.nodeType == 3) {
            node.textContent = hyphenator(node.textContent)
          } else {
            hyphenateNode(node)
          }
        }
      }
      hyphenateNode(fragment)
      return fragment.firstChild["outerHTML"]
    } else {
      return hyphenator(html)
    }
  } else {
    return undefined
  }
}

console.log(hyphenateHtml("<p>Silbentrennung ist <b>wichtig</b> im <i>Blocksatz</i>."));
````

## Usage of <lang>.wasm Modules outside Hyphenopoly
The Webassembly-modules provide some basic, language-specific hyphenation
functionality (hyphenation of a single word). These modules can be used in any
system that supports instantiation and execution of Webassembly.

The following example shows how to interact with the module in Python:
````python
#!/usr/bin/env python3
"""This script shows the basic usage of a WebAssembly hyphenator module
from Hyphenopoly in Python to hyphenate a single word."""

# Install wasmer:
# pip install wasmer wasmer_compiler_llvm

from wasmer import engine, Store, Module, Instance
from wasmer_compiler_llvm import Compiler

# Load WebAssembly file
with open('./en-us.wasm', 'rb') as file_handle:
    wasmBytes = file_handle.read()

# Compile and instantiate WebAssembly Module
engine = engine.JIT(Compiler)
store = Store(engine)
module = Module(store, wasmBytes)
instance = Instance(module)

# Create a view into WebAssembly Module memory
mem = instance.exports.mem.uint16_view()
WORD = 'hyphenation'

# Copy Unicode code points of the word to memory
# and end with 0
WORD_LEN = len(WORD)
mem[0:WORD_LEN] = list(map(ord, WORD))
mem[WORD_LEN] = 0

# Call the hyphenate function
# with leftmin and rightmin set to 2 and hyphen char set to "|"
HYLEN = instance.exports.hyphenate(2, 2, ord("|"))

# Read and decode string from memory
hyphenated = bytes(instance.exports.mem.buffer)[0:(HYLEN * 2)].decode(encoding='utf-16')
print(hyphenated)
````

### Exports of wasm-modules
- `mem` - memory: The uInt16View into the first 64 values (128 bytes) is where 
the word to be hyphenated is written to and read from after calling `hyphenate()`.
- `lmi` - left min: The minimum number of letters before the first hyphenation point.
The patterns have been computed with this value.
- `rmi` - rigth min: The minimum number of letters after the last hyphenation point.
The patterns have been computed with this value.
- `lct` - lettercount: The number of letters in the alphabet.
- `hyphenate(leftmin=lmi, rightmin=rmi, hyphenchar=0)` - This function expects
a sequence of UTF-16 values (a single word) in the first 128 bytes of `mem`.
The last value must be followed by `0`. The function 
writes the hyphenated word back to the same memory location and
returns the length of the hyphenated word.
If something goes wrong, the returned value is <= 0.
- `subst(ccl: i32, ccu: i32, replcc: i32): i32` - Substitute `ccl` (charcode lowercase)
and `ccu` (charcode uppercase) with `replcc`. Returns the new length of the alphabet.

## Syllabification
The main task of Hyphenopoly is to separate words at the end of lines. For reasons of readability not all possible separators are found (e.g. in German single letters are not separated: Abend instead of A-bend and misleading separations are avoided Au-toren instead of Au-to-ren).
However, if syllables are to be found, the hyphenation pattern file `de-x-syllable` can be used for the German language. This way more possible "bad" hyphenations are found: A-bend, but also Ur-in-stinkt.

````javascript
Hyphenopoly.config({
    require: {
          "de-x-syllable": "FORCEHYPHENOPOLY",
          "de": "FORCEHYPHENOPOLY"
      },
      fallbacks: {
          "de": "de-x-syllable"
      },
    setup: {
        selectors: {
            ".hyphenate": {
                hyphen: "•",
                minWordLength: 4
            }
        }
    }
});
````
Now elements with `lang="de"` or `lang="de-x-syllable"` are syllabified instead of hyphenated.
