/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable security/detect-object-injection */
/* eslint-env node */

/**
 * Static Succinct Trie for hyphenation pattern data
 *
 * This implementation just supports the methods:
 * STrie.add(word, value) -> null
 * STrie.build() -- builds the succinct trie after all words are added
 * STrie.lookup(word) -> data
 * STrie.dump() -> Uint8Array
 */

import bitArray from "./bits.js";
import charData from "./charData.js";
import trieStructure from "./trie.js";

export default (function sTrie() {
    const bits = bitArray();
    const trie = trieStructure();
    bits.add(1);
    bits.add(0);
    const hasValueBits = bitArray();
    const chars = charData();

    const valueStore = (() => {
        const valuesBitMap = bitArray();
        valuesBitMap.add(0);
        const values = [];


        function compressValue(value) {
            // Remove trailing zeroes
            while (value[value.length - 1] === 0) {
                value.pop();
            }
            // Find first not-zero entry
            const offset = value.findIndex((element) => {
                return element !== 0;
            });
            const compactValue = value.slice(offset);
            compactValue.unshift(offset);
            return compactValue;
        }

        function addValue(idx, value) {
            if (value === null) {
                hasValueBits.add(0);
                return;
            }
            hasValueBits.add(1);
            const cVal = compressValue(value);
            let pos = 0;
            while (pos < cVal.length) {
                valuesBitMap.add(1);
                pos += 1;
            }
            valuesBitMap.add(0);
            values.push(...cVal);
        }

        function getValue(idx) {
            const pos = hasValueBits.rank1(idx);
            const valBitsStart = valuesBitMap.select0(pos);
            const len = valuesBitMap.select0(pos + 1) - valBitsStart - 1;
            const valIdx = valuesBitMap.rank1(valBitsStart);
            return values.slice(valIdx, valIdx + len);
        }

        function hasValue(idx) {
            return (hasValueBits.get(idx - 1) === 1);
        }

        function valuesAsUint8Array() {
            const compactValues = [];
            let pos = 0;
            while (pos < values.length) {
                const first = values[pos];
                const second = (values[pos + 1])
                    ? values[pos + 1]
                    : 0;
                // eslint-disable-next-line no-bitwise
                const compactValueInt = (first << 4) + second;
                compactValues.push(compactValueInt);
                pos += 2;
            }
            return Uint8Array.from(compactValues);
        }

        return {
            addValue,
            getValue,
            hasValue,
            valuesAsUint8Array,
            "valuesBitMap"() {
                return valuesBitMap.asUint8ArraySwapped();
            }
        };
    })();

    function translateTable(chr) {
        const ordMap = new Map([[46, 0]]);
        let ord = 1;
        chr.forEach((element) => {
            const first = element.charCodeAt(0);
            const secnd = element.charCodeAt(1);
            if (ordMap.has(first)) {
                // This is a substitution
                ordMap.set(secnd, ordMap.get(first));
            } else if (ordMap.has(secnd)) {
                // Sigma
                ordMap.set(first, ord);
                ord += 1;
            } else {
                ordMap.set(first, ord);
                if (secnd !== 95) {
                    ordMap.set(secnd, ord);
                }
                ord += 1;
            }
        });
        return {
            "ord"(charCode) {
                return ordMap.get(charCode);
            }
        };
    }
    let trns = null;


    function add(word, value) {
        const len = word.length;
        let pos = 0;
        let level = null;
        while (pos < len - 1) {
            level = trie.addNode(level, word[pos], null);
            pos += 1;
        }
        trie.addNode(level, word[pos], value);
    }

    function build(chr) {
        trns = translateTable(chr);
        trie.breadthFirstIteration((key, childCount, idx, value) => {
            for (let index = 0; index < childCount; index += 1) {
                bits.add(1);
            }
            bits.add(0);
            if (key !== "root") {
                chars.add(trns.ord(parseInt(key, 10)));
                valueStore.addValue(idx, value);
            }
        });
    }

    function dump() {
        return {
            "bits": bits.asUint8ArraySwapped(),
            "chars": chars.asUint8Array(),
            "hasValueBits": hasValueBits.asUint8ArraySwapped(),
            "values": valueStore.valuesAsUint8Array(),
            "valuesBitMap": valueStore.valuesBitMap()
        };
    }

    return {
        add,
        build,
        dump
    };
}());
