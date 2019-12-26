# optional fields in `setup`
These page documents the optional fields in `setup`:
* [Global Settings](#global-settings)
  * [defaultLanguage](#defaultlanguage)
  * [dontHyphenate](#donthyphenate)
  * [dontHyphenateClass](#donthyphenateclass)
  * [exceptions](#exceptions)
  * [hide](#hide)
  * [keepAlive](#keepalive)
  * [normalize](#normalize)
  * [safeCopy](#safecopy)
  * [timeout](#timeout)
* [Selector Based Settings](#selector-based-settings)
  * [compound](#compound)
  * [hyphen](#hyphen)
  * [leftmin and rightmin](#leftmin-and-rightmin)
  * [leftminPerLang and rightminPerLang](#leftminperlang-and-rightminperlang)
  * [minWordLength](#minwordlength)
  * [mixedCase](#mixedcase)
  * [orphanControl](#orphancontrol)

## Global Settings
These settings apply to Hyphenopoly in general.

### defaultLanguage
````
type: String
default: "en-us"
````
Sets a fallback language in case no language is set in HTML.
````html
<script>
var Hyphenopoly = {
    require: {...},
    paths: {...},
    setup: {
        defaultLanguage: "en-us",
        selectors: {...}
    }
};
</script>
````
To hyphenate a text its language needs to be known to the system (be it native CSS hyphenation or Hyphenopoly.js). Thus the language needs to be set in HTML either for the whole document (`<html lang="...">`) or on the elements.
Hyphenopoly.js does a good job here: it searches for a `lang`-tag going up all the parentNodes of the DOM-tree and passes the language down to childNodes. But if no such tag can be found it needs `defaultLanguage`-fall back.

_It's strongly recommended to set the language in HTML and use `defaultLanguage` only in cases where this wouldn't be possible!_

### dontHyphenate
````
type: Object
default: {
    video: true,
    audio: true,
    script: true,
    code: true,
    pre: true,
    img: true,
    br: true,
    samp: true,
    kbd: true,
    var: true,
    abbr: true,
    acronym: true,
    sub: true,
    sup: true,
    button: true,
    option: true,
    label: true,
    textarea: true,
    input: true,
    math: true,
    svg: true,
    style: true
}
````
Elements in this list with a `true`-value and their contents are not hyphenated. Change the value to `false` or delete the line to change this.
````html
<script>
var Hyphenopoly = {
    require: [...],
    paths: [...],
    setup: {
        dontHyphenate: {
            video: true,
            audio: true,
            script: true,
            code: true,
            pre: true,
            img: true,
            br: true,
            samp: true,
            kbd: true,
            var: true,
            abbr: true,
            acronym: true,
            sub: true,
            sup: true,
            button: false, //<--
            option: true,
            label: true,
            textarea: true,
            input: true,
            math: true,
            svg: true,
            style: true
        },
        selectors: {...}
    }
};
</script>
````

### dontHyphenateClass
````
type: String
default: "donthyphenate"
````
Elements with this class will not be hyphenated by Hyphenopoly.js
````html
<script>
var Hyphenopoly = {
    require: [...],
    paths: [...],
    setup: {
        dontHyphenateClass: "donthyphenate",
        selectors: {...}
    }
};
</script>
````
Hyphenopoly.js hyphenates all elements that match the selectors defined in `selectors` – and it hyphenates their childElements unless they have the `dontHyphenateClass` set.
````html
<div class="hyphenate">
    <p>This text will be hyphenated by default.</p>
    <p>This will. <span class="donthyphenate">This will not</span> And this will…</p>
</div>
````

### exceptions
````
type: Object
default: undefined
````
Provide exceptions for hyphenation.
````html
<script>
var Hyphenopoly = {
    require: {...},
    paths: {...},
    setup: {
        exceptions: {
            "global": "FORTRAN", //excpetions for all languages
            "en-us": "Web-Assembly, Java-Script" //language-specific exceptions
        },
        selectors: {...}
    }
};
</script>
````
The exceptions object must contain language-codes as keys (or "global" for all languages). The values must be words separated by `,⎵` (comma, space), where a hyphen-minus marks the hyphenation points.
If the word does not contain a hyphen, it will not be hyphenated by Hyphenopoly.js

### hide
````
type: string ("all" | "element" | "text")
default: "all"
````
Define if and how elements are made unvisible while being hyphenated.
````html
<script>
var Hyphenopoly = {
    require: {...},
    paths: {...},
    setup: {
        hide: "element"
    }
};
</script>
````
To prevent a flash of unhyphenated content (FOUHC) Hyphenopoly hides the elements being hyphenated. Depending on the structure of your page this can lead to visual flicker. You can change the way Hyphenopoly hides the content:

- `all` hides the whole page by inserting the following CSS-rule `html {visibility: hidden !important}`
- `element` hides the selected elements by inserting the following CSS-rule for each selector: `<selector> {visibility: hidden !important}`
- `text` hides only the text of the selected elements by inserting the following CSS-rule for each selector: `<selector> {color: transparent !important}`
- any other keyword prevents hiding.

These CSS-rules are removed, when Hyphenopoly has finished its job or when the [timeout](#timeout) gets fired.

### keepAlive
````
type: boolean
default: true
````
Keeps object `window.Hyphenopoly` in memory to be accessible for further use (e.g. hyphenators). If Hyphenopoly is not used after initial run, it should be cleared to save memory.
````html
<script>
var Hyphenopoly = {
    require: {...},
    paths: {...},
    setup: {
        keepAlive: false,
        selectors: {...}
    }
};
</script>
````

### normalize
````
type: boolean
default: false
````
Normalize words before hyphenation.
````html
<script>
var Hyphenopoly = {
    require: {...},
    paths: {...},
    setup: {
        normalize: true,
        selectors: {...}
    }
};
</script>
````
The pattern files work with _precomposed_ characters. So an `Å` (LATIN CAPITAL LETTER A WITH RING ABOVE) must not be composed of `A` (LATIN CAPITAL LETTER A) and ` ̊` (COMBINING RING ABOVE) to be recognizable by hyphenation-engine.
If the text contains _composed_ characters they must be normalised to _precomposed_ characters. If `normalize` is activated and the user agent supports `String.prototype.normalize()` this can happen automatically.
Since this comes with a performance penalty it is deactivated by default and it's recommended to use _precomposed_ characters in HTML.

### safeCopy
````
type: boolean
default: true
````
Removes soft hyphens from the clipboard.
````html
<script>
var Hyphenopoly = {
    require: {...},
    paths: {...},
    setup: {
        safeCopy: true,
        selectors: {...}
    }
};
</script>
````
To prevent soft hyphens from beeing copied to the clipboard, Hyphenopoly.js registers a `onCopy`-Event on hyphenated elements. When text is copied to the clipboard, this event fires and soft hyphens are removed.
_It does NOT remove other `hyphen`-characters!_
This feature is on by default, but it's a hack – disable it if you don't like it.

### timeout
````
type: number
default: 1000
````

Sets a timeout in ms after which in case of a failure Hyphenopoly stops executing and unhides the text.
````html
<script>
var Hyphenopoly = {
    require: {...},
    paths: {...},
    setup: {
        timeout: 1000,
        selectors: {...}
    }
};
</script>
````
To prevent a _Flash Of Unhyphenated Content (FOUHC)_ Hyphenopoly_Loader.js hides text to be hyphenated until hyphenation is done. If something goes wrong (e.g. a ressource didn't load correctly) this timeout saves us from an empty page. The timeout is cleared when hyphenation succeeds.
If the timeout kicks in, the `onTimeOut`event is fired.

See [hide](#hide) about different ways of hiding.

## Selector Based Settings
These settings can be set for each set of elements that are matched by the given selector.

### compound
````
type: string ("auto" | "all" | "hyphen")
default: "hyphen"
````
Define how compound words (words containing a hyphen) will be treated.
````html
<script>
var Hyphenopoly = {
    require: {...},
    paths: {...},
    setup: {
        selectors: {
            ".hyphenate": {
                compound: "hyphen"
            }
        }
    }
};
</script>
````
Not all browsers recognize the hyphen as a possible line-breaking spot. Thus we have to handle this.
There are three possible values:

**"auto":** leave the hyphen as it is and hyphenate the parts: `com|pu|ter-aid|ed`

**"all":** hyphenate the parts and insert a zero-width space after the hyphen: `com|pu|ter-|aid|ed`

**"hyphen":** don't hyphenate the parts but insert a zero-width space after the hyphen: `computer-|aided`

### hyphen
````
type: String (a single character!)
default: "\u00AD" (&shy; | &#173;)
````
The hyphen character.
````html
<script>
var Hyphenopoly = {
    require: {...},
    paths: {...},
    setup: {
        selectors: {
            ".hyphenate": {
                hyphen: "\u00AD"
            }
        }
    }
};
</script>
````
Can be set to something visible for testing and documentation.

### leftmin and rightmin
````
type: number
default: 0
````
Minimal number of characters before the first hyphenation point (leftmin). And minimal number of characters after the last hyphenation point (rightmin).
````html
<script>
var Hyphenopoly = {
    require: {...},
    paths: {...},
    setup: {
        selectors: {
            ".hyphenate": {
                leftmin: 0,
                rightmin: 0
            }
        }
    }
};
</script>
````
Leftmin and rightmin are provided by the pattern-file but can be overwritten with larger values.
If the value is smaller than the value from the pattern-file, it has no effect. `leftmin` and `rightmin` have an effect for the whole set of elements, disregarding the language of the subelements.

### leftminPerLang and rightminPerLang:
````
type: object | 0
default: 0
````
While `leftmin` and `rightmin` have an effect on all elements that are matched by the selector, `leftminPerLang` and `rightminPerLang` are language specific.
````html
<script>
var Hyphenopoly = {
    require: {...},
    paths: {...},
    setup: {
        selectors: {
            ".hyphenate": {
                leftminPerLang: {
                    "en-us": 3,
                    "de": 4
                }
            }
        }
    }
};
</script>
````
If both (left-/rightmin and left-/rightminPerLanguage) are given, the highest value is respectively taken in account.

### minWordLength
````
type: number
default: 6
````
Minimal length of words to be hyphenated.
````html
<script>
var Hyphenopoly = {
    require: {...},
    paths: {...},
    setup: {
        selectors: {
            ".hyphenate": {
                minWordLength: 6
            }
        }
    }
};
</script>
````

### mixedCase
````
type: boolean
default: true
````
If set to false, prevents hyphenation of mixed case words.
````html
<script>
var Hyphenopoly = {
    require: {...},
    paths: {...},
    setup: {
        selectors: {
            ".hyphenate": {
                mixedCase: false
            }
        }
    }
};
</script>
````
According to a [note in the css-text draft](https://drafts.csswg.org/css-text-3/#valdef-hyphens-auto)
mixed case words may not be hyphenated. This setting defaults to true, because this simple heuristic
excludes words at the beginning of a sentence from being hyphenated.

### orphanControl
````
type: number (1 | 2 | 3)
default: 1
````
Prevent [orphans](https://en.wikipedia.org/wiki/Widows_and_orphans)
````html
<script>
var Hyphenopoly = {
    require: {...},
    paths: {...},
    setup: {
        selectors: {
            ".hyphenate": {
                orphanControl: 1
            }
        }
    }
};
</script>
````
There are three stages:
1. allow orphans
2. don't hyphenate the last word of an element
3. don't hyphenate the last word of an element and replace the space before with a no-breaking space