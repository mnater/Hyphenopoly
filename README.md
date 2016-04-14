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

#Usage
See tests in the testsuite-directory.

#Todo
- [ ] documentation (general, how-tos and API)
- [ ] more tests