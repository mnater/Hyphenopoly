function nodeBuffer2typedArray(buf) {
    //https://github.com/jhiesey/to-arraybuffer/blob/master/index.js
    // If the buffer isn't a subarray, return the underlying ArrayBuffer
    if (buf.byteOffset === 0 && buf.byteLength === buf.buffer.byteLength) {
        return buf.buffer;
    } else if (typeof buf.buffer.slice === 'function') {
        // Otherwise we need to get a proper copy
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
}

/**
 * Calculate Base Data
 *
 * Build Heap (the heap object's byteLength must be
 * either 2^n for n in [12, 24)
 * or 2^24 · n for n ≥ 1;)
 *
 * MEMORY LAYOUT:
 *
 * -------------------- <- Offset 0
 * |   translateMap   |
 * |        keys:     |
 * |256 chars * 2Bytes|
 * |         +        |
 * |      values:     |
 * |256 chars * 1Byte |
 * -------------------- <- 768 Bytes
 * |     alphabet     |
 * |256 chars * 2Bytes|
 * -------------------- <- valueStoreOffset (vs) = 1280
 * |    valueStore    |
 * |      1 Byte      |
 * |* valueStoreLength|
 * --------------------
 * | align to 4Bytes  |
 * -------------------- <- patternTrieOffset (pt)
 * |    patternTrie   |
 * |     4 Bytes      |
 * |*patternTrieLength|
 * -------------------- <- wordOffset (wo)
 * |    wordStore     |
 * |    Uint16[64]    | 128 bytes
 * -------------------- <- translatedWordOffset (tw)
 * | transl.WordStore |
 * |    Uint8[64]     | 64 bytes
 * -------------------- <- hyphenPointsOffset (hp)
 * |   hyphenPoints   |
 * |    Uint8[64]     | 64 bytes
 * -------------------- <- hyphenatedWordOffset (hw)
 * |  hyphenatedWord  |
 * |   Uint16[128]    | 256 Bytes
 * -------------------- <- hpbOffset (ho)      -
 * |     HEADER       |                        |
 * |    6*4 Bytes     |                        |
 * |    24 Bytes      |                        |
 * --------------------                        |
 * |    PATTERN LIC   |                        |
 * |  variable Length |                        |
 * --------------------                        |
 * | align to 4Bytes  |                        } this is the .hpb-file
 * -------------------- <- hpbTranslateOffset  |
 * |    TRANSLATE     |                        |
 * | 2 + [0] * 2Bytes |                        |
 * -------------------- <-hpbPatternsOffset(po)|
 * |     PATTERNS     |                        |
 * |  patternsLength  |                        |
 * -------------------- <- heapEnd             -
 * | align to 4Bytes  |
 * -------------------- <- heapSize (hs)
 * @param {Object} hpbBuf FileBuffer from .hpb-file
 * @returns {Object} baseData-object
 */
function calculateBaseData(hpbBuf) {
    hpbBuf = nodeBuffer2typedArray(hpbBuf);
    const hpbMetaData = new Uint32Array(hpbBuf).subarray(0, 8);
    const valueStoreLength = hpbMetaData[7];
    const valueStoreOffset = 1280;
    const patternTrieOffset = valueStoreOffset + valueStoreLength +
        (4 - ((valueStoreOffset + valueStoreLength) % 4));
    const wordOffset = patternTrieOffset + (hpbMetaData[6] * 4);
    return {
        // Set hpbOffset
        "ho": wordOffset + 512,
        // Set hyphenPointsOffset
        "hp": wordOffset + 192,
        // Set heapSize
        "hs": Math.max(
            // eslint-disable-next-line max-len
            Math.ceil((wordOffset + 512 + hpbMetaData[2] + hpbMetaData[3]) / 65536) * 65536,
            32 * 1024 * 64
        ),
        // Set hyphenatedWordOffset
        "hw": wordOffset + 256,
        // Set leftmin
        "lm": hpbMetaData[4],
        // Set patternsLength
        "pl": hpbMetaData[3],
        // Set hpbPatternsOffset
        "po": wordOffset + 512 + hpbMetaData[2],
        // Set patternTrieOffset
        "pt": patternTrieOffset,
        // Set rightmin
        "rm": hpbMetaData[5],
        // Set translateOffset
        "to": wordOffset + 512 + hpbMetaData[1],
        // Set translatedWordOffset
        "tw": wordOffset + 128,
        // Set valueStoreOffset
        "vs": valueStoreOffset,
        // Set wordOffset
        "wo": wordOffset
    };
}

module.exports = {calculateBaseData};