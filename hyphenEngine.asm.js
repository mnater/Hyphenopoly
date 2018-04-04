function asmHyphenEngine(std, ext, heap) {
    "use asm";
    var hpbTranslateOffset = ext.hpbTranslateOffset | 0;
    var hpbPatternsOffset = ext.hpbPatternsOffset | 0;
    var patternsLength = ext.patternsLength | 0;
    var charMapOffset = ext.charMapOffset | 0;
    var valueStoreOffset = ext.valueStoreOffset | 0;
    var patternTrieOffset = ext.patternTrieOffset | 0;
    var wordOffset = ext.wordOffset | 0;
    var hyphenPointsOffset = ext.hyphenPointsOffset | 0;
    var ui8 = new std.Uint8Array(heap);
    var ui16 = new std.Uint16Array(heap);
    var i32 = new std.Int32Array(heap);
    var trieRowLength = 0;

    function createTranslateLookUpTable() {
        var i = 0;
        var k = 0;
        i = (hpbTranslateOffset + 2) | 0;
        k = 12 | 0;
        trieRowLength = ui16[hpbTranslateOffset >> 1] << 1;
        while ((i | 0) < (hpbPatternsOffset | 0)) {
            if ((ui16[(charMapOffset + (ui16[(i + 2) >> 1] << 1)) >> 1] | 0) == 0) {
                ui16[(charMapOffset + (ui16[i >> 1] << 1)) >> 1] = k;
                if ((ui16[(i + 2) >> 1] | 0) != 0) {
                    ui16[(charMapOffset + (ui16[(i + 2) >> 1] << 1)) >> 1] = k;
                }
                k = (k + 1) | 0;
            } else {
                //substitute
                ui16[(charMapOffset + (ui16[i >> 1] << 1)) >> 1] = ui16[(charMapOffset + (ui16[(i + 2) >> 1] << 1)) >> 1];
            }
            i = (i + 4) | 0;
        }
    }

    function translateCharCode(cc) {
        cc = cc | 0;
        return (ui16[(charMapOffset + (cc << 1)) >> 1] - 12) << 3;
    }

    function convert() {
        var i = 0;
        var last_i = 0;
        var charAti = 0;
        var mode = 0; //0: init/collect patterns, 1: get patlen
        var plen = 0;
        var count = 0;
        var prevWasDigit = 0;
        var nextRowStart = 0;
        var trieNextEmptyRow = 0;
        var rowStart = 0;
        var rowOffset = 0;
        var valueStoreStartIndex = 0;
        var valueStoreCurrentIdx = 0;
        var valueStorePrevIdx = 0;
        valueStoreStartIndex = (valueStoreOffset + 1) | 0;
        valueStoreCurrentIdx = (valueStoreOffset + 1) | 0;
        valueStorePrevIdx = (valueStoreOffset + 1) | 0;

        createTranslateLookUpTable();

        i = hpbPatternsOffset | 0;
        last_i = hpbPatternsOffset + patternsLength | 0;
        while ((i | 0) < (last_i | 0)) {
            charAti = ui8[i | 0] | 0;
            if ((charAti | 0) == 58) { //58 === ":"
                mode = !mode;
            } else {
                if ((mode | 0) == 1) {
                    plen = charAti | 0;
                } else {
                    count = (count + 1) | 0;
//add to trie
                    if ((charAti | 0) > 11) {
                        if ((prevWasDigit | 0) == 0) {
                            valueStoreCurrentIdx = (valueStoreCurrentIdx + 1) | 0;
                        }
                        prevWasDigit = 0;
                        if ((nextRowStart | 0) == -1) {
                            //start a new row
                            trieNextEmptyRow = (trieNextEmptyRow + ((trieRowLength + 1) | 0) * 4) | 0;
                            nextRowStart = trieNextEmptyRow;
                            i32[(patternTrieOffset + rowStart + rowOffset) >> 2] = nextRowStart;
                        }
                        rowOffset = ((charAti - 12) | 0) << 3;
                        rowStart = nextRowStart;
                        nextRowStart = i32[(patternTrieOffset + rowStart + rowOffset) >> 2] | 0;
                        if ((nextRowStart | 0) == 0) {
                            i32[(patternTrieOffset + rowStart + rowOffset) >> 2] = -1;
                            nextRowStart = -1;
                        }
                    } else {
                        ui8[valueStoreCurrentIdx | 0] = charAti | 0;
                        valueStorePrevIdx = valueStoreCurrentIdx;
                        valueStoreCurrentIdx = (valueStoreCurrentIdx + 1) | 0;
                        prevWasDigit = 1;
                    }
                    if ((count | 0) == (plen | 0)) {
//terminate valueStore and save link to valueStoreStartIndex
                        ui8[(valueStorePrevIdx + 1) | 0] = 255; //mark end of pattern
                        i32[(patternTrieOffset + rowStart + rowOffset + 4) >> 2] = (valueStoreStartIndex - valueStoreOffset) | 0;
//reset indizes
                        valueStoreStartIndex = (valueStorePrevIdx + 2) | 0;
                        valueStoreCurrentIdx = valueStoreStartIndex;
                        count = 0;
                        rowStart = 0;
                        nextRowStart = 0;
                        prevWasDigit = 0;
                    }
                }
            }
            i = (i + 1) | 0;
        }
    }

    function hyphenate() {
        var patternStartPos = 0;
        var wordLength = 0;
        var charOffset = 0;
        var row = 0;
        var wordStartOffset = 0;
        var rowOffset2 = 0;
        var link = 0;
        var value = 0;
        var hyphenPointsCount = 0;
        var hyphenPoint = 0;
        var hpPos = 0;
        wordLength = (ui8[wordOffset | 0] << 1) | 0;
        wordStartOffset = (wordOffset + 2) | 0;

        //translate UTF16 word to internal ints
        while ((charOffset | 0) < (wordLength | 0)) {
            ui16[(wordStartOffset + charOffset) >> 1] = translateCharCode(ui16[(wordStartOffset + charOffset) >> 1] | 0) | 0;
            charOffset = (charOffset + 2) | 0;
        }

        while ((hpPos | 0) < ((wordLength + 1) | 0)) {
            ui8[(hyphenPointsOffset + hpPos) | 0] = 0;
            hpPos = (hpPos + 1) | 0;
        }

        hpPos = 0;

        while ((patternStartPos | 0) < (wordLength | 0)) {
            row = 0;
            charOffset = patternStartPos | 0;
            while ((charOffset | 0) < (wordLength | 0)) {
                rowOffset2 = ui16[(wordStartOffset + charOffset) >> 1] | 0;
                link = i32[(patternTrieOffset + row + rowOffset2) >> 2] | 0;
                value = i32[(patternTrieOffset + row + rowOffset2 + 4) >> 2] | 0;
                if ((value | 0) > 0) {
                    hyphenPointsCount = 0;
                    hyphenPoint = ui8[(valueStoreOffset + value) | 0] | 0;
                    while ((hyphenPoint | 0) != 255) {
                        hpPos = (hyphenPointsOffset + (patternStartPos >> 1) + hyphenPointsCount) | 0;
                        if ((hyphenPoint | 0) > (ui8[hpPos | 0] | 0)) {
                            ui8[hpPos | 0] = hyphenPoint | 0;
                        }
                        hyphenPointsCount = (hyphenPointsCount + 1) | 0;
                        hyphenPoint = ui8[(valueStoreOffset + value + hyphenPointsCount) | 0] | 0;
                    }
                }
                if ((link | 0) > 0) {
                    row = link | 0;
                } else {
                    break;
                }
                charOffset = (charOffset + 2) | 0;
            }
            patternStartPos = (patternStartPos + 2) | 0;
        }
    }

    return {
        convert: convert,
        hyphenate: hyphenate
    };
}