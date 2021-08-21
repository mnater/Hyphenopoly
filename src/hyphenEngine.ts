/*
 * Debug
 * declare function log(arg0: i32): void;
 * declare function log2(arg0: i32): void;
 * declare function logc(arg0: i32): void;
 */

import {ao, bm, cm, hv, lm, rm, va, vm} from "./g";
export const lmi: i32 = lm;
export const rmi: i32 = rm;
export let lct: i32 = 0;

const tw: i32 = 128;
const hp: i32 = 192;
const translateMapOffset:i32 = 256;
const originalWordOffset: i32 = 1792;

function hashCharCode(cc: i32): i32 {
    // Hashes charCodes to [0, 256[
    return ((19441 * cc) % 19559) & 255;
}

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


function createTranslateMap(): void {
    let i: i32 = 0;
    let k: i32 = 1;
    let first: i32 = 0;
    let second: i32 = 0;
    let secondInt: i32 = 0;
    i = ao;
    lct <<= 1;
    pushToTranslateMap(46, 0);
    while (i < bm) {
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
            store<u16>(lct, second, 1280);
        } else if (secondInt === 255) {
            //  There's no such char yet in the TranslateMap
            pushToTranslateMap(first, k);
            if (second !== 0) {
                // Set upperCase representation
                pushToTranslateMap(second, k);
            }
            store<u16>(lct, first, 1280);
            k += 1;
        } else {
            // Sigma
            pushToTranslateMap(first, k);
            store<u16>(lct, first, 1280);
            k += 1;
        }
        lct += 2;
        i += 4;
    }
    lct >>= 1;
}

function getBitAtPos(pos: i32, startByte: i32): i32 {
    const numBytes: i32 = pos >> 3;
    // BitHack: pos % 8 === pos & (8 - 1)
    const numBits: i32 = 7 - (pos & 7);
    return (load<u8>(startByte + numBytes) >> numBits) & 1;
}

function rank1(pos: i32, startByte: i32): i32 {
    // (pos / 32) << 2 === (pos >> 5) << 2
    const numBytes: i32 = (pos >> 5) << 2;
    // BitHack: pos % 32 === pos & (32 - 1)
    const numBits: i32 = pos & 31;
    let i: i32 = 0;
    let count: i32 = 0;
    while (i < numBytes) {
        count += popcnt<i32>(load<u32>(startByte + i));
        i += 4;
    }
    if (numBits !== 0) {
        count += popcnt<i32>(
            bswap<u32>(load<u32>(startByte + i)) >>> (32 - numBits)
        );
    }
    return count;
}

/*
 * Loop based search for select0 in 32 bit dWord
 *
 * function get1PosIndDWord(dWord: i32, nth: i32): i32 {
 *     let count: i32 = 0;
 *     let pos: i32 = 0;
 *     const dWordBigEnd: i32 = bswap<i32>(dWord);
 *     while (pos < 32) {
 *         const mask: i32 = 1 << (31 - pos);
 *         if ((dWordBigEnd & mask) === mask) {
 *             count += 1;
 *         }
 *         if (count === nth) {
 *             break;
 *         }
 *         pos += 1;
 *     }
 *     return pos;
 * }
 */

/*
 * Select the bit position (from the most-significant bit)
 * with the given count (rank)
 * Adapted for wasm from
 * https://graphics.stanford.edu/~seander/bithacks.html#SelectPosFromMSBRank
 */
function get1PosIndDWord(dWord: i32, nth: i32): i32 {
    const v: i32 = bswap<i32>(dWord);
    let r: i32 = nth;
    let s: i32 = 0;
    let a: i32 = 0;
    let b: i32 = 0;
    let c: i32 = 0;
    let d: i32 = 0;
    let t: i32 = 0;

    a = v - ((v >> 1) & 0x55555555);
    b = (a & 0x33333333) + ((a >> 2) & 0x33333333);
    c = (b + (b >> 4)) & 0x0f0f0f0f;
    d = (c + (c >> 8)) & 0x00ff00ff;
    t = (d >> 32) + (d >> 48);
    // Now do branchless select!
    s = 32;
    s -= ((t - r) & 256) >> 3;
    r -= (t & ((t - r) >> 8));
    t = (d >> (s - 16)) & 0xff;
    s -= ((t - r) & 256) >> 4;
    r -= (t & ((t - r) >> 8));
    t = (c >> (s - 8)) & 0xf;
    s -= ((t - r) & 256) >> 5;
    r -= (t & ((t - r) >> 8));
    t = (b >> (s - 4)) & 0x7;
    s -= ((t - r) & 256) >> 6;
    r -= (t & ((t - r) >> 8));
    t = (a >> (s - 2)) & 0x3;
    s -= ((t - r) & 256) >> 7;
    r -= (t & ((t - r) >> 8));
    t = (v >> (s - 1)) & 0x1;
    s -= ((t - r) & 256) >> 8;
    s = 33 - s;
    return s - 1;
}

/**
 * Find ith 0 and return its position relative to startByte and the count
 * of bits set following this 0 (the child count).
 * The return values are compacted in one i32 number:
 * bits 0-23: position
 * bits 24-31: child count
 */
function select0(ith: i32, startByte: i32, endByte: i32): i32 {
    let bytePos: i32 = startByte;
    let count: i32 = 0;
    let dWord: i32 = 0;
    let dWord0Count: i32 = 0;

    // Find pos of ith 0 (first 0)
    while (count < ith) {
        if (bytePos > endByte) {
            return 0;
        }
        dWord = ~load<u32>(bytePos);
        dWord0Count = popcnt<i32>(dWord);
        count += dWord0Count;
        bytePos += 4;
    }
    count -= dWord0Count;
    bytePos -= 4;
    const firstPosInByte: i32 = get1PosIndDWord(dWord, ith - count);
    const firstPos: i32 = ((bytePos - startByte) << 3) + firstPosInByte;
    // Find pos of ith + 1 0 (second 0)
    ith += 1;
    while (count < ith) {
        if (bytePos > endByte) {
            return 0;
        }
        dWord = ~load<u32>(bytePos);
        dWord0Count = popcnt<i32>(dWord);
        count += dWord0Count;
        bytePos += 4;
    }
    count -= dWord0Count;
    bytePos -= 4;
    const secndPosInByte: i32 = get1PosIndDWord(dWord, ith - count);
    const secndPos: i32 = ((bytePos - startByte) << 3) + secndPosInByte;

    return (firstPos << 8) + (secndPos - firstPos - 1);
}

function extractValuesToHp(valIdx: i32, length: i32, startOffset: i32): void {
    let byteIdx: i32 = valIdx >> 1;
    let currentByte: i32 = load<u8>(byteIdx, va);
    let pos: i32 = valIdx & 1;
    let valuesWritten: i32 = 0;
    let newValue: i32 = 0;
    if (pos) {
        // Second (right) half of byte
        valuesWritten = currentByte & 15;
    } else {
        // First (left) half of byte
        valuesWritten = currentByte >> 4;
    }
    let i: i32 = 1;
    let addr: i32 = startOffset + valuesWritten;
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

export function subst(ccl: i32, ccu: i32, replcc: i32): i32 {
    const replccInt: i32 = pullFromTranslateMap(replcc);
    lct <<= 1;
    if (replccInt !== 255) {
        pushToTranslateMap(ccl, replccInt);
        if (ccu !== 0) {
            pushToTranslateMap(ccu, replccInt);
        }
        // Add to alphabet
        store<u16>(lct, ccl, 1280);
        lct += 2;
    }
    lct >>= 1;
    return lct;
}

export function hyphenate(lmin: i32, rmin: i32, hc: i32): i32 {
    let patternStartPos: i32 = 0;
    let wordLength: i32 = 0;
    let charOffset: i32 = 0;
    let cc: i32 = 0;
    let hyphenPointsCount: i32 = 0;
    let translatedChar: i32 = 0;
    let currNode: i32 = 0;

    // Translate UTF16 word to internal ints and clear hpPos-Array
    cc = load<u16>(0);
    while (cc !== 0) {
        translatedChar = pullFromTranslateMap(cc);
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
        currNode = 0;
        let nthChildIdx: i32 = 0;
        while (charOffset < wordLength) {
            cc = load<u8>(charOffset, tw);
            const sel0 = select0(currNode + 1, bm, cm);
            const firstChild: i32 = (sel0 >> 8) - currNode;
            const childCount: i32 = sel0 & 255;
            let nthChild: i32 = 0;
            while (nthChild < childCount) {
                nthChildIdx = firstChild + nthChild;
                if (load<u8>(nthChildIdx - 1, cm) === cc) {
                    break;
                }
                nthChild += 1;
            }
            if (nthChild === childCount) {
                break;
            }
            currNode = nthChildIdx;
            if (getBitAtPos(currNode - 1, hv) === 1) {
                const pos: i32 = rank1(currNode, hv);
                const sel: i32 = select0(
                    pos,
                    vm,
                    va - 1
                );
                const valBitsStart: i32 = sel >> 8;
                const len: i32 = sel & 255;
                const valIdx: i32 = rank1(valBitsStart, vm);
                extractValuesToHp(valIdx, len, patternStartPos);
            }
            charOffset += 1;
        }
        patternStartPos += 1;
    }

    // Get chars of original word and insert hyphenPoints
    charOffset = 0;
    hyphenPointsCount = 0;
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
    store<u16>(
        (charOffset + hyphenPointsCount) << 1,
        0
    );
    return wordLength + hyphenPointsCount;
}

createTranslateMap();
