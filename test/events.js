/* eslint-env node */
/* eslint global-require: 0, func-names: 0, no-shadow: 0 */
/* eslint-disable prefer-arrow-callback */
"use strict";
const t = require("tap");

let H9Y = null;
t.beforeEach(function setup() {
    H9Y = require("../hyphenopoly.module");
});

t.afterEach(function tearDown() {
    H9Y = null;
    delete require.cache[require.resolve("../hyphenopoly.module")];
});

t.test("set Event", async function (t) {
    await H9Y.config({
        "handleEvent": {

            /**
             * Prevents default event
             * @param {Object} e Event
             * @returns {undefined}
             */
            error(e) {
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
            fantasy(e) {
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
            engineLoaded(e) {
                e.preventDefault();
            }
        },
        "require": ["de"]
    });
    t.end();
});
