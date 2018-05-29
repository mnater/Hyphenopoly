// test/hello-world.js
var t = require("tap");
// const H9Y = require("../hyphenopoly.module");
let H9Y = null;
const H9YKey = require.resolve("../hyphenopoly.module");
t.beforeEach(function setup(done) {
    H9Y = require("../hyphenopoly.module");
    done();
});

t.afterEach(function tearDown(done) {
    H9Y = null;
    delete require.cache[H9YKey];
    done();
});

t.test("path to maindir not resolvable", async function(t) {
    const deHyphenator = await H9Y.config({
        "paths": {
            "maindir": "fail/",
            "patterndir": "./patterns/"
        },
        "require": ["de"]
    }).catch(
        function(e) {
            t.equal(e, "fail/hyphenEngine.wasm not found.");
            t.end();
        }
    );
});

t.test("path to patternfile not resolvable", async function(t) {
    const deHyphenator = await H9Y.config({
        "paths": {
            "maindir": "./",
            "patterndir": "./patterns/"
        },
        "require": ["en"]
    }).catch(
        function(e) {
            t.equal(e, "./patterns/en.hpb not found.");
            t.end();
        }
    );
});

t.test("run config with one language", async function(t) {
    const laHyphenator = await H9Y.config({"require": ["la"]});
    t.test("hyphenate one word", function(t) {
        t.equal(laHyphenator("Helvetii"), "Helvetii");
        t.end();
    });
    t.end();
});