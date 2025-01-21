# Version History

## Next
### Added
* fi-x-school patterns
### Fixed
* refactor hyphenopoly.module.js to keep some internal structures private
* updated patterns: pt, rm, sq
* bump devDependencies
* small perf improvements
### Test
* update to eslint v9 and typescript-eslint v8

## Version 6.0.0 (2024-06-30)
### Breaking changes
* Hyphenopoly.config() in hyphenopoly.module.js now always returns a `Map` (issue #209)
* Drop support for outdated (eol) node versions. Hyphenopoly.module now requires node >= 18
### Fixed
* bump devDependencies
* small perf related refactorings
### Test
* use eslint flatConfig

## Version 5.3.0 (2023-11-24)
### Added
* loader/loaderSync now has a second argument containing an URL to the patternDirectory (issue #207)
### Fixed
* simplify events and clarify in docs
* bump devDependencies

## Version 5.2.1 (2023-10-19)
### Fixed
* created and updated patterns for german
* bump devDependencies
### Test
* refactor testsuite: lint code

## Version 5.2.0 (2023-10-04)
### Fixed
* unhyphenate all childNodes (issue #205)
* translateMap now uses lesser load/stores
* Refactor how words are sent to wasm-modules: word delimiters are now added in the wasm-module instead of js
* bump devDependencies
### Doc
* Update docs for standalone wasm-usage

## Version 5.2.0-beta.2 (2023-08-26)
### Fixed
* translateMap now uses lesser load/stores

## Version 5.2.0-beta.1 (2023-07-03)
### Fixed
* Refactor how words are sent to wasm-modules: word delimiters are now added in the wasm-module instead of js
* bump devDependencies
### Doc
* Update docs for standalone wasm-usage

## Version 5.1.0 (2023-05-19)
### Added
* Faroese hyphenation (thanks to [Claus Eggers](https://github.com/clauseggers))
* syllabification patterns for german (de-x-syllable)
* use AbortController to halt fetches on timeout (https://mnater.github.io/Hyphenopoly/Setup.html#timeout)

## Version 5.0.0 (2023-01-03)
Aggregation of the changes from beta-1 to beta-5
### Breaking changes
* Changed API for embedding Hyphenopoly in webpages.
* Use esm instead of require
* [require loader function](https://mnater.github.io/Hyphenopoly/Module.html)
### Fixed
* created and updated patterns for german
* updated patterns from tex-hyphen
* bump devDependencies
### Added
* Albanian hyphenation
* Pali hyphenation
### Doc
* Update documenation for esm module
* Added documentation for using .wasm modules outside Hyphenopoly
### Test
* use c8 to check coverage

## Version 5.0.0-beta-6 (2022-10-20)
### Breaking changes
* [require loader function](https://mnater.github.io/Hyphenopoly/Module.html)
### Fixed
* bump devDependencies

## Version 5.0.0-beta-5 (2022-09-29)
### Fixed
* created and updated patterns for german
* updated patterns from tex-hyphen
* bump devDependencies
### Added
* Albanian hyphenation
* Pali hyphenation

## Version 5.0.0-beta-4 (2022-04-06)
### Breaking changes
* Use esm instead of require
### Added
* Albanian hyphenation
* Pali hyphenation
### Doc
* Update documenation for esm module
* Added documentation for using .wasm modules outside Hyphenopoly
### Test
* use c8 to check coverage
### Fixed
* bump devDependencies
* Perf: improve select and rank (64Bit load and popcnt)
* Perf: improve get1PosInDWord

## Version 5.0.0-beta-3 (2022-01-08)
### Doc
* Update examples to new API
* Update copyright to 2022
### Fixed
* Perf: optimize creation of word finding RegEx
* Perf: write hyphenation data in little endian
* bump devDependencies

## Version 5.0.0-beta-2 (2021-11-03)
### Breaking changes
* Changed API for embedding Hyphenopoly in webpages.
### Doc
* Added documentation for Hyphenopoly.config()
### Fixed
* Cloning of modules for fallbacks not necessary any more
* Cleaning up code
* bump devDependencies

## Version 5.0.0-beta-1 (2021-09-13)
### Breaking changes
* The wasm modules internally use a succint trie data structure, memory layout has changed
* Drop support for outdated (eol) node versions. Hyphenopoly.module now requires node >= 12

## Version 4.12.0 (2021-07-21)
### Fixed
* Fixed memory access out of bounds (#165)
* Fixed Module aborting with SIGBUS error (#169)
* bump devDependencies

## Version 4.11.0 (2021-03-07)
### Fixed
* Fixed too long word error not stopping hyphenation in module (7373d9d80c6b632d46194f99d6778cbb04f260e1)
* Refactor code to determine language of elements (5c8379f230e3f34e4f3e73fcb32f81fccb383f24)
* Refactor code to store word in memory (7373d9d80c6b632d46194f99d6778cbb04f260e1)
* Refactor translateMap (35c8eb3dab3010a96feef589b049d2349d0a3bf1)
* bump devDependencies

## Version 4.10.0 (2021-01-05)
### Fixed
* Prevent error on elements with lang="zxx" (#160)
* Refactor code to determine language of elements (79735497cb51f15fbc6932dce809293f4cd1050e)
* Enhance wasm.hyphenate() (1567e276ccdae2ca1b611c01b51e341e6ddb9dca)
* bump devDependencies

## Version 4.9.0 (2020-12-01)
### Fixed
* Add compatibility to node v10 (thanks to yashha and danburzo, #154)

### Changed
* wasm.hyphenate() returns the length of the hyphenated word - or 0 on error (d1c0d8e23485fc9ae9468d71c4414236a096bd3d)
* Extended CI testing to all node LTS versions (#156)
* Add lint script to pretest (4afce88b1b1341daed256ef8fd99e3206c21dd2b)

## Version 4.8.1 (2020-11-05)
### Fixed
* Don't hyphenate words with (non-normalized) COMBINING ACCENTS (#147)
* bump devDependencies

### Changed
* use TextDecoder instead of StringDecoder

### Doc
* Update the webpack example for webpack 5.4.0

## Version 4.8.0 (2020-10-09)
### Fixed
* bump dependencies in Webpack example
* bump devDependencies

### Changed
* linked list based pattern trie needs much less memory

## Version 4.7.0 (2020-08-05)
### Fixed
* retrieving maindir now works correctly if the filename is mangled (#135)
* bump devDependencies

### Changed
* use nb instead of nb-no, equivalent to nn
* remove some rare/ancient languages (cop, mul-ethi, grc, la-x-liturgic)
* tooling now supports extraction of patterns from .tex files (#138)

## Version 4.6.0 (2020-06-29)
### Added
* support for hyphenating in shadowDOM (#131)

### Fixed
* treatment of words with format chars (#132)
* bump devDependencies

## Version 4.5.0 (2020-05-21)
### Changed
* improve error handling (issue #122) - Error-Object returned on error

### Fixed
* check if elements are collected (issue #125)
* enable safeCopy for hyphenators (issue #117)
* reduce code size
* bump devDependencies

## Version 4.4.0 (2020-05-04)
### Changed
* convert objects to maps (no API changes)

### Fixed
* bumb devDependencies
* simplify webpack example

## Version 4.3.0 (2020-04-17)
### Fixed
* Hyphenators handle subtags with different lang consistently (issue #108)
* Better word matching RegEx (issue #109)
* Emit multiple errors (instead of just one) (issue #112)
* bumpDevDependencies

### Added
* API to define character substitutions: [https://mnater.github.io/Hyphenopoly/Setup.html#substitute](doc) (issue #109)

### Changed
* Words with foreign characters are not hyphenated anymore (issue #109)

## Version 4.2.1 (2020-03-31)
### Fixed
* Enhance documentation (serve minified hyphenopoly in [https://mnater.github.io/Hyphenopoly/min/](https://mnater.github.io/Hyphenopoly/min/) and move examples to examples directory) (issue #104)
* exclude .DS_Store from npm package
* bumpDevDependencies

## Version 4.2.0 (2020-03-27)
### Added
* Added support for Macedonian

### Changed
* RequestCredentials are now configurable. See [doc](https://mnater.github.io/Hyphenopoly/Setup.html#corscredentials) (issue #98)
* Hyphenators now hyphenate content of childNodes, too (#issue96)
* Update patterns for Spanish

### Fixed
* Don't try to hyphenate whitespace-only text nodes
* bump devDependencies

## Version 4.1.0 (2020-02-19)
### Changed
* Hyphenopoly.unhyphenate now returns `elements`: [doc](https://mnater.github.io/Hyphenopoly/Global-Hyphenopoly-Object.html#unhyphenate)
* \w is no longer part of the regex that finds words -> only words with characters from the alphabet (defined by patterns in the wasm module) are hyphenated
* remove -moz- prefix when feature testing for native CSS hyphens support
* disallow some characters for `hyphen` [doc](https://mnater.github.io/Hyphenopoly/Setup.html#hyphen)

### Fixed
* fix decode polyfill for Edge
* fix ability to set paths
* ensure wasm loads only once with fallbacks
* fix issue with hyphenation depending on media queries

## Version 4.0.0 (2020-02-02)
With this major update Hyphenopoly NO LONGER SUPPORTS InternetExplorer.
This step allows the usage of modern JavaScript features which leads to smaller file sizes and thus better performance.

### Changed
* No fallback to asm.js
* hyphenEngine and patterns in one file per language
* Promise based events
* Usage of modern ES2016 features

## Version 3.4.0 (2019-12-26)
### Added
* Option to disable mixed cased words (issue #91)

### Fixed
* Refactor encloseHyphenateFunction and enclHyphenate
* bump devDependencies

## Version 3.3.0 (2019-10-14)
### Added
* Add configuration option `keepAlive` (issue #69)
* Add documentation for issue #89

### Fixed
* Fixed issue where babelized Loader didn't work in iOS9 (issue #88)
* bump dev Dependencies (removed some unused eslint directives)

## Version 3.2.1 (2019-08-29)
Bugfix release, because I had to unpublish from npm

## Version 3.2.0 (2019-08-29)
### Fixed
* Fixed issue with SSL Certificates and FireFox 60.x ESR (issue #85)
* Fixed "a potential security vulnerability" in GitHub-pages dependencies
* Fixed issue with Firefox 68, where feature detection in Hyphenopoly_Loader fails
* bump devDependencies

### Changed
* OnCopy-eventHandler now also includes content with type "text/html" (besides "text/plain") (issue #87)

## Version 3.1.2 (2019-07-24)
### Fixed
* Fixed "Critical dependency: the request of a dependency is an expression" in webpack (issue #70)
* bump devDependencies

## Version 3.1.1 (2019-06-28)
### Fixed
* bump devDependencies

### Changed
* doc: build GitHub page from docs folder
* tools: move eslint config from package.json to .eslintrc
* tools: remove manual replacement of mutable globals when compiling to wasm

## Version 3.1.0 (2019-05-28)
### Fixed
* Correctly reject hyphenator promises (issue #77)
* performance: reduce file size of Hyphenopoly_Loader.js
* update devDependencies

### Added
* feature: get maindir and patterndir from currentScript

## Version 3.0.2 (2019-04-28)
### Security
* refactor(Loader): don't use innerHTML
### Fixed
* performance: slightly improved hyphenEngine
* bump devDependencies

## Version 3.0.1 (2019-04-04)
### Fixed
* Improve the way how `registerOnCopy` builds a closure. This prevents a memory leak.
* Removed "use strict" from RunKit example.
* Adapt the initial sizes of wasm-memory in some special cases

## Version 3.0.0 (2019-03-29)
### Changed
* BREAKING CHANGE: implement new hyphenation pattern binary (.hpb) format (issue #61)
    * update patterns to new format and include left-/rightmin according to source
    * update hyphenEngine.asm/.wasm to consume new pattern format
    * implement .hpb-version-check in Hyphenopoly.js and hyphenopoly.module.js
    * fix issue #65

### Added
* feat: tearDown event (issue #67)
* feat: loadError event (issue #59)
* feat: hyphenopoly.module is now browserifyable. Added new config option "loader"

### Removed
* BREAKING CHANGE: remove `Hyphenopoly.setup.classnames` – use [selectors](https://github.com/mnater/Hyphenopoly/wiki/Global-Hyphenopoly-Object#new-with-version-260-selectors) instead

## Version 2.8.0 (Feb 28, 2019)
* the error event now accepts a `lvl` field ("info"/"warn"/"error") and logs accordingly (issue #56)
* add list of supported languages in hyphenopoly.module.js (issue #57)
* improve loading of resources (issue #58)

## Version 2.7.0 (Feb 01, 2019)
* implement sync mode for node module (issue #43)
* implement sync mode for hyphenopoly.module.js (issue #47)
* fixed issue with Hyphenopoly.config sometimes not resolving (issue #52)
* enable viewport dependent hyphenation (issue #53)
* implement `Hyphenopoly.unhyphenate()` (needed for issue #53)
* get good grades in codacy.com

## Version 2.6.1 (Jan 09, 2018)
* dontHyphenateClass is configurable (issue #48)
* fixed issue with StringDecoder in older node versions (issue #45)
* small refactoring for smaller code size
* fixed a StateError in IE 11

## Version 2.6.0 (Dec 01, 2018)
* improve hiding of elements while hyphenating (issue #40)
* fix several issues with lang-fallbacks (issue #41 and #44)
* new feature: use selectors instead of classnames (issue #42)
* updated german patterns (issue #45)

## Version 2.5.1 (Nov 04, 2018)
* remove "Church Slavonic" patterns (see #38)
* fix issue #39

## Version 2.5.0 (Oct 02, 2018)
* fix issues with very long word (#33 and #34)
* Hyphenopoly exposes [Hyphenators](https://github.com/mnater/Hyphenopoly/wiki/Hyphenators)
* fix issues with very long word (#33 and #34)
* hyphenopoly.module.js is now [easy to use with browserify](https://github.com/mnater/Hyphenopoly/wiki/browserify)

## Version 2.4.0 (Sept 01, 2018)
* Implement fallback mechanism for language sub-tags where no patterns are available (e.g. en-au -> en-gb) [#29](https://github.com/mnater/Hyphenopoly/issues/29)
* updated patterns for Thai [#25](https://github.com/hyphenation/tex-hyphen/pull/25)

## Version 2.3.0 (Juli 26, 2018)
* Don't use template strings [#28](https://github.com/mnater/Hyphenopoly/issues/28)
* run feature test for wasm support only if necessary
* define node >=8.3.0 as requirement (for util.TextDecoder)
* small refactoring

## Version 2.2.0 (June 26, 2018)
* provide example.js for RunKit
* use tap instead of mocha
* [6f9e539](https://github.com/mnater/Hyphenopoly/commit/6f9e539a5dab2d1eff5bdeb0c7857c6fda9eb41e)
* bugfix: [#24](https://github.com/mnater/Hyphenopoly/issues/24): [aeefe6e](https://github.com/mnater/Hyphenopoly/commit/aeefe6e3a59e8356abc99ca490acabf6c3374d7b)

## Version 2.1.0 (May 27, 2018)
* Configure Travis-CI
* bug fixes

## Version 2.0.0 (May 27, 2018)
* Provide [node module](https://github.com/mnater/Hyphenopoly/wiki/Node-Module)
* default file locations better reflect usual installations [#19](https://github.com/mnater/Hyphenopoly/issues/19)
* Add ability to store results of feature tests (optional) [#22](https://github.com/mnater/Hyphenopoly/issues/22)
* better error handling (f4bbaa7759eed24208e5cd7c744f1131262abb20, 1c7b0b67666b507d6f6b02eea38460562a5835e4)
* correct implementation of e.preventDefault (df988788db6fb7120fc0c8a1cff1c91aac5a3998)
* fix string normalization (a3229f730f79ccdd3054cbac257b2345f5c8e11a)
* Better tooling: minify, eslint, testing (mocha), compiling [devDependencies](https://github.com/mnater/Hyphenopoly/wiki/Usage-of-devDependencies)

## Version 1.0.1 (May 13, 2018)
Prevent browsers to force layout on feature test in some cases.

## Version 1.0.0 (May 12, 2018)
First release
