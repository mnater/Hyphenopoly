# Download for deployment

## General Notes

### Minifying
While the .wasm and .hpb files are already compact by design, the .js files are not minified. I highly recommend to use one of the es6-savy JavaScript minifier tools.

If you [installed Hyphenopoly with npm](#using-npmjs) run `npm run minify` to create a directory called `min` that contains a full set of minified files (and the test suite) minified with `terser`.

### Compression
All files have good compression rates when using gzip, deflate and the like. You may need to configure your server to be able to compress `.hpb`-files though!

### es6
Hyphenopoly_Loader.js and Hyphenopoly.js use some basic es6-syntax (`let`, `const`, etc. not the fancy stuff). If for some reason you need es5-syntax use [babel](http://babeljs.io) to transpile the scripts.

### node
Hyphenopoly_Loader.js and Hyphenopoly.js is designed for use in browsers. For usage in node.js see: [node module](./Node-Module.md)

Let me now, if you have a use case for hyphenation in node.js

## Download

### Using GitHub
1. Go to [https://github.com/mnater/Hyphenopoly/releases/latest](https://github.com/mnater/Hyphenopoly/releases/latest) and download the latest stable version (don't be afraid of the name `Source code`).
2. Unpack the package and copy the following files and folders to your server:
    * `Hyphenopoly_Loader.js`
    * `Hyphenopoly.js`
    * `hyphenEngine.asm.js`
    * `hyphenEnginge.wasm`
    * `patterns/`

    (Of course you can delete the patterns for the language you won't need.)
3. Then follow the instructions on [https://github.com/mnater/Hyphenopoly#usage-browser](https://github.com/mnater/Hyphenopoly#usage-browser)
 
### Using npm.js
1. Run `npm i hyphenopoly` in your project folder
2. Tell Hyphenopoly where to find the files: [paths](./Global-Hyphenopoly-Object.md#paths)
3. Follow the instructions on [https://github.com/mnater/Hyphenopoly#usage-browser](https://github.com/mnater/Hyphenopoly#usage-browser) (don't forget to adapt the paths)