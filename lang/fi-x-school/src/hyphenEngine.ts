/*
 * Debug:
 * return wa.instantiateStreaming(response, {
 *     "hyphenEngine": {
 *         "log": (value) => {
 *             console.log(value);
 *         },
 *         "log2": (value) => {
 *             console.log((value >>> 0).toString(2));
 *         }
 *     }
 * });
 * declare function log(arg0: i32): void;
 * declare function log2(arg0: i32): void;
 * declare function logc(arg0: i32): void;
 */

/*
 * MEMORY LAYOUT (static)
 *
 * #--------------------# <- Offset 0
 * |        word        |
 * | 64 * Uint16 = 128B |
 * #--------------------# <- 128 (tw)
 * |   translatedWord   |
 * |  64 * Uint8 = 64B  |
 * #--------------------# <- 192 (hp)
 * |    hyphenPoints    |
 * |  64 * Uint8 = 64B  |
 * #--------------------# <- 256 (originalWordOffset)
 * |    originalWord    |
 * | 64 * Uint16 = 128B |
 * #--------------------# <- 384 (translateMapOffset)
 * |    translateMap    |
 * |      key/value:    |
 * | 256 chars * 4Bytes |
 * |          +         | 1280B
 * |     collisions:    |
 * | 64 buckets * 4Byte |
 * #--------------------# <- 1664 (alphabetOffset)
 * |      alphabet      |
 * | 256 chars * 2Bytes | 512B
 * #--------------------# <- 2176   - DATAOFFSET
 * |      licence       |           |
 * #--------------------#           |
 * |      alphabet      |    (ao)   |
 * #--------------------#           |
 * |     STrieBits      |    (bm)   | (bm)
 * #--------------------#           |
 * |     STrieChars     |    (cm)   } pattern data (succinct value trie)
 * #--------------------#           |
 * |    hasValueBits    |    (hv)   |
 * #--------------------#           |
 * |    valuesBitMap    |    (vm)   |
 * #--------------------#           |
 * |       values       |    (va)   |
 * #--------------------# <- dataEnd-
 * |   alignment bytes  |
 * #--------------------# <- heapSize
 *
 * USAGE:
 * Each module created from this source is language specific.
 * 1. Write a UTF-16 String to memory starting at index 0 (64 chars max)
 * 2. Call hyphenate(), which returns the lenght of the hyphenated string
 * 3. Read the hyphenated UTF-16 string from memory starting at index 0
 *
 * INTERNALS:
 * Upon instantiation the module builds a translate map that maps UTF-16 chars
 * to 8bit numbers.
 * This limits the size of the alphabet to a theoretically maximum of
 * 255 characters (practically the number is lower to prevent hash collisions).
 * Hyphenation patterns are stored in and read from a static succinct trie.
 */

/*
 * Import the offsets and left-/rightmin of the language specific data.
 * The import file is created by the createWasmData.js script
 */
import {ao, as, bm, cm, hv, lm, rm, va, vm} from "./g";

/*
 * Export the variables essential for the user of the module:
 * lmi: leftmin - the number of characters before the first hyphenation point
 * rmi: rightmin - the number of characters after the last hyphenation point
 * lct: lettercount - number of letters in the alphabet
 */
export const lmi: i32 = lm;
export const rmi: i32 = rm;
export let lct: i32 = 0;

/*
 * Define the offsets into memory
 */
const tw: i32 = 128;
const hp: i32 = 192;
const originalWordOffset: i32 = 256;
const translateMapOffset:i32 = 384;
const alphabetOffset: i32 = 1664;

/*
 * Minimalistic hash function to map 16-bit to 8-bit
 *
 * The magic numbers are found by tools/searchHashSeeds.*
 * with the goal of having as few collisions as possible.
 */
function hashCharCode(cc: i32): i32 {
    return ((19441 * cc) % 19559) & 255;
}

/*
 * Store a k/v pair in translateMap
 * k is the utf-16 char
 * v is it's 8-bit representation
 */
function pushToTranslateMap(cc: i32, id: i32): void {
    let ptr: i32 = hashCharCode(cc) << 2;
    if (load<u32>(ptr, translateMapOffset) !== 0) {
        // Handle collision
        ptr = 1024;
        while (load<u32>(ptr, translateMapOffset) !== 0) {
            ptr += 4;
            if (ptr >= 1280) {
                unreachable();
            }
        }
    }
    store<u32>(ptr, (cc << 16) + id, translateMapOffset);
}

/*
 * Retrieve the 8-bit value for a UTF-16 char
 * Returns 255 if the char is not in the translateMap
 */
function pullFromTranslateMap(cc: i32): i32 {
    let ptr: i32 = hashCharCode(cc) << 2;
    const val = load<u32>(ptr, translateMapOffset);
    if (val === 0) {
        // Unknown char
        return 255;
    }
    if ((val >>> 16) === cc) {
        // Known char
        return (val & 255);
    }
    // Find collided char
    ptr = 0;
    while (load<u16>(ptr, translateMapOffset + 1026) !== cc) {
        ptr += 4;
        if (ptr >= 256) {
            return 255;
        }
    }
    return load<u16>(ptr, translateMapOffset + 1024);
}

/*
 * Creates the translateMap for the language specific alphabet.
 * This function is called upon instantiation of the module.
 */
function createTranslateMap(): void {
    let i: i32 = 0;
    let k: i32 = 1;
    let first: i32 = 0;
    let second: i32 = 0;
    let secondInt: i32 = 0;
    i = ao;
    const lastLetterAddr: i32 = ao + (as << 1);
    lct <<= 1;
    pushToTranslateMap(46, 0);
    while (i < lastLetterAddr) {
        first = load<u16>(i);
        second = load<u16>(i, 2);
        if (second === 0) {
            secondInt = 255;
        } else {
            secondInt = pullFromTranslateMap(second);
        }
        if (pullFromTranslateMap(first) !== 255) {
            // This is a substitution
            pushToTranslateMap(second, pullFromTranslateMap(first));
            store<u16>(lct, second, alphabetOffset);
        } else if (secondInt === 255) {
            //  There's no such char yet in the TranslateMap
            pushToTranslateMap(first, k);
            if (second !== 0) {
                // Set upperCase representation
                pushToTranslateMap(second, k);
            }
            store<u16>(lct, first, alphabetOffset);
            k += 1;
        } else {
            // Sigma
            pushToTranslateMap(first, k);
            store<u16>(lct, first, alphabetOffset);
            k += 1;
        }
        lct += 2;
        i += 4;
    }
    lct >>= 1;
}

/*
 * Checks if the bit in hv (hasValueBitMap) is set
 * Returns the bit at pos starting at hv.
 *
 * When the succinct trie is created (see tools/modules/sTrie.js and
 * tools/modules/bits.js) the bytes are swapped (0 1 2 3 -> 3 2 1 0).
 * This is intended because we access them in the select and rank functions
 * with i64 instructions; wasm is little-endian and thus loads 0 1 2 3.
 * But here the bits are numbered from left to right, so we need to swap the
 * pointer to the byte.
 * To access the bytes in Big Endian order (0 1 2 3) we need to calculate
 * the address: bytePtr = (bytePtr - (bytePtr % 4) + 3) - (bytePtr % 4)
 *                      =  bytePtr + 3 - (2 * (bytePtr % 4))
 * with BitHack (bytePtr % 4) === bytePtr & (4 - 1)
 *              bytePtr =  bytePtr + 3 - ((bytePtr & 3) << 1)
 */
function nodeHasValue(pos: i32): i32 {
    // BE bytePointer = pos / 8;
    let bytePtr: i32 = pos >> 3;
    // LE bytePointer:
    bytePtr = bytePtr + 7 - ((bytePtr & 7) << 1);
    // BitHack: pos % 8 === pos & (8 - 1)
    const numBits: i32 = 7 - (pos & 7);
    return (load<u8>(bytePtr, hv) >> numBits) & 1;
}

/*
 * Computes the rank at pos starting at currByte.
 * The rank is the number of bits set up to the given position.
 * We first count the bits set in the 64-bit blocks,
 * then we count the bits set until the final pos.
 */
function rank(pos: i32, currByte: i32): i32 {
    let count: i64 = 0;
    // (pos / 64) << 3 === (pos >> 6) << 3
    const numBytes: i32 = (pos >> 6) << 3;
    const endByte: i32 = currByte + numBytes;
    while (currByte < endByte) {
        count += popcnt<i64>(load<i64>(currByte, 0, 8));
        currByte += 8;
    }
    // BitHack: pos % 64 === pos & (64 - 1)
    const numBits: i32 = pos & 63;
    if (numBits !== 0) {
        count += popcnt<i64>(
            load<i64>(currByte, 0, 8) >>> (64 - numBits)
        );
    }
    return count as i32;
}

/**
 * Find the position of the nth 0 in a 64bit word.
 * The algorithm numbers bits from right to left, but we need them numbered
 * from left to right, so we convert nth (l2r)  to nth2 (r2l).
 * @param {i64} dWord - doubleWord sized bit vector to be searched
 * @param {i32} nth - nth 0 to get the position of
 * @returns {i32} - index of the nth 0 in dWord
 */
function get0PosInDWord(dWord: i64, nth: i32): i32 {
    let nth2: i64 = 65 - popcnt<i64>(dWord) - nth;
    let dwn: i64 = dWord;
    do {
        dWord |= dwn;
        dwn = dWord + 1;
        nth2 -= 1;
    } while (nth2);
    return 63 - (ctz<i64>(dwn) as i32);
}

/**
 * Find ith 0 and return its position relative to startByte and the count
 * of bits set following this 0 (the child count).
 * The return values are compacted in one i32 number:
 * bits 0-23: position
 * bits 24-31: child count
 * @param {i32} ith - number of the 0 to select
 * @param {i32} startByte - memory index where to start
 * @param {i32} endByte - memory index where to end if not found yet
 * @returns {i32} - position and childcount
 */
function select(ith: i32, startByte: i32, endByte: i32): i32 {
    let bytePos: i32 = startByte;
    let count: i32 = 0;
    let dWord: i64 = 0;
    let dWord0Count: i32 = 0;
    let run: i32 = 0;
    let posInByte: i32 = 0;
    let pos: i32 = 0;
    let firstPos: i32 = 0;
  
    while (run < 2) {
        ith += run;
        while (count < ith) {
            if (bytePos > endByte) {
                return 0;
            }
            dWord = load<i64>(bytePos, 0, 8);
            dWord0Count = 64 - (popcnt<i64>(dWord) as i32);
            count += dWord0Count;
            bytePos += 8;
        }
        posInByte = get0PosInDWord(dWord, ith - (count - dWord0Count));
        pos = ((bytePos - 8 - startByte) << 3) + posInByte;
        if (run === 0) {
            firstPos = pos;
        }
        run += 1;
    }
    return (firstPos << 8) + (pos - firstPos - 1);
}

/*
 * Get the values from memory and copy to hp if greater than value in hp
 *
 * To save space the values are stored in a compact form:
 * Values range from 0 to 11, so we only need 4bits for each value
 * Leading zeroes are compressed to a number, trailing zeroes are left out
 * [0,0,0,1,0,2,0,0] -> [3,1,0,2] -> [0011,0001,0000,0010] -> [49,2]
 */
function extractValuesToHp(valIdx: i32, length: i32, startOffset: i32): void {
    let byteIdx: i32 = valIdx >> 1;
    let currentByte: i32 = load<u8>(byteIdx, va);
    let pos: i32 = valIdx & 1;
    let newValue: i32 = 0;
    const leadingZeros: i32 = (pos
        // Right nibble
        ? currentByte & 15
        // Left nibble
        : currentByte >> 4);
    let addr: i32 = startOffset + leadingZeros;
    let i: i32 = 1;
    while (i < length) {
        if (pos) {
            byteIdx += 1;
            currentByte = load<u8>(byteIdx, va);
            newValue = currentByte >> 4;
        } else {
            newValue = currentByte & 15;
        }
        pos ^= 1;
        if (newValue > load<u8>(addr, hp)) {
            store<u8>(addr, newValue, hp);
        }
        i += 1;
        addr += 1;
    }
}

/*
 * Method to define character substitutions
 * e.g. é/É -> e
 */
export function subst(ccl: i32, ccu: i32, replcc: i32): i32 {
    const replccInt: i32 = pullFromTranslateMap(replcc);
    if (replccInt !== 255) {
        pushToTranslateMap(ccl, replccInt);
        if (ccu !== 0) {
            pushToTranslateMap(ccu, replccInt);
        }
        // Add to alphabet
        store<u16>(lct << 1, ccl, alphabetOffset);
        lct += 1;
    }
    return lct;
}

/*
 * The main hyphenate function
 * lmin: leftmin - the number of characters before the first hyphenation point
 * rmin: rightmin - the number of characters after the last hyphenation point
 * hc: hyphenchar - the char to insert as hyphen (usually soft hyphen \00AD)
 *
 * Reads the word from memory[0] until 0 termination and writes back to memory
 * starting at adress 0.
 * Returns the new length of the hyphenated word.
 */
export function hyphenate(lmin: i32, rmin: i32, hc: i32): i32 {
    let patternStartPos: i32 = 0;
    let wordLength: i32 = 0;
    let charOffset: i32 = 0;
    let hyphenPointsCount: i32 = 0;

    /*
     * Translate UTF16 word to internal ints and clear hpPos-Array.
     * The translated word (tw) is delimited by the point char (.)
     * with charcode 46 which is always translated to the internal
     * code 0. We don't need to set these delimiters because memory
     * is initialized with 0.
     */
    memory.fill(tw, 0, 256);
    let cc: i32 = load<u16>(0);
    while (cc !== 0) {
        const translatedChar: i32 = pullFromTranslateMap(cc);
        if (translatedChar === 255) {
            return 0;
        }
        store<u8>(charOffset + 1, translatedChar, tw);
        store<u16>(charOffset << 1, cc, originalWordOffset);
        charOffset += 1;
        cc = load<u16>(charOffset << 1);
    }

    // Find patterns and collect hyphenPoints
    wordLength = charOffset + 2;
    while (patternStartPos < wordLength) {
        charOffset = patternStartPos;
        let node: i32 = 1;
        while (charOffset < wordLength) {
            const sel0: i32 = select(node, bm, cm);
            node = (sel0 >> 8) - node;
            const to: i32 = node + (sel0 & 255);
            while (node < to) {
                if (load<u8>(node, cm) === load<u8>(charOffset, tw)) {
                    break;
                }
                node += 1;
            }
            if (node === to) {
                break;
            }
            if (nodeHasValue(node) === 1) {
                const pos: i32 = rank(node + 1, hv);
                const sel: i32 = select(pos, vm, va - 1);
                const valBitsStart: i32 = sel >> 8;
                const valIdx: i32 = rank(valBitsStart, vm);
                const len: i32 = sel & 255;
                extractValuesToHp(valIdx, len, patternStartPos);
            }
            node += 2;
            charOffset += 1;
        }
        patternStartPos += 1;
    }

    // Get chars of original word and insert hyphenPoints
    charOffset = 0;
    wordLength -= 2;
    rmin = wordLength - rmin - 1;
    while (charOffset < wordLength) {
        store<u16>(
            (charOffset + hyphenPointsCount) << 1,
            load<u16>(charOffset << 1, originalWordOffset)
        );
        if ((charOffset >= lmin - 1) && (charOffset <= rmin)) {
            if (load<u8>(charOffset, hp + 2) & 1) {
                hyphenPointsCount += 1;
                store<u16>((charOffset + hyphenPointsCount) << 1, hc);
            }
        }
        charOffset += 1;
    }
    store<u16>((charOffset + hyphenPointsCount) << 1, 0);
    return wordLength + hyphenPointsCount;
}

createTranslateMap();
