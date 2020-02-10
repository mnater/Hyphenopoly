import {hp, hw, lm, pl, po, pt, rm, to, tw, vs, wo} from "./g";

export const uwo: i32 = wo;
export const hwo: i32 = hw;
export const lmi: i32 = lm;
export const rmi: i32 = rm;

/**
 * Maps BMP-charCode (16bit) to 8bit adresses
 *
 * {0, 1, 2, ..., 2^16 - 1} -> {0, 1, 2, ..., 2^8 - 1}
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
    let k: i32 = 0;
    let first: i32 = 0;
    let second: i32 = 0;
    let secondInt: i32 = 0;
    let alphabetCount: i32 = 0;
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
        store<u16>(alphabetCount, first, 768);
        alphabetCount += 2;
        i += 4;
    }
    return alphabetCount >> 1;
}

export function conv(): i32 {
    let i: i32 = po;
    const patternEnd: i32 = po + pl;
    let charAti: i32 = 0;
    let plen: i32 = 0;
    let count: i32 = 0;
    let nextRowStart: i32 = pt;
    let trieNextEmptyRow: i32 = pt;
    let rowStart: i32 = pt;
    let rowOffset: i32 = 0;
    let valueStoreStartIndex: i32 = vs;
    let valueStoreCurrentIdx: i32 = vs;
    let valueStorePrevIdx: i32 = vs;
    let first: i32 = 0;
    let second: i32 = 0;
    const trieRowLength: i32 = ((load<u16>(to) << 1) + 1) << 2;

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
                    valueStoreCurrentIdx += 1;
                    if (nextRowStart === 0) {
                        // Start a new row
                        trieNextEmptyRow += trieRowLength;
                        nextRowStart = trieNextEmptyRow;
                        store<i32>(rowStart + rowOffset, nextRowStart);
                    }
                    rowOffset = (charAti - 12) << 3;
                    rowStart = nextRowStart;
                    nextRowStart = load<i32>(rowStart + rowOffset);
                } else {
                    store<u8>(valueStoreCurrentIdx, charAti);
                    valueStorePrevIdx = valueStoreCurrentIdx;
                }
                count += 1;
            }
            // Terminate valueStore and save link to valueStoreStartIndex
            store<u8>(valueStorePrevIdx, 255, 1);
            store<i32>(rowStart + rowOffset, valueStoreStartIndex, 4);
            // Reset indizes
            valueStoreStartIndex = valueStorePrevIdx + 2;
            valueStoreCurrentIdx = valueStoreStartIndex;
            count = 0;
            rowStart = pt;
            nextRowStart = pt;
        }
    }
    return createTranslateMap();
}

export function hyphenate(lmin: i32, rmin: i32, hc: i32): i32 {
    let patternStartPos: i32 = 0;
    let wordLength: i32 = 0;
    let charOffset: i32 = 0;
    let cc: i32 = 0;
    let row: i32 = 0;
    let rowOffset: i32 = 0;
    let link: i32 = 0;
    let value: i32 = 0;
    let hyphenPointsCount: i32 = 0;
    let hyphenPoint: i32 = 0;
    let hpPos: i32 = 0;
    let translatedChar: i32 = 0;

    // Translate UTF16 word to internal ints and clear hpPos-Array
    cc = load<u16>(wo);
    while (cc !== 0) {
        translatedChar = pullFromTranslateMap(cc);
        if (translatedChar === 255) {
            return 0;
        }
        store<u8>(tw + charOffset, translatedChar);
        charOffset += 1;
        store<u8>(hp + charOffset, 0);
        cc = load<u16>(wo + (charOffset << 1));
    }
    // Find patterns and collect hyphenPoints
    wordLength = charOffset;
    while (patternStartPos < wordLength) {
        row = pt;
        charOffset = patternStartPos;
        while (charOffset < wordLength) {
            rowOffset = load<u8>(tw + charOffset) << 3;
            link = load<i32>(row + rowOffset);
            value = load<i32>(row + rowOffset, 4);
            if (value > 0) {
                hyphenPointsCount = 0;
                hyphenPoint = load<u8>(value);
                while (hyphenPoint !== 255) {
                    hpPos = hp + patternStartPos + hyphenPointsCount;
                    // eslint-disable-next-line max-depth
                    if (hyphenPoint > load<u8>(hpPos)) {
                        store<u8>(hpPos, hyphenPoint);
                    }
                    hyphenPointsCount += 1;
                    hyphenPoint = load<u8>(value + hyphenPointsCount);
                }
            }
            if (link > 0) {
                row = link;
            } else {
                break;
            }
            charOffset += 1;
        }
        patternStartPos += 1;
    }

    // Get chars of original word and insert hyphenPoints
    charOffset = 1;
    hyphenPointsCount = 0;
    wordLength -= 2;
    rmin = wordLength - rmin;
    while (charOffset <= wordLength) {
        store<u16>(
            hw + (charOffset << 1) + hyphenPointsCount,
            load<u16>(wo + (charOffset << 1))
        );
        if ((charOffset >= lmin) && (charOffset <= rmin)) {
            if (load<u8>(hp + charOffset, 1) & 1) {
                hyphenPointsCount += 2;
                store<u16>(hw + (charOffset << 1) + hyphenPointsCount, hc);
            }
        }
        charOffset += 1;
    }
    store<u16>(hw, wordLength + (hyphenPointsCount >> 1));
    return 1;
}
