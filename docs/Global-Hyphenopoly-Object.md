# The global Hyphenopoly object

Before loading Hyphenopoly_Loader.js initial settings must be provided in a global `Hyphenopoly`-object. This is the only place in global space where Hyphenopoly.js puts data.

## Mandatory Fields
These fields in the `Hyphenopoly`-object must be defined.

### require
The `require` field must be an object of key-value-pairs, where the keys are language codes and the values are a long word (>=12 characters) in the required language.
````javascript
require: {
    "en-us": "supercalifragilisticexpialidocious",
    "de": "Silbentrennungsalgorithmus"
}
````
Hyphenopoly_Loader.js feature tests the browser for CSS-hyphenation support of the required languages using the long word.
If the feature test indicates that the browser doesn't support CSS-hyphenation for at least one language, all necessary ressources will be loaded and Hyphenopoly.js gets executed.

Use this to test support for every language used on the current page. If e.g. the language of the page is `lang="de-DE"` you must require `de-de` (case doesn't matter). For languages that aren't in the patterns directory a fallback must be defined (see below).

To force the usage of Hyphenopoly.js (e.g. for testing or if you prefer to use your own patterns) the special keyword `"FORCEHYPHENOPOLY"` can be used as value. Note: Disable CSS-hyphenation while using `"FORCEHYPHENOPOLY"`.

## Optional Fields
### paths
By default Hyphenopoly looks in `../Hyphenopoly/patterns/` for .hpb-files and in `../Hyphenopoly/` for other resources.

These paths can be reconfigured:
The `paths` field must be an object with two key-value-pairs:
````javascript
paths: {
    "patterndir": "../patterns/", //path to the directory of pattern files
    "maindir": "../" //path to the directory where the other ressources are stored
}
````

### fallbacks

In some cases a fallback-language need to be defined:
  * patterns for a given language are not (yet) available but patterns of an other language can be used.
  * the language on the webpage has a region tag.

E.g. you'd like to use `en-gb` patterns for `en-au` and `de` for `de-DE`:

````javascript
const Hyphenopoly = {
    require: {
        "en-au": "FORCEHYPHENOPOLY", //or a long string
        "de-DE": "FORCEHYPHENOPOLY"  //or a long string
    },
    fallbacks: {
        "en-au": "en-gb",            //use en-gb for en-au
        "de-DE": "de".               //use de for de-DE
    },
    setup: { ... }
}
````

### cacheFeatureTests
On the first run Hyphenopoly_Loader.js does the following feature tests:

* Test if the client supports **WASM**
* Test for each language in `Hyphenopoly.require` if the client supports **CSS-hyphenation**

The result of these tests is stored in `Hyphenopoly.testResults`. Because these tests take 
some time and may cause a reflow of the document, Hyphenopoly_Loader.js can store their
result and retrieve these stored results for other pages in the same browsing session.

The test results are stored in sessionStorage to assure that the tests are rerun when
the browser occasionally gets updated.

Because the law in some contries require a user opt-in or opt-out or whatever if you store
data on the client, `cacheFeatureTests` is deactivated by default and has to be activated
explicitely by hand in the [Hyphenopoly global object](./Global-Hyphenopoly-Object.md):
````javascript
const Hyphenopoly = {
    "require": {...},
    "cacheFeatureTests": true
}
````
It's up to you to comply to the cookie-regulations of your country.

### setup
By default Hyphenopoly.js hyphenates elements with the classname `.hyphenate` and sets a FOUHC-timeout of 1000ms.

#### selectors

With selectors elements can be selected very precicely without the need of adding classes to the HTML. The selectors-object is a list of key-value-pairs where the key is a selector and the value is an object of settings specific to the selected elements.

````javascript
setup: {
    selectors: {
        "p": {}, // This selects all <p> elements for hyphenation with default settings
        ".content, .title": { // This selects all elements with class .content and .title and sets minWordLength to 4 for these elements
            minWordLength: 4
        }
    }
}
````
See [CSS-Selectors on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) for a complete reference on CSS-Selectors.

Note: There was a field called `classnames` in older versions of Hyphenopoly. `classnames` had been deprecated since v2.6.0 and are completly removed in v3.0.0 in favor of `selectors`.

#### Optional fields in setup
See [Setup](./Setup.md)

### Events
See [Events](./Events.md)

### Hyphenate manually
See [Hyphenators](./Hyphenators.md)

### Unhyphenate
To remove all hyphenation previously applied by Hyphenopoly call `Hyphenopoly.unhyphenate();`.

## Putting it all together
A typical init could look like this:
````javascript
const Hyphenopoly = {
    require: {
        "en-us": "supercalifragilisticexpialidocious"
    },
    setup: {
        selectors: {
            ".text": {}
        }
    },
    handleEvent: {
        error: function (e) {
            e.preventDefault(); //don't show error messages in console
        }
    }
}
````

## Internal Fields
If you `console.dir(Hyphenopoly)` you'll see lots of other data that is internally used by Hyphenopoly_Loader.js and Hyphenopoly.js but isn't meant to be changed by the user.

## Reclaim memory
Hyphenopoly is quite hungry regarding to memory usage: for each language 2MB of wasm/asm memory are allocated. If you're done with Hyphenopoly you can set `window.Hyphenopoly = null` and leave it to the garbage collector to free the memory:

````javascript
handleEvent: {
    hyphenopolyEnd: function (e) {
        window.Hyphenopoly = null;
    }
}
````
See [Events](./Events.md) for more details about the `hyphenopolyEnd`-event.