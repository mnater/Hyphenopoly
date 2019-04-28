# Version History

## Version 3.0.2 (2019-04-28)
### Security
*   refactor(Loader): don't use innerHTML
### Fixed
*   performance: slightly improved hyphenEngine
*   bump devDependencies

## Version 3.0.1 (2019-04-04)
### Fixed
*   Improve the way how `registerOnCopy` builds a closure. This prevents a memory leak.
*   Removed "use strict" from RunKit example.
*   Adapt the initial sizes of wasm-memory in some special cases

## Version 3.0.0 (2019-03-29)
### Changed
*   BREAKING CHANGE: implement new hyphenation pattern binary (.hpb) format (issue #61)
    *   update patterns to new format and include left-/rightmin according to source
    *   update hyphenEngine.asm/.wasm to consume new pattern format
    *   implement .hpb-version-check in Hyphenopoly.js and hyphenopoly.module.js
    *   fix issue #65

### Added
*   feat: tearDown event (issue #67)
*   feat: loadError event (issue #59)
*   feat: hyphenopoly.module is now browserifyable. Added new config option "loader"

### Removed
*   BREAKING CHANGE: remove `Hyphenopoly.setup.classnames` – use [selectors](https://github.com/mnater/Hyphenopoly/wiki/Global-Hyphenopoly-Object#new-with-version-260-selectors) instead

## Version 2.8.0 (Feb 28, 2019)
*   the error event now accepts a `lvl` field ("info"/"warn"/"error") and logs accordingly (issue #56)
*   add list of supported languages in hyphenopoly.module.js (issue #57)
*   improve loading of ressources (issue #58)

## Version 2.7.0 (Feb 01, 2019)
*   implement sync mode for node module (issue #43)
*   implement sync mode for hyphenopoly.module.js (issue #47)
*   fixed issue with Hyphenopoly.config sometimes not resolving (issue #52)
*   enable viewport dependent hyphenation (issue #53)
*   implement `Hyphenopoly.unhyphenate()` (needed for issue #53)
*   get good grades in codacy.com

## Version 2.6.1 (Jan 09, 2018)
*   dontHyphenateClass is configurable (issue #48)
*   fixed issue with StringDecoder in older node versions (issue #45)
*   small refactorings for smaller codesize
*   fixed a StateError in IE 11

## Version 2.6.0 (Dec 01, 2018)
*   improve hiding of elements while hyphenating (issue #40)
*   fix several issues with lang-fallbacks (issue #41 and #44)
*   new feature: use selectors instead of classnames (issue #42)
*   updated german patterns (issue #45)

## Version 2.5.1 (Nov 04, 2018)
*   remove "Church Slavonic" patterns (see #38)
*   fix issue #39

## Version 2.5.0 (Oct 02, 2018)
*   fix issues with very long word (#33 and #34)
*   Hyphenopoly exposes [Hyphenators](https://github.com/mnater/Hyphenopoly/wiki/Hyphenators)
*   fix issues with very long word (#33 and #34)
*   hyphenopoly.module.js is now [easy to use with browserify](https://github.com/mnater/Hyphenopoly/wiki/browserify)

## Version 2.4.0 (Sept 01, 2018)
*   Implement fallback mechanism for language subtags where no patterns are available (e.g. en-au -> en-gb) [#29](https://github.com/mnater/Hyphenopoly/issues/29)
*   updated patterns for Thai [#25](https://github.com/hyphenation/tex-hyphen/pull/25)

## Version 2.3.0 (Juli 26, 2018)
*   Don't use template strings [#28](https://github.com/mnater/Hyphenopoly/issues/28)
*   run feature test for wasm support only if necessary
*   define node >=8.3.0 as requirement (for util.TextDecoder)
*   small refactorings

## Version 2.2.0 (June 26, 2018)
*   provide example.js for RunKit
*   use tap instead of mocha
*   [6f9e539](https://github.com/mnater/Hyphenopoly/commit/6f9e539a5dab2d1eff5bdeb0c7857c6fda9eb41e)
*   bugfix: [#24](https://github.com/mnater/Hyphenopoly/issues/24): [aeefe6e](https://github.com/mnater/Hyphenopoly/commit/aeefe6e3a59e8356abc99ca490acabf6c3374d7b)

## Version 2.1.0 (Mai 27, 2018)
*   Configure Travis-CI
*   bugfixes

## Version 2.0.0 (Mai 27, 2018)
*   Provide [node module](https://github.com/mnater/Hyphenopoly/wiki/Node-Module)
*   default file locations better reflect usual installations [#19](https://github.com/mnater/Hyphenopoly/issues/19)
*   Add ability to store results of feature tests (optional) [#22](https://github.com/mnater/Hyphenopoly/issues/22)
*   better error handling (f4bbaa7759eed24208e5cd7c744f1131262abb20, 1c7b0b67666b507d6f6b02eea38460562a5835e4)
*   correct implementation of e.preventDefault (df988788db6fb7120fc0c8a1cff1c91aac5a3998)
*   fix string normalization (a3229f730f79ccdd3054cbac257b2345f5c8e11a)
*   Better tooling: minify, eslint, testing (mocha), compiling [devDependencies](https://github.com/mnater/Hyphenopoly/wiki/Usage-of-devDependencies)

## Version 1.0.1 (Mai 13, 2018)
Prevent browsers to force layout on feature test in some cases.

## Version 1.0.0 (Mai 12, 2018)
First release
