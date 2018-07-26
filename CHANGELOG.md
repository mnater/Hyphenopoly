# Version History

## Version 2.3.0 (Juli 26, 2018)
### Hyphenopoly_Loader.js and Hyphenopoly.js:
* Don't use template strings [#28](https://github.com/mnater/Hyphenopoly/issues/28)
* run feature test for wasm support only if necessary

### hyphenopoly.module.js:
* define node >=8.3.0 as requirement (for util.TextDecoder)
* small refactorings

## Version 2.2.0 (June 26, 2018)
* provide example.js for RunKit
* use tap instead of mocha
* [6f9e539](https://github.com/mnater/Hyphenopoly/commit/6f9e539a5dab2d1eff5bdeb0c7857c6fda9eb41e)
* bugfix: [#24](https://github.com/mnater/Hyphenopoly/issues/24): [aeefe6e](https://github.com/mnater/Hyphenopoly/commit/aeefe6e3a59e8356abc99ca490acabf6c3374d7b)

## Version 2.1.0 (Mai 27, 2018)
* Configure Travis-CI
* bugfixes

## Version 2.0.0 (Mai 27, 2018)
* Provide node module (https://github.com/mnater/Hyphenopoly/wiki/Node-Module)
* default file locations better reflect usual installations [#19](https://github.com/mnater/Hyphenopoly/issues/19)
* Add ability to store results of feature tests (optional) [#22](https://github.com/mnater/Hyphenopoly/issues/22)
* better error handling (f4bbaa7759eed24208e5cd7c744f1131262abb20, 1c7b0b67666b507d6f6b02eea38460562a5835e4)
* correct implementation of e.preventDefault (df988788db6fb7120fc0c8a1cff1c91aac5a3998)
* fix string normalization (a3229f730f79ccdd3054cbac257b2345f5c8e11a)
* Better tooling: minify, eslint, testing (mocha), compiling (https://github.com/mnater/Hyphenopoly/wiki/Usage-of-devDependencies)

## Version 1.0.1 (Mai 13, 2018)
Prevent browsers to force layout on feature test in some cases.

## Version 1.0.0 (Mai 12, 2018)
First release
