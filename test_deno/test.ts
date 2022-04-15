/* eslint-env deno */

import {assertEquals, assertInstanceOf} from "https://deno.land/std@0.135.0/testing/asserts.ts";

const testmap = new Map();

Deno.test(
    "check type",
    async (t) => {
        await t.step("test 1", () => {
            assertInstanceOf(testmap, Map);
        });
    }
);