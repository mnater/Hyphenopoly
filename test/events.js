/* eslint-env node */
/* eslint global-require: 0, func-names: 0, no-shadow: 0 */
/* eslint-disable prefer-arrow-callback */

import t from "tap";

/**
 * Imports and returns the defaults of the hyphenopoly module.
 * Circumvents module caching by appending a query to the URL
 * LEAKS MEMORY!
 */
async function freshImport() {
    const {"default": H9Y} = await import(`../hyphenopoly.module.js?update=${Date.now()}`);
    return H9Y;
}

t.test("set Event", async function (t) {
    const H9Y = await freshImport();
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
    const H9Y = await freshImport();
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
    const H9Y = await freshImport();
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
