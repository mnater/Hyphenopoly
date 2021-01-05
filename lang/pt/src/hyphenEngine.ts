/* eslint-disable max-depth */
import {hp, hw, lm, pl, po, pt, rm, to, tw, vs, wo} from "./g";
export const uwo: i32 = wo;
export const hwo: i32 = hw;
export const lmi: i32 = lm;
export const rmi: i32 = rm;

let alphabetCount: i32 = 0;

/**
 * Maps BMP-charCode (16bit) to 8bit adresses
 *
 * {0, 1, 2, ..., 2^16 - 1} -> {1, 2, ..., 2^8}
 * collisions will occur!
 */
function hashCharCode(cc: i32): i32 {
    // 2^16 (-1 + sqrt(5)) / 2 = 40’503.475...
    let h: i32 = cc * 40503;
    // Mask 8bits
    h &= 255;
    return h << 1;
}

function pushToTranslateMap(cc: i32, id: i32): void {
    let addr = hashCharCode(cc);
    while (load<u16>(addr) !== 0) {
        addr += 2;
    }
    store<u16>(addr, cc);
    store<u8>(addr >> 1, id, 512);
}

function pullFromTranslateMap(cc: i32): i32 {
    let addr = hashCharCode(cc);
    while (load<u16>(addr) !== cc) {
        addr += 2;
        if (addr >= 512) {
            return 255;
        }
    }
    return load<u8>(addr >> 1, 512);
}


function createTranslateMap(): i32 {
    let i: i32 = 0;
    let k: i32 = 1;
    let first: i32 = 0;
    let second: i32 = 0;
    let secondInt: i32 = 0;
    i = to + 2;
    while (i < po) {
        first = load<u16>(i);
        second = load<u16>(i, 2);
        if (second === 0) {
            secondInt = 255;
        } else {
            secondInt = pullFromTranslateMap(second);
        }
        if (secondInt === 255) {
            // There's no such char yet in the TranslateMap
            pushToTranslateMap(first, k);
            if (second !== 0) {
                // Set upperCase representation
                pushToTranslateMap(second, k);
            }
            k += 1;
        } else {
            // Char is already in TranslateMap -> SUBSTITUTION
            pushToTranslateMap(first, secondInt);
        }
        // Add to alphabet
        store<u16>(alphabetCount, first, 1024);
        alphabetCount += 2;
        i += 4;
    }
    return alphabetCount >> 1;
}

export function subst(ccl: i32, ccu: i32, replcc: i32): i32 {
    const replccInt: i32 = pullFromTranslateMap(replcc);
    if (replccInt !== 255) {
        pushToTranslateMap(ccl, replccInt);
        if (ccu !== 0) {
            pushToTranslateMap(ccu, replccInt);
        }
        // Add to alphabet
        store<u16>(alphabetCount, ccl, 1024);
        alphabetCount += 2;
    }
    return alphabetCount >> 1;
}

/**
 * Convert pattern data to linked list trie
 * Node structure: (0) char, (4) value, (8) child, (12) sibling
 */
export function conv(): i32 {
    let i: i32 = po;
    const patternEnd: i32 = po + pl;
    let charAti: i32 = 0;
    let plen: i32 = 0;
    let count: i32 = 0;
    let valueStoreStartIndex: i32 = vs;
    let valueStoreCurrentIdx: i32 = vs;
    let valueStorePrevIdx: i32 = vs;
    let first: i32 = 0;
    let second: i32 = 0;
    let nextNode: i32 = 0;
    let currNode: i32 = pt;
    let nodeChar: i32 = 0;
    let nextFreeNode: i32 = pt + 16;

    while (i < patternEnd) {
        charAti = load<u8>(i);
        if (charAti === 0) {
            plen = load<u8>(i, 1);
            i += 2;
        } else {
            if (charAti === 255) {
                first = load<u8>(i, 1);
                second = load<u8>(i, 2);
                i += 3;
            }
            while (count < plen) {
                if (count === 0) {
                    charAti = first;
                } else if (count === 1) {
                    charAti = second;
                } else {
                    charAti = load<u8>(i);
                    i += 1;
                }
                if (charAti > 11) {
                    charAti -= 11;
                    valueStoreCurrentIdx += 1;
                    nextNode = load<u32>(currNode + 8);
                    if (nextNode === 0) {
                        // Insert child node
                        nextNode = nextFreeNode;
                        nextFreeNode += 16;
                        store<u32>(nextNode, charAti);
                        store<u32>(currNode + 8, nextNode);
                        currNode = nextNode;
                    } else {
                        do {
                            // Search matching sibling node
                            currNode = nextNode;
                            nodeChar = load<u32>(currNode);
                            nextNode = load<u32>(currNode + 12);
                        } while (nodeChar !== charAti && nextNode !== 0);
                        if (nextNode === 0 && nodeChar !== charAti) {
                            // Insert sibling node
                            nextNode = nextFreeNode;
                            nextFreeNode += 16;
                            store<u32>(nextNode, charAti);
                            store<u32>(currNode + 12, nextNode);
                            currNode = nextNode;
                        }
                    }
                } else {
                    store<u8>(valueStoreCurrentIdx, charAti);
                    valueStorePrevIdx = valueStoreCurrentIdx;
                }
                count += 1;
            }
            // Terminate valueStore and save link to valueStoreStartIndex
            store<u8>(valueStorePrevIdx, 255, 1);
            store<u32>(currNode + 4, valueStoreStartIndex);
            // Reset indizes
            valueStoreStartIndex = valueStorePrevIdx + 2;
            valueStoreCurrentIdx = valueStoreStartIndex;
            count = 0;
            currNode = pt;
        }
    }
    return createTranslateMap();
}

export function hyphenate(lmin: i32, rmin: i32, hc: i32): i32 {
    let patternStartPos: i32 = 0;
    let wordLength: i32 = 0;
    let charOffset: i32 = 0;
    let cc: i32 = 0;
    let value: i32 = 0;
    let hyphenPointsCount: i32 = 0;
    let hyphenPoint: i32 = 0;
    let hpPos: i32 = 0;
    let translatedChar: i32 = 0;
    let currNode: i32 = pt;
    let nextNode: i32 = 0;
    let nodeChar: i32 = 0;

    // Translate UTF16 word to internal ints and clear hpPos-Array
    cc = load<u16>(wo);
    while (cc !== 0) {
        translatedChar = pullFromTranslateMap(cc);
        if (translatedChar === 255) {
            return 0;
        }
        store<u8>(charOffset, translatedChar, tw);
        charOffset += 1;
        store<u8>(charOffset, 0, hp);
        cc = load<u16>(charOffset << 1, wo);
    }
    // Find patterns and collect hyphenPoints
    wordLength = charOffset;
    while (patternStartPos < wordLength) {
        charOffset = patternStartPos;
        while (charOffset < wordLength) {
            cc = load<u8>(charOffset, tw);
            nextNode = load<u32>(currNode + 8);
            if (nextNode === 0) {
                break;
            }
            do {
                currNode = nextNode;
                nodeChar = load<u32>(currNode);
                nextNode = load<u32>(currNode + 12);
            } while (nodeChar !== cc && nextNode !== 0);
            if (nodeChar === cc) {
                value = load<u32>(currNode + 4);
                if (value !== 0) {
                    hyphenPointsCount = 0;
                    hyphenPoint = load<u8>(value);
                    while (hyphenPoint !== 255) {
                        if (hyphenPoint !== 0) {
                            hpPos = patternStartPos + hyphenPointsCount;
                            if (hyphenPoint > load<u8>(hpPos, hp)) {
                                store<u8>(hpPos, hyphenPoint, hp);
                            }
                        }
                        hyphenPointsCount += 1;
                        hyphenPoint = load<u8>(value + hyphenPointsCount);
                    }
                }
            } else {
                break;
            }

            charOffset += 1;
        }
        patternStartPos += 1;
        currNode = pt;
    }

    // Get chars of original word and insert hyphenPoints
    charOffset = 0;
    hyphenPointsCount = 0;
    wordLength -= 2;
    rmin = wordLength - rmin - 1;
    while (charOffset < wordLength) {
        store<u16>(
            (charOffset + hyphenPointsCount) << 1,
            load<u16>(charOffset << 1, wo + 2),
            hw
        );
        if ((charOffset >= lmin - 1) && (charOffset <= rmin)) {
            if (load<u8>(charOffset, hp + 2) & 1) {
                hyphenPointsCount += 1;
                store<u16>((charOffset + hyphenPointsCount) << 1, hc, hw);
            }
        }
        charOffset += 1;
    }
    return wordLength + hyphenPointsCount;
}
