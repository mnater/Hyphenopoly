On the first run Hyphenopoly_Loader.js does the following feature tests:

* Test if the client supports **WASM**
* Test for each language in `Hyphenopoly.require` if the client supports **CSS-hyphenation**

The result of these tests is stored in `Hyphenopoly.testResults`. Because these tests take 
some time and may cause a reflow of the document, Hyphenopoly_Loader.js can store their
result and retrieve these stored results for other pages in the same browsing session.

The test results are stored in sessionStorage to assure that the tests are rerun when
browser occasionally gets updated.

Because the law in some contries require a user opt-in or opt-out or whatever if you store
data on the client, `cacheFeatureTests` is deactivated by default and has to be activated
explicitely by hand in the [`Hyphenopoly` global object](https://github.com/mnater/Hyphenopoly/wiki/Global-Hyphenopoly-Object):
````javascript
const Hyphenopoly = {
    require: {...},
    cacheFeatureTests: true
}
````
It's up to you to comply to the cookie-regulations of your country.