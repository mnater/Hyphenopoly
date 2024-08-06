/* eslint-env node */
/* eslint global-require: 0, func-names: 0, no-shadow: 0 */
/* eslint-disable prefer-arrow-callback */

import t from "tap";

/**
 * Imports and returns the defaults of the hyphenopoly module.
 * Circumvents module caching by appending a query to the URL
 * LEAKS MEMORY!
 * @returns {object} Hyphenopoly module
 */
async function freshImport() {
    const {"default": H9Y} = await import(`../hyphenopoly.module.js?update=${Date.now()}`);
    return H9Y;
}

// eslint-disable-next-line jsdoc/require-jsdoc
async function loader(file) {
    const {readFile} = await import("node:fs/promises");
    const {dirname} = await import("node:path");
    const {fileURLToPath} = await import("node:url");
    const cwd = dirname(fileURLToPath(import.meta.url));
    return readFile(`${cwd}/../patterns/${file}`);
}

t.test("set Event", async function (t) {
    const H9Y = await freshImport();
    await H9Y.config({
        "handleEvent": {

            /**
             * Prevents default event
             * @param {object} e Event
             * @returns {undefined}
             */
            error(e) {
                e.preventDefault();
            }
        },
        loader,
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
             * @param {object} e Event
             * @returns {undefined}
             */
            fantasy(e) {
                e.preventDefault();
            }
        },
        loader,
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
             * @param {object} e Event
             * @returns {undefined}
             */
            engineLoaded(e) {
                e.preventDefault();
            }
        },
        loader,
        "require": ["de"]
    });
    t.end();
});
