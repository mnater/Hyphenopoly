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
 * #--------------------# <- 256 (translateMapOffset)
 * |    translateMap    |
 * |         keys:      |
 * | 256 chars * 2Bytes |
 * |          +         |
 * |       values:      | 1024B
 * | 256 chars * 1Byte  |
 * |          +         |
 * |     collisions:    |
 * | 64 buckets * 4Byte |
 * #--------------------# <- 1280 (alphabetOffset)
 * |      alphabet      |
 * | 256 chars * 2Bytes | 512B
 * #--------------------# <- 1792 (originalWordOffset)
 * |    originalWord    |
 * | 64 * Uint16 = 128B |
 * #--------------------# <- 1920   - DATAOFFSET
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
const translateMapOffset:i32 = 256;
const alphabetOffset: i32 = 1280;
const originalWordOffset: i32 = 1792;

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
    let ptr: i32 = hashCharCode(cc) << 1;
    if (load<u16>(ptr, translateMapOffset) === 0) {
        // No collision
        store<u16>(ptr, cc, translateMapOffset);
        store<u8>(ptr >> 1, id, translateMapOffset + 512);
    } else {
        // Handle collision
        ptr = 0;
        while (load<u16>(ptr, translateMapOffset + 768) !== 0) {
            ptr += 4;
            if (ptr >= 256) {
                unreachable();
            }
        }
        store<u16>(ptr, cc, translateMapOffset + 768);
        store<u16>(ptr, id, translateMapOffset + 770);
    }
}

/*
 * Retrieve the 8-bit value for a UTF-16 char
 * Returns 255 if the char is not in the translateMap
 */
function pullFromTranslateMap(cc: i32): i32 {
    let ptr: i32 = hashCharCode(cc) << 1;
    const val = load<u16>(ptr, translateMapOffset);
    if (val === 0) {
        // Unknown char
        return 255;
    }
    if (val === cc) {
        // Known char
        return load<u8>(ptr >> 1, translateMapOffset + 512);
    }
    // Find collided char
    ptr = 0;
    while (load<u16>(ptr, translateMapOffset + 768) !== cc) {
        ptr += 4;
        if (ptr >= 256) {
            return 255;
        }
    }
    return load<u16>(ptr, translateMapOffset + 770);
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
 * Returns the bit at pos starting at startByte
 * For our purposes the bits are numbered from left to right
 * but the bytes are stored in Little Endian (3 2 1 0).
 * To access the bytes in Big Endian order (0 1 2 3) we need to calculate
 * the address: bytePtr = (bytePtr - (bytePtr % 4) + 3) - (bytePtr % 4)
 * This can be simplyfied as follows
 */
function nodeHasValue(pos: i32): i32 {
    // BE:
    let bytePtr: i32 = pos >> 3;
    // LE:
    bytePtr = bytePtr + 7 - ((bytePtr & 7) << 1);
    // BitHack: pos % 8 === pos & (8 - 1)
    const numBits: i32 = 7 - (pos & 7);
    return (load<u8>(bytePtr, hv) >> numBits) & 1;
}

/*
 * Computes the rank at pos starting at startByte.
 * The rank is the number of bits set up to the given position.
 * We first count the bits set in the 32-bit blocks,
 * then we count the bits set until the final pos.
 */
function rank(pos: i32, startByte: i32): i32 {
    // (pos / 64) << 3 === (pos >> 6) << 3
    const numBytes: i32 = (pos >> 6) << 3;
    // BitHack: pos % 64 === pos & (64 - 1)
    const numBits: i32 = pos & 63;
    let i: i32 = 0;
    let count: i64 = 0;
    while (i < numBytes) {
        count += popcnt<i64>(load<i64>(startByte + i, 0, 8));
        i += 8;
    }
    if (numBits !== 0) {
        count += popcnt<i64>(
            load<i64>(startByte + i, 0, 8) >>> (64 - numBits)
        );
    }
    return count as i32;
}

/**
 * Find the position of the nth bit set in a 64bit word.
 * The faster - non branching - algorithm from
 * https://graphics.stanford.edu/~seander/bithacks.html#SelectPosFromMSBRank
 * is not used here because it's larger in code size.
 * The algorithm here first checks if the bit is in the first or the second
 * 32bit-half of the word. Then it searches the nth bit in the respective
 * half jumping over leading zeroes.
 */
function get1PosInDWord(dWord: i64, nth: i32): i32 {
    const first: i32 = (dWord >> 32) as i32;
    const pcntf: i32 = popcnt<i32>(first);
    let word: i32 = 0;
    let pos: i32 = -1;
    if (pcntf >= nth) {
        word = first;
    } else {
        word = (dWord & 0xFFFFFFFF) as i32;
        nth -= pcntf;
        pos = 31;
    }
    let shift: i32 = 0;
    do {
        shift = clz<i32>(word) + 1;
        word <<= shift;
        pos += shift;
        nth -= 1;
    } while (nth);
    return pos;
}

/**
 * Find ith 0 and return its position relative to startByte and the count
 * of bits set following this 0 (the child count).
 * The return values are compacted in one i32 number:
 * bits 0-23: position
 * bits 24-31: child count
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

    do {
        ith += run;
        do {
            if (bytePos > endByte) {
                return 0;
            }
            dWord = ~load<i64>(bytePos, 0, 8);
            dWord0Count = <i32>popcnt<i64>(dWord);
            count += dWord0Count;
            bytePos += 8;
        } while (count < ith);
        count -= dWord0Count;
        bytePos -= 8;
        posInByte = get1PosInDWord(dWord, ith - count);
        pos = ((bytePos - startByte) << 3) + posInByte;
        if (run === 0) {
            firstPos = pos;
        }
        run += 1;
    } while (run < 2);
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

    // Translate UTF16 word to internal ints and clear hpPos-Array
    let cc: i32 = load<u16>(0);
    while (cc !== 0) {
        const translatedChar: i32 = pullFromTranslateMap(cc);
        if (translatedChar === 255) {
            return 0;
        }
        store<u8>(charOffset, translatedChar, tw);
        store<u16>(charOffset << 1, cc, originalWordOffset);
        charOffset += 1;
        store<u8>(charOffset, 0, hp);
        cc = load<u16>(charOffset << 1);
    }
    store<u16>(charOffset << 1, 0, originalWordOffset);
    // Find patterns and collect hyphenPoints
    wordLength = charOffset;
    while (patternStartPos < wordLength) {
        charOffset = patternStartPos;
        let currNode: i32 = 0;
        let nthChildIdx: i32 = 0;
        while (charOffset < wordLength) {
            const sel0: i32 = select(currNode + 1, bm, cm);
            const firstChild: i32 = (sel0 >> 8) - currNode;
            const childCount: i32 = sel0 & 255;
            let nthChild: i32 = 0;
            while (nthChild < childCount) {
                nthChildIdx = firstChild + nthChild;
                if (
                    load<u8>(nthChildIdx - 1, cm) === load<u8>(charOffset, tw)
                ) {
                    break;
                }
                nthChild += 1;
            }
            if (nthChild === childCount) {
                break;
            }
            currNode = nthChildIdx;
            if (nodeHasValue(currNode - 1) === 1) {
                const pos: i32 = rank(currNode, hv);
                const sel: i32 = select(pos, vm, va - 1);
                const valBitsStart: i32 = sel >> 8;
                const valIdx: i32 = rank(valBitsStart, vm);
                const len: i32 = sel & 255;
                extractValuesToHp(valIdx, len, patternStartPos);
            }
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
            load<u16>(charOffset << 1, originalWordOffset + 2)
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
