# Hyphenopoly.js
Hyphenopoly.js is a JavaScript-polyfill for hyphenation in HTML: it hyphenates text if the user agent does not support CSS-hyphenation at all or not for the required languages.

The package consists of the following parts:
- _Hyphenopoly_Loader.js_ (~13KB unpacked, ~2.5KB minified and compressed): feature-checks the client and loads other ressources if necessary.
- _Hyphenopoly.js_ (~30KB unpacked, ~4KB minified and compressed): does the whole DOM-foo and wraps (w)asm.
- _hyphenEngine.wasm_ (~1KB uncompressed): wasm code for creating pattern trie and finding hyphenation points.
- _hyphenEngine.asm.js_ (~7KB uncompressed, ~1KB minified and compressed): fallback for clients that don't support wasm.
- _pattern.hpb_ (sizes differ! e.g. en-us.hpb: ~29KB): space saving binary format of the hyphenation patterns (including their license).

# Usage
Place all code for Hyphenopoly at the top of the header (immediatly after the `<title>` tag) to ensure ressources are loaded as early as possible.
You'll have to insert two script blocks. In the first block provide the initial configurations for Hyphenopoly_Loader as inline script. In the second block load Hyphenopoly_Loader.js as external script.
Also, don't forget to enable CSS hyphenation.

Example (http://mnater.github.io/Hyphenopoly/example1.html):
```html
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8">
        <title>Example 1</title>
        <script>
        var Hyphenopoly = {
            require: {
                "la": "honorificabilitudinitas"
            }
        };
        </script>
        <script src="../Hyphenopoly_Loader.js"></script>
        <style type="text/css">
            .hyphenate {
                hyphens: auto;
                -ms-hyphens: auto;
                -moz-hyphens: auto;
                -webkit-hyphens: auto;
            }
        </style>
    </head>
    <body>
        <h1>Example 1</h1>
        <p class="hyphenate" lang="la">Qua de causa Helvetii quoque reliquos Gallos virtute praecedunt, quod fere cotidianis proeliis cum Germanis contendunt, cum aut suis finibus eos prohibent aut ipsi in eorum finibus bellum gerunt.</p>
    </body>
</html>
```
Let's go through this example step by step:

## UTF-8
Make sure your page is encoded as utf-8.

## First script block – configurations
Hyphenopoly_Loader.js needs some information to run. This information is provided in a globally accessible Object called `Hyphenopoly`. Hyphenopoly_Loader.js and (if necessary) Hyphenopoly.js will add other methods and properties only to this object – there will be no other global variables/functions beyond this object.

### require
The `Hyphenopoly` object must have exactly one property called `require` which itself is an object containing at least one nameValuePair where the name is a language code string (Some patterns are region-specific. See the patterns directory for supported languages. E.g. just using `en` won't work, use either `en-us`or `en-gb`) and the value is a long word string in that language (preferably more than 12 characters long).

Hyphenator_Loader.js will feature test the client (aka browser, aka user agent) for CSS-hyphens support for the given languages with the given words respectivly. In the example above it will test if the client supports CSS-hyphenation for latin. If your page contains more than just one language just add more lines.

If you want to force the usage of Hyphenopoly.js for a language (e.g. for testing purposes) write `"FORCEHYPHENOPOLY"` instead of the long word.


## Second script block – load and run Hyphenopoly_Loader.js
Hyphenopoly_Loader.js tests if the browser supports CSS hyphenation for the language(s) given in `Hyphenopoly.require`. If one of the given languages isn't supported it automatically hides the documents contents and loads Hyphenopoly.js and the necessary patterns. Hyphenopoly.js – once loaded – will hyphenate the elements according to the settings and unhide the document when it's done. If something goes wrong and Hyphenopoly.js is unable to unhide the document Hyphenopoly_Loader.js has a timeout that kicks in after some time (defaults to 1000ms) and undhides the document and writes a message to the console.
If the browser supports all required languages the script deletes the `Hyphenopoly`-object and terminates without further ado.

## enable CSS-hyphenation
Hyphenopoly by default hyphenates elements (and their children) with the classname `.hyphenate`. Don't forget to enable CSS-hyphenation for the classes eventually handled by Hyphenopoly.

# Automatic hyphenation
The algorithm used for hyphenation was developped by Franklin M. Liang for TeX. It works more or less like this:

1. Load a set of precomputed language specific patterns. The patterns are stored in a structure called a trie, which is very efficient for this task.
2. Collect all patterns that are a substring of the word to be hyphenated.
3. Combine the numerical values between characters: higher values overwrite lower values.
4. Odd values are hyphenation points (except if the hyphenation point is left from leftmin and right from rightmin), replace them with a soft hyphen and drop the other values.
5. Repeat 2. - 4. for all words longer than minWordLength

Example:
````
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

# Hyphenopoly.js vs. Hyphenator.js
Hyphenator.js (https://github.com/mnater/Hyphenator) started 2007 and had evolved ever since.
But web browsers have evolved much more!
Almost all of them support native hyphenation (https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens) for a specific set of languages (https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens#Browser_compatibility). So it was time for something new!

Hyphenopoly.js is based on Hyphenator.js (they share some code) but - in favor of simplicity and speed – lacks many features of Hyphenator.js. Most of these features aren't needed in modern webdesign anymore:
- dropped support for usage as bookmarklet
- dropped support for frames
- dropped suppord for ancient browsers
- dropped caching of patterns in browser storage
- dropped breaking of non-textual content (urls, code etc.)
- and some more…

If you need one of those features use Hyphenator.js – or give some feedback and proof that the feature is really useful and should be implemented in Hyphenopoly.js

On the other hand Hyphenopoly has a much finer-grained configuration system that allows you to make settings based on CSS-classes.
And last but not least it is faster than Hyphenator.js
