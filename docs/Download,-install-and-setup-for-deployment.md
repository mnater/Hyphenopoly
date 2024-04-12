# Download for deployment

## General Notes

### Minifying
While the .wasm files are already compact by design, the .js files are not minified. I highly recommend using one of the es6-capable JavaScript minifier tools.

If you [installed Hyphenopoly with npm](#using-npmjs) run `npm run prepare` to create a directory called `min` that contains a full set of minified files (and the test suite) minified with `terser`.

### Compression
All files have good compression rates when using gzip, deflate, and the like. You may need to configure your server to be able to compress `.wasm`-files though!

### node
Hyphenopoly_Loader.js and Hyphenopoly.js are optimized for usage in browsers. For usage as a module, see: [node module](./Module.md)

Let me know, if you have a use case for hyphenation in node.js

## Download

### Using GitHub
1. Go to [https://github.com/mnater/Hyphenopoly/releases/latest](https://github.com/mnater/Hyphenopoly/releases/latest) and download the latest stable version (don't be afraid of the name `Source code`).
2. Unpack the package and copy the following files and folders to your server:
    * `Hyphenopoly_Loader.js`
    * `Hyphenopoly.js`
    * `patterns/`

    (Of course, you can delete the patterns for the language you won't need.)
3. Then follow the instructions on [https://github.com/mnater/Hyphenopoly#usage-browser](https://github.com/mnater/Hyphenopoly#usage-browser)
 
### Using npm.js
1. Run `npm i hyphenopoly` in your project folder
2. Tell Hyphenopoly where to find the files: [paths](./Config.md#paths-optional)
3. Follow the instructions on [https://github.com/mnater/Hyphenopoly#usage-browser](https://github.com/mnater/Hyphenopoly#usage-browser) (don't forget to adapt the paths)
