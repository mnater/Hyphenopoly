# Configure and run Hyphenopoly

___Note: The API for using Hyphenopoly on websites changed with version 5.___

This is a minimal embedding of Hyphenopoly on a website:
````html
<script src="../Hyphenopoly_Loader.js"></script>
<script>
    Hyphenopoly.config({
        require: {
            "en-us": "supercalifragilisticexpialidocious"
        }
    });
</script>
````
The first script tag loads `Hyphenopoly_Loader.js` which registers the global object `window.Hyphenopoly`. This is the one and only global that is set by Hyphenopoly.

In the second script tag, Hyphenopoly gets configured. This also runs every step necessary to hyphenate the page.

To configure Hyphenopoly, you pass an object with the values defined here to the function `Hyphenopoly.config()`. The settings in this object have multiple layers, and each layer (if present) has mandatory and optional settings.

The first layer contains settings for the general behavior of Hyphenopoly_Loader.js (`require`, `handleEvent` etc.). This first layer may contain a property called `setup` which contains the second layer.

The second layer defines the behavior of Hyphenopoly.js. There are global settings (like `defaultLanguage`, `safeCopy` etc.) that are independent of the respective element selectors. And there are selector-based settings (like `minWordLength`, `leftmin` etc.) that apply only to the given selectors.

## Calling Hyphenopoly.configure
In most cases, you'll call `Hyphenopoly.configure()` just once at the beginning of the page load. In some cases (e.g. if a user changes the language of the site), you need to call this function again (and again).

On every call of `Hyphenopoly.configure()` the settings are extended or overwritten and, if necessary, new .wasm-files are loaded.

## First layer
### require (mandatory)
The config-Object must contain exactly one field called `require`. It defines the language(s) used on the page.

The `require` field must be an object of key-value-pairs where the keys are language codes and the values are long words (>=12 characters) in the required language.
````javascript
Hyphenopoly.config({
    require: {
        "en-us": "supercalifragilisticexpialidocious",
        "de": "Silbentrennungsalgorithmus"
    }
});
````
Hyphenopoly_Loader.js feature tests the browser for CSS-hyphenation support of the required languages using the long word.
If the feature test indicates that the browser doesn't support CSS-hyphenation for at least one language, all the necessary resources will be loaded and Hyphenopoly.js will be executed.

Use this to test support for every language used on the current page. If, e.g. the language of the page is `lang="de-DE"`, you must require `de-de` (case doesn't matter). A fallback must be defined for languages that aren't in the patterns directory (see below).

To force the usage of Hyphenopoly.js (e.g. for testing or if you prefer to use Hyhenopolys own patterns), the special keyword `"FORCEHYPHENOPOLY"` can be used as value. Note: Disable CSS-hyphenation while using `"FORCEHYPHENOPOLY"`.

### paths (optional)
By default, Hyphenopoly looks in `../Hyphenopoly/patterns/` for .wasm-files and in `../Hyphenopoly/` for other resources.

These paths can be reconfigured:
The `paths` field must be an object with two key-value-pairs:
````javascript
Hyphenopoly.config({
    require: {...},
    paths: {
        "patterndir": "../patterns/", //path to the directory of pattern files
        "maindir": "../" //path to the directory where the other ressources are stored
    }
});
````

### fallbacks (optional)

In some cases, a fallback language needs to be defined:
* Patterns for a given language are not (yet) available; however patterns of an other language can be used.
* The language on the webpage has a region tag.

E.g. you'd like to use `en-gb` patterns for `en-au` and `de` for `de-DE`:

````javascript
Hyphenopoly.config({
    require: {
        "en-au": "FORCEHYPHENOPOLY", //or a long string
        "de-DE": "FORCEHYPHENOPOLY"  //or a long string
    },
    fallbacks: {
        "en-au": "en-gb",            //use en-gb for en-au
        "de-DE": "de".               //use de for de-DE
    },
    setup: { ... }
});
````

### cacheFeatureTests (optional)
On the first run Hyphenopoly_Loader.js feature tests the client for support of **CSS-hyphenation**
for each language in `Hyphenopoly.require`.

The result of these tests is stored in `Hyphenopoly.cf` (cf = client features). Because these tests may take 
some time and may cause a reflow of the document, Hyphenopoly_Loader.js can store their
results and retrieve these stored results for other pages in the same browsing session.

The test results are stored in sessionStorage to ensure that the tests are rerun when
the browser occasionally gets updated.

Because the law in some countries require a user opt-in or opt-out or whatever if you store
data on the client, `cacheFeatureTests` is deactivated by default and has to be activated
explicitly by hand in the [Hyphenopoly global object](./Global-Hyphenopoly-Object.md):
````javascript
Hyphenopoly.config({
    "require": {...},
    "cacheFeatureTests": true
});
````
It's up to you to comply with the the cookie-regulations of your country.

## Second Layer
### setup (optional)
The `setup` field gives access to the second level of configuration. It defaults to the following configuration:
````javascript
Hyphenopoly.config({
    "require": {...},
    "setup": {
        CORScredentials: "include",
        defaultLanguage: "en-us",
        dontHyphenateClass: "donthyphenate",
        hide: "element",
        keepAlive: true,
        normalize: false,
        processShadows: false,
        safeCopy: true,
        timeout: 1000,
        selectors: {
            ".hyphenate": {}
        }
    }
});
````
This list is not conclusive. For full documentation, see [Setup](./Setup.md).

#### selectors 

With selectors, elements can be selected very precisely without the need to add classes to the HTML. The selectors-object is a list of key-value-pairs where the key is a selector and the value is an object of settings specific to the selected elements.

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

### Events (optional)
See [Events](./Events.md)

### Hyphenate manually
See [Hyphenators](./Hyphenators.md)

### Unhyphenate
To remove all hyphenation previously applied by Hyphenopoly call `Hyphenopoly.unhyphenate();`.
This method asynchronously returns the elements that have been unhyphenated in the data structure used internally.
````javascript
Hyphenopoly.unhyphenate().then((elements) => {
    console.log(elements);
});
````

## Putting it all together
A typical init could look like this:
````javascript
Hyphenopoly.config({
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
});
````

## Internal Fields
If you `console.dir(Hyphenopoly)` you'll see lots of other data that is internally used by Hyphenopoly_Loader.js and Hyphenopoly.js but isn't meant to be changed by the user.
