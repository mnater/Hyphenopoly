#Beta warning
This is still in development. Feel free to test and provide feed-back.
API and behaviour may change often.

# Hyphenopoly.js
Hyphenopoly.js is a JavaScript-polyfill for hyphenation in HTML.
There are two parts:
- Hyphenopoly_Loader.js (4KB unpacked): checks if hyphenation of the requested language is supported on the client and loads Hyphenopoly.js and the specific language patterns if necessary.
- Hyphenopoly.js and language-patterns: client-side hyphenation of text using Franklin M. Liangs hyphenation algorithm known from TeX.

#Hyphenopoly.js vs. Hyphenator.js
Hyphenator.js (https://github.com/mnater/Hyphenator) started 2007 and has evolved ever since.
But web browsers have evolved much more!
Almost all of them support native hyphenation (https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens) for a specific set of languages (https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens#Browser_compatibility). So it's time for something new!

Hyphenopoly.js is based on Hyphenator.js (they share some code) but - in favor of simplicity and speed – lacks many features of Hyphenator.js. Most of these features aren't needed in modern webdesign anymore:
- dropped support for usage as bookmarklet
- dropped support for frames
- dropped suppord for ancient browsers
- dropped caching of patterns in browser storage
- dropped breaking of non-textual content (urls, code etc.)
- and some more…

If you need one of those features use Hyphenator.js – or give some feedback and proof that the feature is really useful and should be implemented in Hyphenopoly.js

#Automatic hyphenation
The algorithm used for hyphenation was developped by Franklin M. Liang for TeX. It works more or less like this:

1. Load a set of precomputed language specific patterns. The patterns are stored in a structure called a trie, which is very efficient for this task.
2. Collect all patterns that are a substring of the word to be hyphenated.
3. Combine the numerical values between characters: higher values overwrite lower values.
4. Odd values are hyphenation points (except if the hyphenation point is left from leftmin and right from rightmin), replace them with a soft hyphen and drop the other values.
5. Repeat 2. - 4. for all words longer than minWordLength

Example:
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

The patterns are precomputed and available for many languages on CTAN. Hyphenopoly.js uses a slightly different format (compacted and with some metadata). Patterns are computed from a large list of hyphenated words by a program called patgen. They aim to find some hyphenation points – not all – because it's better to miss a hyphenation point then to have some false hyphenation points. Most patterns are really good but none is error free.

These pattern vary in size. English patterns are around 27KB (unzipped), german patterns 81KB and hungarian 465KB! This is mostly due to the different linguistic characteristics of the languages.

#Hyphenopoly.js – typical course of action
1. The (one and only) global variable "Hyphenopoly" is set. At this point it's an object containing the required languages.
2. Hyphenopoly_Loader.js is executed. It tests if the client it runs on supports native hyphenation for all of the required languages. If at least one of these languages isn't supported Hyphenopoly.js is loaded as well as all necessary language specific patterns.
3. When the document, Hyphenopoly.js and the pattern(s) are all loaded, text in the document gets hyphenated.


#FOUHC – Flash Of UnHyphenated Content
If a browser doesn't support native hyphenation and thus loads Hyphenopoly.js text may first be rendered unhyphenated and the be repainted as soon as Hyphenopoly.js has benn loaded and run.

#Usage
At the 

#Todo
- [ ] documentation (general, how-tos and API)
- [ ] more tests
- [ ] tools: concat and minify
