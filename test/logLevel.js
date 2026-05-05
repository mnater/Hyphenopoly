/* eslint-disable jsdoc/require-jsdoc */

import t from "tap";

async function freshImport() {
    const {"default": H9Y} = await import(
        `../hyphenopoly.module.js?update=${Date.now()}`
    );
    return H9Y;
}

async function brokenLoader() {
    throw new Error("simulated load failure");
}

async function runWithConfig(extraConfig) {
    const H9Y = await freshImport();
    const calls = [];
    /* eslint-disable no-console */
    const original = console.error;
    console.error = (...args) => {
        calls.push(args);
    };
    try {
        const hc = H9Y.config({
            "loader": brokenLoader,
            "require": ["en-us"],
            ...extraConfig
        });
        await hc.get("en-us").catch(() => {
            // expected: brokenLoader rejects
        });
    } finally {
        console.error = original;
    }
    /* eslint-enable no-console */
    return calls;
}

t.test("default logLevel emits console.error", async (t) => {
    const calls = await runWithConfig({});
    t.ok(calls.length > 0);
    t.end();
});

t.test("logLevel: 'silent' suppresses console.error", async (t) => {
    const calls = await runWithConfig({"logLevel": "silent"});
    t.equal(calls.length, 0);
    t.end();
});

t.test("logLevel: 'error' allows console.error", async (t) => {
    const calls = await runWithConfig({"logLevel": "error"});
    t.ok(calls.length > 0);
    t.end();
});

t.test("invalid logLevel falls back to default and does not throw", async (t) => {
    const calls = await runWithConfig({"logLevel": "bogus-value"});
    t.ok(calls.length > 0);
    t.end();
});
