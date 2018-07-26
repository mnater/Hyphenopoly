/* eslint-env node */
/* eslint global-require: 0, func-names: 0, no-shadow: 0 */
"use strict";

const t = require("tap");

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

t.test("path to maindir not resolvable", async function (t) {
    await H9Y.config({
        "paths": {
            "maindir": "fail/",
            "patterndir": "./patterns/"
        },
        "require": ["de"]
    }).catch(
        function (e) {
            t.equal(e, "fail/hyphenEngine.wasm not found.");
            t.end();
        }
    );
});

t.test("path to patternfile not resolvable", async function (t) {
    await H9Y.config({
        "paths": {
            "maindir": "./",
            "patterndir": "./patterns/"
        },
        "require": ["en"]
    }).catch(
        function (e) {
            t.equal(e, "./patterns/en.hpb not found.");
            t.end();
        }
    );
});

t.test("run config with two languages", async function (t) {
    const hyphenators = await H9Y.config({"require": ["de", "en"]});
    t.test("get the hyphenator function for a language", async function (t) {
        await hyphenators.get("en").catch(
            function (e) {
                t.equal(e.slice(-27), "/patterns/en.hpb not found.");
            }
        );
        t.end();
    });
});

t.test("incomplete setup (forget require)", async function (t) {
    const laHyphenator = await H9Y.config({});
    t.test("get empty map", function (t) {
        t.equal(laHyphenator.size, 0);
        t.end();
    });
    t.end();
});

t.test("make hyphenEngine fail", async function (t) {
    const laHyphenator = await H9Y.config({"require": ["la"]});
    t.test("hyphenate one word", function (t) {
        t.equal(laHyphenator("Helvetii"), "Helvetii");
        t.end();
    });
    t.end();
});
