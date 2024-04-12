# Hyphenation errors
Automatic hyphenation can not be error-free! Because ...
* ... [homographs](https://en.wikipedia.org/wiki/Homograph) may be hyphenated differently.
    ````
    desert (arid land) -> des‧ert
    desert (to leave) -> de‧sert
    ````
    In some patterns, this is solved by not hyphenating ambiguous words at all.
* ... [neologisms](https://en.wikipedia.org/wiki/Neologism) that are not in the list of words used for pattern creation may be hyphenated incorrectly.
    ````
    blogosphere -> blog·o·sphere (Merriam webster)
        // bl‧o‧gos‧phere (en-us patterns)
        // blo‧go‧sphere (en-gb patterns)
    ````
* ... the rules for hyphenation may have changed or are not specified unambiguously.
    ````
    dictionary -> dic‧tion‧ary (Wiktionary)
        // dic·tio·nary (Merriam-Webster)
    ````
* ... the patterns differ in quality. Some are very new and reflect the current state of the language, others are older. Some are based on a very large list of words, others are crafted by hand (which is not necessarily bad).

* ... patterns are made for a specific set of characters (the alphabet of the respective language). So e.g.
`en-us` patterns will not be able to correctly hyphenate a word that contains a character outside of the range `[a-z]` (Hyphenopoly doesn't even try to hyphenate in this case, but rather leaves the word unchanged).

In any case, automatic hyphenation needs proofreading and may need some intervention.

## Proofread
Use a visible hyphen character to display all hyphen opportunities:
````javascript
Hyphenopoly.config({
    require: [...],
    setup: {
        selectors: {
            ".hyphenate": {
                hyphen: "•"
            }
        }
    }
});
````
See also [Setup#hyphen](./Setup.md#hyphen)

## Fix hyphenation
There are three levels of fixing possibilities:
1. [Directly in the text](#fix-hyphenation-in-the-text)
2. [Defining hyphenation exceptions for Hyphenopoly](#define-hyphenation-exceptions)
3. [Improve patterns](#help-to-improve-the-patterns)

### Fix hyphenation in the text
Words containing a soft hyphen (&amp;shy;) will not be hyphenated by Hyphenopoly.js. Therefore, you can simply add soft hyphens manually to 'overwrite' automatic hyphenation.

__pro:__
- easy to do

__contra:__
- needs to be repeated for every occurrence of the word
- has no effect in the long term (others will not benefit)

### Define hyphenation exceptions.
Hyphenopoly.js has an [API for hyphenation exceptions](https://github.com/mnater/Hyphenopoly/wiki/Setup#exceptions):

````javascript
Hyphenopoly.config({
    require: {...},
    setup: {
        exceptions: {
            "en-us": "desert, dic-tion-ary, dic-tion-aries, blog-o-sphere" //language-specific exceptions
        },
        selectors: {...}
    }
});
````
In the example above, Hyphenopoly.js will never hyphenate the word "desert" and will hyphenate the words "dictionary", "dictionaries" and "blogosphere" at the positions marked with a hyphen-minus. Exceptions are case-sensitive. The example above will not work for capitalized words (e.g. "Desert").

__pro:__
- one place for all exceptions
- exceptions apply to all occurrences of the words

__contra:__
- needs carefulness
- has no effect in the long term (others will not benefit)

### Help to improve the patterns
Go to [http://www.hyphenation.org/](http://www.hyphenation.org/) and help to improve the patterns.

__pro:__
- others will benefit (Mozilla, Apple, the whole TeX-community and many others rely on these patterns)
- the error will be fixed in long term (sometimes, maybe)

__contra:__
- fixing patterns often takes a long time (not all patterns are actively maintained)
- fixing the patterns often requires extended knowledge

As an intermediate step to improved patterns, Hyphenopoly has the ability to include exceptions in the wasm-file. Feel free to [open an issue](https://github.com/mnater/Hyphenopoly/issues) if you have a good list
of exceptions for a language.
