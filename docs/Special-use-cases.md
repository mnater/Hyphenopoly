# Special use cases and how-to's

1.  [Browserify hyphenopoly.module.js](#browserify-hyphenopolymodulejs)
2.  [Webpack, using hyphenopoly.module.js](#webpack-hyphenopoly-module)
3.  [Webpack, using Hyphenopoly_Loader.js](#webpack-hyphenopoly-loader)
4.  [Hyphenate depending on media queries](#hyphenate-depending-on-media-queries)
5.  [Set .focus() while Hyphenopoly is running](#set-focus-while-hyphenopoly-is-running)

**Note: It's not recommended to use `hyphenopoly.module.js` in a browser environment. See e.g. [this guide](./Hyphenators.md#use-case-hyphenopoly-in-react) on how to use Hyphenopoly in react.**

## Browserify hyphenopoly.module.js

**Note: A browserifyed hyphenopoly.module.js is by far larger then the Hyphenopoly_Loader.js and Hyphenopoly.js scripts which are optimized for usage in browsers.**

### Basic setup

Create a npm project:

```Shell
npm init
```

Install browserify as devDependency

```Shell
npm install --save-dev browserify
```

Install hyphenopoly

```Shell
npm install hyphenopoly
```

Setup hyphenopoly in main.js. Make sure to set the loader to "http" since browserify will not shim the "fs" module:

```javascript
"use strict";

const hyphenopoly = require("hyphenopoly");

const hyphenator = hyphenopoly.config({
  require: ["de", "en-us"],
  paths: {
    maindir: "./node_modules/hyphenopoly/",
    patterndir: "./node_modules/hyphenopoly/patterns/"
  },
  hyphen: "•",
  loader: "https"
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
```

Transform the module

```Shell
browserify main.js -o bundle.js
```

This will generate the script-file `bundle.js`. Usage of a minifying tool (e.g. [tinyify](https://github.com/browserify/tinyify)) is recommended.

_Note:_ Make sure the directories referenced in `paths` are available.

## Webpack, using hyphenopoly.module.js {#webpack-hyphenopoly-module}

**Note: A webpacked hyphenopoly.module.js is by far larger then the Hyphenopoly_Loader.js and Hyphenopoly.js scripts which are optimized for usage in browsers.**

Like `browserify` `webpack` will not shim "fs". Thus we have to tell `webpack` to shim the "fs" module with an empty object and configure `hyphenopoly` to use the "http"-loader.

webpack.config.js

```javascript
module.exports = {
  node: {
    fs: "empty" //<- prevent "fs not found"
  }
};
```

index.js

```javascript
const hyphenopoly = require("hyphenopoly");

const hyphenator = hyphenopoly.config({
  require: ["de", "en-us"],
  paths: {
    maindir: "../node_modules/hyphenopoly/",
    patterndir: "../node_modules/hyphenopoly/patterns/"
  },
  hyphen: "•",
  loader: "http"
});
```

## Webpack, using Hyphenopoly_Loader.js {#webpack-hyphenopoly-loader}

If you’re working in a browser environment you can add the required files, such as Hyphenopoly.js and the essential patterns, by copying them with the [copy-webpack-plugin](https://www.npmjs.com/package/copy-webpack-plugin) into your distribution folder.

webpack.config.js
```javascript
module.exports = {
  entry: {
    vendor_head: "./src/vendor_head.js"
  },
  plugins: [
    new CopyPlugin([
      {
        context: "./",
        from: "node_modules/hyphenopoly/Hyphenopoly.js",
        to: "./js/hyphenopoly/",
        force: true,
        flatten: true
      },
      {
        context: "./",
        from: "node_modules/hyphenopoly/patterns/{es,it,de,en-us}.wasm", // Required patterns
        to: "./js/hyphenopoly/patterns/",
        globOptions: {
          extglob: true
        },
        force: true,
        flatten: true
      }
    ]),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      favicon: ""
    }),
    new HtmlWebpackInjector()
  ],
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader"
      }
    ]
  }
};
```

Then, inside the vendor_head.js create the proper Hyphenopoly object describing the directories where the files are copied and finally import Hyphenopoly_Loader.js.

vendor_head.js
```javascript
var Hyphenopoly = {
  require: {
    es: "anticonstitucionalmente", // Required languages
    it: "precipitevolissimevolmente",
    de: "Silbentrennungsalgorithmus",
    "en-us": "antidisestablishmentarianism"
  },
  paths: {
    patterndir: "./js/hyphenopoly/patterns/", // Path to the directory of pattern files
    maindir: "./js/hyphenopoly/" // Path to the directory where the other ressources are stored
  }
};
window.Hyphenopoly = Hyphenopoly; // Make Hyphenopoly object global
const hyphenopoly_loader = require("hyphenopoly/Hyphenopoly_Loader");
```

## Hyphenate depending on media queries

In CSS hyphenation can be restricted to special media-queries. If hyphenation on a website must be dependent of e.g. the width of the window and only active on small screens, you'd do something like this:

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

To polyfill hyphenation for browsers that don't support hyphenation (or don't support the required language) we'll have to tell Hyphenopoly to behave the same.

The standard way to enable Hyphenopoly would just hyphenate, regardless of the screen-width. Well have to tell the browser to run Hyphenopoly_Loader.js only for small screens and react to changes of the screen width (e.g. when rotating a mobile device). Therefor, instead of including Hyphenopoly the standard way

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

```html
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

By default `Hyphenopoly_Loader.js` hides the whole document to prevent a "Flash of unhyphenated content" (FOUHC) until hyphenation has finished. If `focus()` is called while the document is hidden the focus will not change.

To prevent this behavior experiment with [different settings for hiding](./Setup.md#hide). Using "element" or "text" should work in most cases.
