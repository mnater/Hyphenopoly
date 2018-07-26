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

t.test("set Event", async function (t) {
    await H9Y.config({
        "handleEvent": {

            /**
             * Prevents default event
             * @param {Object} e Event
             * @returns {undefined}
             */
            "error": function (e) {
                e.preventDefault();
            }
        },
        "require": ["de"]
    });
    t.end();
});

t.test("set unknown event", async function (t) {
    await H9Y.config({
        "handleEvent": {

            /**
             * Prevents default event
             * @param {Object} e Event
             * @returns {undefined}
             */
            "fantasy": function (e) {
                e.preventDefault();
            }
        },
        "require": ["de"]
    });
    t.end();
});

t.test("try to overwrite noncancellable event", async function (t) {
    await H9Y.config({
        "handleEvent": {

            /**
             * Prevents default event
             * @param {Object} e Event
             * @returns {undefined}
             */
            "hpbLoaded": function (e) {
                e.preventDefault();
            }
        },
        "require": ["de"]
    });
    t.end();
});
