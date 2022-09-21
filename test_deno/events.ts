
/* global Deno */

/**
 * Imports and returns the defaults of the hyphenopoly module.
 * Circumvents module caching by appending a query to the URL
 * LEAKS MEMORY!
 */
async function freshImport() {
    const {"default": H9Y} = await import(`../hyphenopoly.deno.js?update=${Date.now()}`);
    return H9Y;
}

Deno.test("set Event", async () => {
    const H9Y = await freshImport();
    await H9Y.config({
        "handleEvent": {

            /**
             * Prevents default event
             * @param {Object} e Event
             * @returns {undefined}
             */
            error(e: Event) {
                e.preventDefault();
            }
        },
        "require": ["de"]
    });
});

Deno.test("set unknown event", async () => {
    const H9Y = await freshImport();
    await H9Y.config({
        "handleEvent": {

            /**
             * Prevents default event
             * @param {Object} e Event
             * @returns {undefined}
             */
            fantasy(e: Event) {
                e.preventDefault();
            }
        },
        "require": ["de"]
    });
});

Deno.test("try to overwrite noncancellable event", async () => {
    const H9Y = await freshImport();
    await H9Y.config({
        "handleEvent": {

            /**
             * Prevents default event
             * @param {Object} e Event
             * @returns {undefined}
             */
            engineLoaded(e: Event) {
                e.preventDefault();
            }
        },
        "require": ["de"]
    });
});
