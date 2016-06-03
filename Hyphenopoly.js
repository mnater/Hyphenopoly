;/*jslint browser*/
/*global window, Hyphenopoly*/

(function configurationFactory() {
    "use strict";
    var config = Object.create(null);

    var generalDefaults = {
        timeout: 3000,
        defaultLanguage: "en",
        dontHyphenateClass: "donthyphenate",
        dontHyphenate: {
            'video': true,
            'audio': true,
            'script': true,
            'code': true,
            'pre': true,
            'img': true,
            'br': true,
            'samp': true,
            'kbd': true,
            'var': true,
            'abbr': true,
            'acronym': true,
            'sub': true,
            'sup': true,
            'button': true,
            'option': true,
            'label': true,
            'textarea': true,
            'input': true,
            'math': true,
            'svg': true,
            'style': true
        },
        safeCopy: true,
        onHyphenopolyStart: function () {
            window.console.timeStamp("Hyphenopoly start!");
        },
        onHyphenationDone: function () {
            window.console.timeStamp("Hyphenation done!");
        },
        onHyphenationFailed: function (e) {
            window.console.error("Hyphenopoly.js error", e);
        }
        /*set up in Loader:
        onTimeOut: function () {
            window.console.warn("Hyphenopoly timed out");
        }
        */
    };
    var perClassDefaults = {
        minWordLength: 6,
        leftmin: 0,
        rightmin: 0,
        hyphen: String.fromCharCode(173), //soft hyphen
        /**
         * Control how the last words of a line are handled:
         * level 1 (default): last word is hyphenated
         * level 2: last word is not hyphenated
         * level 3: last word is not hyphenated and last space is non breaking
         */
        orphanControl: 1,
        /**
         * Control how compound words are handled
         * "auto": hyphenate all parts, now zwsp insertion
         * "hyphen": insert zero width space as breaking opportunity after "-"
         * "all": hyphenate all parts, insert zero width space after "-"
         */
        compound: "hyphen",
        onBeforeWordHyphenation: function (word) {
            return word;
        },
        onAfterWordHyphenation: function (word) {
            return word;
        }
    };

    var data = {
        classnames: {}
    };
    var state = undefined;
    Object.defineProperty(config, "state", {
        configurable: false,
        enumerable: false,
        get: function () {
            return state;
        },
        set: function (value) {
            state = value;
            if (!data.classnames.hasOwnProperty(state)) {
                data.classnames[state] = {};
            }
        }
    });

    //General settings
    Object.keys(generalDefaults).forEach(function (name) {
        Object.defineProperty(config, name, {
            get: function () {
                if (data.hasOwnProperty(name)) {
                    return data[name];
                }
                return generalDefaults[name];
            },
            set: function (value) {
                data[name] = value;
            }
        });
    });

    //per class settings
    Object.keys(perClassDefaults).forEach(function (name) {
        Object.defineProperty(config, name, {
            get: function () {
                if (data.classnames[state].hasOwnProperty(name)) {
                    return data.classnames[state][name];
                }
                return perClassDefaults[name];
            },
            set: function (value) {
                data.classnames[state][name] = value;
            }
        });
    });

    Object.defineProperty(config, "toString", {
        value: function () {
            return data;
        }
    });

    Object.defineProperty(config, "getClassNames", {
        value: function () {
            return Object.keys(data.classnames);
        }
    });

    Hyphenopoly.c = config;
}());

(function config() {
    "use strict";
    //copy settings if not yet set
    Object.keys(Hyphenopoly.setup).forEach(function (key) {
        if (key === "classnames") {
            Object.keys(Hyphenopoly.setup.classnames).forEach(function (cn) {
                Hyphenopoly.c.state = cn;
                Object.keys(Hyphenopoly.setup.classnames[cn]).forEach(function (pcnkey) {
                    Hyphenopoly.c[pcnkey] = Hyphenopoly.setup.classnames[cn][pcnkey];
                });
            });
        } else {
            Hyphenopoly.c[key] = Hyphenopoly.setup[key];
        }
    });
}());

(function H9Y(w) {
    "use strict";
    var H = Hyphenopoly;
    var C = H.c;

    var mainLanguage = null;

    var elements = (function () {

        function makeElement(element, cn) {
            return {
                element: element,
                hyphenated: false,
                treated: false,
                class: cn
            };
        }

        function makeElementCollection() {
            // array of [number of collected elements, number of hyphenated elements]
            var counters = [0, 0];

            var list = {};

            function add(el, lang) {
                var elo = makeElement(el, C.state);
                if (!list.hasOwnProperty(lang)) {
                    list[lang] = [];
                }
                list[lang].push(elo);
                counters[0] += 1;
                return elo;
            }

            function each(fn) {
                Object.keys(list).forEach(function (k) {
                    if (fn.length === 2) {
                        fn(k, list[k]);
                    } else {
                        fn(list[k]);
                    }
                });
            }

            return {
                counters: counters,
                list: list,
                add: add,
                each: each
            };
        }
        return makeElementCollection();
    }());

    function removeHyphenationFromElement(el, cn) {
        var i = 0;
        var n;
        C.state = cn;
        var h = C.hyphen;
        if (".\\+*?[^]$(){}=!<>|:-".indexOf(C.hyphen) !== -1) {
            h = "\\" + h;
        }
        n = el.childNodes[i];
        while (!!n) {
            if (n.nodeType === 3) {
                n.data = n.data.replace(new RegExp(h, 'g'), '');
            } else if (n.nodeType === 1) {
                removeHyphenationFromElement(n);
            }
            i += 1;
            n = el.childNodes[i];
        }
    }

    var zeroTimeOut = (function () {
        if (window.postMessage && window.addEventListener) {
            return (function () {
                var timeouts = [];
                var msg = "Hyphenator_zeroTimeOut_message";
                function setZeroTimeOut(fn) {
                    timeouts.push(fn);
                    window.postMessage(msg, "*");
                }
                function handleMessage(event) {
                    if (event.source === window && event.data === msg) {
                        event.stopPropagation();
                        if (timeouts.length > 0) {
                            //var efn = timeouts.shift();
                            //efn();
                            timeouts.shift()();
                        }
                    }
                }
                window.addEventListener("message", handleMessage, true);
                return setZeroTimeOut;
            }());
        }
        return function (fn) {
            window.setTimeout(fn, 0);
        };
    }());

    var copy = (function () {
        var makeCopy = function () {
            function oncopyHandler(e, cn) {
                e = e || window.event;
                var shadow;
                var selection;
                var range;
                var restore;
                var target = e.target || e.srcElement;
                var currDoc = target.ownerDocument;
                var bdy = currDoc.getElementsByTagName('body')[0];
                var targetWindow = currDoc.defaultView || currDoc.parentWindow;
                if (target.tagName && C.dontHyphenate[target.tagName.toLowerCase()]) {
                    //Safari needs this
                    return;
                }
                //create a hidden shadow element
                shadow = currDoc.createElement('div');
                shadow.style.color = window.getComputedStyle
                    ? targetWindow.getComputedStyle(bdy, null).backgroundColor
                    : '#FFFFFF';
                shadow.style.fontSize = '0px';
                bdy.appendChild(shadow);
                e.stopPropagation();
                selection = targetWindow.getSelection();
                range = selection.getRangeAt(0);
                shadow.appendChild(range.cloneContents());
                removeHyphenationFromElement(shadow, cn);
                selection.selectAllChildren(shadow);
                restore = function () {
                    shadow.parentNode.removeChild(shadow);
                    selection.removeAllRanges(); //IE9 needs that
                    selection.addRange(range);
                };
                zeroTimeOut(restore);
            }
            function removeOnCopy(el) {
                var body = el.ownerDocument.getElementsByTagName('body')[0];
                if (!body) {
                    return;
                }
                el = el || body;
                el.removeEventListener("copy", oncopyHandler, true);
            }
            function registerOnCopy(el, cn) {
                var body = el.ownerDocument.getElementsByTagName('body')[0];
                if (!body) {
                    return;
                }
                el = el || body;
                el.addEventListener("copy", function (e) {
                    oncopyHandler(e, cn);
                }, true);
            }
            return {
                oncopyHandler: oncopyHandler,
                removeOnCopy: removeOnCopy,
                registerOnCopy: registerOnCopy
            };
        };

        return (C.safeCopy
            ? makeCopy()
            : false);
    }());

    var exceptions = {};

    function makeCharMap() {
        var int2code = [];
        var code2int = {};
        function add(newValue) {
            if (!code2int[newValue]) {
                int2code.push(newValue);
                code2int[newValue] = (int2code.length - 1);
            }
        }
        return {
            int2code: int2code,
            code2int: code2int,
            add: add
        };
    }

    function makeValueStore(len) {
        var indexes = new Uint32Array(3);
        indexes[0] = 1;
        indexes[1] = 1;
        indexes[2] = 1;
        var keys = new Uint8Array(len);
        function add(p) {
            keys[indexes[1]] = p;
            indexes[2] = indexes[1];
            indexes[1] += 1;
        }
        function add0() {
            //just do a step, since array is initialized with zeroes
            indexes[1] += 1;
        }
        function finalize() {
            var start = indexes[0];
            keys[indexes[2] + 1] = 255; //mark end of pattern
            indexes[0] = indexes[2] + 2;
            indexes[1] = indexes[0];
            return start;
        }
        return {
            keys: keys,
            add: add,
            add0: add0,
            finalize: finalize
        };
    }

    function convertPatternsToArray(lo) {
        var trieNextEmptyRow = 0;
        var i;
        var charMapc2i;
        var valueStore;
        var indexedTrie;
        var trieRowLength;

        function extract(patternSizeInt, patterns) {
            var charPos = 0;
            var charCode = 0;
            var mappedCharCode = 0;
            var rowStart = 0;
            var nextRowStart = 0;
            var prevWasDigit = false;
            while (charPos < patterns.length) {
                charCode = patterns.charCodeAt(charPos);
                if ((charPos + 1) % patternSizeInt !== 0) {
                    //more to come…
                    if (charCode <= 57 && charCode >= 49) {
                        //charCode is a digit
                        valueStore.add(charCode - 48);
                        prevWasDigit = true;
                    } else {
                        //charCode is alphabetical
                        if (!prevWasDigit) {
                            valueStore.add0();
                        }
                        prevWasDigit = false;
                        if (nextRowStart === -1) {
                            nextRowStart = trieNextEmptyRow + trieRowLength;
                            trieNextEmptyRow = nextRowStart;
                            indexedTrie[rowStart + mappedCharCode * 2] = nextRowStart;
                        }
                        mappedCharCode = charMapc2i[charCode];
                        rowStart = nextRowStart;
                        nextRowStart = indexedTrie[rowStart + mappedCharCode * 2];
                        if (nextRowStart === 0) {
                            indexedTrie[rowStart + mappedCharCode * 2] = -1;
                            nextRowStart = -1;
                        }
                    }
                } else {
                    //last part of pattern
                    if (charCode <= 57 && charCode >= 49) {
                        //the last charCode is a digit
                        valueStore.add(charCode - 48);
                        indexedTrie[rowStart + mappedCharCode * 2 + 1] = valueStore.finalize();
                    } else {
                        //the last charCode is alphabetical
                        if (!prevWasDigit) {
                            valueStore.add0();
                        }
                        valueStore.add0();
                        if (nextRowStart === -1) {
                            nextRowStart = trieNextEmptyRow + trieRowLength;
                            trieNextEmptyRow = nextRowStart;
                            indexedTrie[rowStart + mappedCharCode * 2] = nextRowStart;
                        }
                        mappedCharCode = charMapc2i[charCode];
                        rowStart = nextRowStart;
                        if (indexedTrie[rowStart + mappedCharCode * 2] === 0) {
                            indexedTrie[rowStart + mappedCharCode * 2] = -1;
                        }
                        indexedTrie[rowStart + mappedCharCode * 2 + 1] = valueStore.finalize();
                    }
                    rowStart = 0;
                    nextRowStart = 0;
                    prevWasDigit = false;
                }
                charPos += 1;
            }
        }

        lo.charMap = makeCharMap();
        i = 0;
        while (i < lo.patternChars.length) {
            lo.charMap.add(lo.patternChars.charCodeAt(i));
            i += 1;
        }
        charMapc2i = lo.charMap.code2int;

        valueStore = makeValueStore(lo.valueStoreLength);
        lo.valueStore = valueStore;

        lo.indexedTrie = new Int32Array(lo.patternArrayLength * 2);
        indexedTrie = lo.indexedTrie;
        trieRowLength = lo.charMap.int2code.length * 2;

        Object.keys(lo.patterns).forEach(function parsePat(i) {
            extract(parseInt(i, 10), lo.patterns[i]);
        });
        lo.converted = true;
    }

    function getLang(el, fallback) {
        try {
            return !!el.getAttribute('lang')
                ? el.getAttribute('lang').toLowerCase()
                : el.tagName.toLowerCase() !== 'html'
                    ? getLang(el.parentNode, fallback)
                    : fallback
                        ? mainLanguage
                        : null;
        } catch (ignore) {}
    }

    function autoSetMainLanguage() {
        var el = w.document.getElementsByTagName('html')[0];

        mainLanguage = getLang(el, false);
        //fallback to defaultLang if set
        if (!mainLanguage && C.defaultLanguage !== '') {
            mainLanguage = C.defaultLanguage;
        }
        el.lang = mainLanguage;
    }

    function sortOutSubclasses(x, y) {
        return x.filter(function (i) {
            return y.indexOf(i) !== -1;
        });
    }

    function collectElements() {
        var nl;
        var classNames = C.getClassNames();
        function processText(el, pLang, isChild) {
            var eLang;
            var n;
            var j = 0;
            isChild = isChild || false;
            //set eLang to the lang of the element
            if (el.lang && typeof el.lang === 'string') {
                eLang = el.lang.toLowerCase(); //copy attribute-lang to internal eLang
            } else if (!!pLang && pLang !== '') {
                eLang = pLang.toLowerCase();
            } else {
                eLang = getLang(el, true);
            }
            if (H.testResults.languages[eLang] === "H9Y") {
                elements.add(el, eLang);
            }

            n = el.childNodes[j];
            while (!!n) {
                if (n.nodeType === 1 &&
                        !C.dontHyphenate[n.nodeName.toLowerCase()] &&
                        n.className.indexOf(C.dontHyphenateClass) === -1) {
                    if (sortOutSubclasses(n.className.split(" "), classNames).length === 0) {
                        //this child element doesn't contain a hyphenopoly-class
                        processText(n, eLang, true);
                    }
                }
                j += 1;
                n = el.childNodes[j];
            }
        }
        classNames.forEach(function (cn) {
            C.state = cn;
            nl = w.document.querySelectorAll("." + cn);
            Array.prototype.forEach.call(nl, function (n) {
                processText(n, getLang(n), false);
            });
        });
        H.elementsReady = true;
    }

    function doCharSubst(loCharSubst, w) {
        var r = w;
        Object.keys(loCharSubst).forEach(function (subst) {
            r = r.replace(new RegExp(subst, 'g'), loCharSubst[subst]);
        });
        return r;
    }

    var wwAsMappedCharCodeStore = new Int32Array(64);
    var wwhpStore = new Uint8Array(64);

    function hyphenateCompound(lo, lang, word) {
        var hw = word;
        var parts;
        var i = 0;
        var zeroWidthSpace = String.fromCharCode(8203);
        switch (C.compound) {
        case "auto":
            parts = word.split('-');
            while (i < parts.length) {
                if (parts[i].length >= C.minWordLength) {
                    parts[i] = hyphenateWord(lo, lang, parts[i]);
                }
                i += 1;
            }
            hw = parts.join('-');
            break;
        case "all":
            parts = word.split('-');
            while (i < parts.length) {
                if (parts[i].length >= C.minWordLength) {
                    parts[i] = hyphenateWord(lo, lang, parts[i]);
                }
                i += 1;
            }
            hw = parts.join('-' + zeroWidthSpace);
            break;
        default: //"hyphen" and others
            hw = word.replace('-', '-' + zeroWidthSpace);
        }
        return hw;
    }

    //todo class based handling of leftmin/rigthmin
    function hyphenateWord(lo, lang, word) {
        var ww;
        var wwlen;
        var wwhp = wwhpStore;
        var pstart = 0;
        var plen;
        var hp;
        var hpc;
        var wordLength = word.length;
        var hw = '';
        var charMap = lo.charMap.code2int;
        var charCode;
        var mappedCharCode;
        var row = 0;
        var link = 0;
        var value = 0;
        var indexedTrie = lo.indexedTrie;
        var valueStore = lo.valueStore.keys;
        var wwAsMappedCharCode = wwAsMappedCharCodeStore;
        word = C.onBeforeWordHyphenation(word, lang);
        if (word === '') {
            hw = '';
        } else if (lo.cache && lo.cache.hasOwnProperty(C.state) && lo.cache[C.state].hasOwnProperty(word)) { //the word is in the cache
            hw = lo.cache[C.state][word];
        } else if (word.indexOf(C.hyphen) !== -1) {
            //word already contains the hyphen -> leave at it is!
            hw = word;
        } else if (lo.exceptions.hasOwnProperty(word)) { //the word is in the exceptions list
            hw = lo.exceptions[word].replace(/-/g, C.hyphen);
        } else if (word.indexOf('-') !== -1) {
            hw = hyphenateCompound(lo, lang, word);
        } else {
            ww = word.toLowerCase();
            if (String.prototype.normalize) {
                ww = ww.normalize("NFC");
            }
            if (lo.hasOwnProperty("charSubstitution")) {
                ww = doCharSubst(lo.charSubstitution, ww);
            }
            if (word.indexOf("'") !== -1) {
                ww = ww.replace(/'/g, "’"); //replace APOSTROPHE with RIGHT SINGLE QUOTATION MARK (since the latter is used in the patterns)
            }
            ww = '_' + ww + '_';
            wwlen = ww.length;
            //prepare wwhp and wwAsMappedCharCode
            while (pstart < wwlen) {
                wwhp[pstart] = 0;
                charCode = ww.charCodeAt(pstart);
                wwAsMappedCharCode[pstart] = charMap.hasOwnProperty(charCode)
                    ? charMap[charCode]
                    : -1;
                pstart += 1;
            }
            //get hyphenation points for all substrings
            pstart = 0;
            while (pstart < wwlen) {
                row = 0;
                plen = pstart;
                while (plen < wwlen) {
                    mappedCharCode = wwAsMappedCharCode[plen];
                    if (mappedCharCode === -1) {
                        break;
                    }
                    link = indexedTrie[row + mappedCharCode * 2];
                    value = indexedTrie[row + mappedCharCode * 2 + 1];
                    if (value > 0) {
                        hpc = 0;
                        hp = valueStore[value + hpc];
                        while (hp !== 255) {
                            if (hp > wwhp[pstart + hpc]) {
                                wwhp[pstart + hpc] = hp;
                            }
                            hpc += 1;
                            hp = valueStore[value + hpc];
                        }
                    }
                    if (link > 0) {
                        row = link;
                    } else {
                        break;
                    }
                    plen += 1;
                }
                pstart += 1;
            }
            //create hyphenated word
            hp = 0;
            while (hp < wordLength) {
                if (hp >= lo.leftmin && hp <= (wordLength - lo.rightmin) && (wwhp[hp + 1] % 2) !== 0) {
                    hw += C.hyphen + word.charAt(hp);
                } else {
                    hw += word.charAt(hp);
                }
                hp += 1;
            }
        }
        hw = C.onAfterWordHyphenation(hw, lang);
        if (!lo.cache.hasOwnProperty(C.state)) {
            lo.cache[C.state] = {};
        }
        lo.cache[C.state][word] = hw;
        return hw;
    }


    /**
     * removes orphans depending on the 'orphanControl'-setting:
     * orphanControl === 1: do nothing
     * orphanControl === 2: prevent last word to be hyphenated
     * orphanControl === 3: prevent one word on a last line (inserts a nobreaking space)
     */
    function controlOrphans(part) {
        var r;
        var h = C.hyphen;
        if (".\\+*?[^]$(){}=!<>|:-".indexOf(C.hyphen) !== -1) {
            h = "\\" + h;
        }
        //strip off blank space at the end (omitted closing tags)
        part = part.replace(/[\s]*$/, '');
        if (C.orphanControl >= 2) {
            //remove hyphen points from last word
            r = part.split(' ');
            r[1] = r[1].replace(new RegExp(h, 'g'), '');
            r = r.join(' ');
        }
        if (C.orphanControl === 3) {
            //replace spaces by non breaking spaces
            r = r.replace(/[\ ]+/g, String.fromCharCode(160));
        }
        return r;
    }

    function hyphenateElement(lang, elo) {
        var el = elo.element;
        var lo = H.languages[lang];
        C.state = elo.class;
        function hyphenate(word) {
            return hyphenateWord(lo, lang, word);
        }
        var i = 0;
        var n = el.childNodes[i];
        while (!!n) {
            if (n.nodeType === 3 //type 3 = #text
                    && (/\S/).test(n.data) //not just white space
                    && n.data.length >= C.minWordLength) { //longer then min
                n.data = n.data.replace(lo.genRegExps[elo.class], hyphenate);
                if (C.orphanControl !== 1) {
                    n.data = n.data.replace(/[\S]+\ [\S]+[\s]*$/, controlOrphans);
                }
            }
            i += 1;
            n = el.childNodes[i];
        }
        elo.hyphenated = true;
        elements.counters[1] += 1;
        if (C.safeCopy && (el.tagName.toLowerCase() !== 'body')) {
            copy.registerOnCopy(el, C.state);
        }
    }

    function hyphenateLangElements(lang, elArr) {
        elArr.forEach(function eachElem(elo) {
            hyphenateElement(lang, elo);
        });
        if (elements.counters[0] === elements.counters[1]) {
            handleEvt(["hyphenationDone"]);
        }
    }

    function convertExceptionsToObject(exc) {
        var words = exc.split(', ');
        var r = {};
        var i = 0;
        var l = words.length;
        var key;
        while (i < l) {
            key = words[i].replace(/-/g, '');
            if (!r.hasOwnProperty(key)) {
                r[key] = words[i];
            }
            i += 1;
        }
        return r;
    }

    function prepareLanguagesObj(lang) {
        var lo = H.languages[lang];
        if (!lo.prepared) {
            lo.cache = {};
            //merge leftmin/rightmin to config
            if (C.leftmin > lo.leftmin) {
                lo.leftmin = C.leftmin;
            }
            if (C.rightmin > lo.rightmin) {
                lo.rightmin = C.rightmin;
            }
            //add exceptions from the pattern file to the local 'exceptions'-obj
            if (lo.hasOwnProperty('exceptions')) {
                H.addExceptions(lang, lo.exceptions);
                delete lo.exceptions;
            }
            //copy global exceptions to the language specific exceptions
            if (exceptions.hasOwnProperty('global')) {
                if (exceptions.hasOwnProperty(lang)) {
                    exceptions[lang] += ', ' + exceptions.global;
                } else {
                    exceptions[lang] = exceptions.global;
                }
            }
            //move exceptions from the the local 'exceptions'-obj to the 'language'-object
            if (exceptions.hasOwnProperty(lang)) {
                lo.exceptions = convertExceptionsToObject(exceptions[lang]);
                delete exceptions[lang];
            } else {
                lo.exceptions = {};
            }
            convertPatternsToArray(lo);
            lo.genRegExps = {};
            C.getClassNames().forEach(function (cn) {
                var wrd;
                C.state = cn;
                if (String.prototype.normalize) {
                    wrd = '[\\w' + lo.specialChars + lo.specialChars.normalize("NFD") + String.fromCharCode(173) + String.fromCharCode(8204) + '-]{' + C.minWordLength + ',}';
                } else {
                    wrd = '[\\w' + lo.specialChars + String.fromCharCode(173) + String.fromCharCode(8204) + '-]{' + C.minWordLength + ',}';
                }
                lo.genRegExps[cn] = new RegExp(wrd, "gi");
            });
            lo.prepared = true;
        }
    }

    function handleEvt(evt) {
        //w.console.log("event: ", evt);
        switch (evt[0]) {
        case "DOMContentLoaded":
            autoSetMainLanguage();
            collectElements();
            w.Hyphenopoly.evt(["ElementsReady"]);
            break;
        case "ElementsReady":
            elements.each(function (lang, values) {
                if (H.languages.hasOwnProperty(lang) && H.languages[lang].converted) {
                    hyphenateLangElements(lang, values);
                }//else wait for "patternReady"-evt
            });
            break;
        case "loaded":
            prepareLanguagesObj(evt[1]);
            w.Hyphenopoly.evt(["patternReady", evt[1]]);
            break;
        case "patternReady":
            if (H.elementsReady) {
                hyphenateLangElements(evt[1], elements.list[evt[1]]);
            } //else wait for "ElementsReady"-evt
            break;
        case "hyphenationDone":
            w.clearTimeout(C.timeOutHandler);
            w.document.documentElement.style.visibility = "visible";
            C.onHyphenationDone();
            break;
        case "timeout":
            w.document.documentElement.style.visibility = "visible";
            C.onTimeOut();
            break;
        }
    }
    //public methods
    H.addExceptions = function (lang, words) {
        if (lang === '') {
            lang = 'global';
        }
        if (exceptions.hasOwnProperty(lang)) {
            exceptions[lang] += ", " + words;
        } else {
            exceptions[lang] = words;
        }
    };

    C.onHyphenopolyStart();
    //clear Loader-timeout
    w.clearTimeout(H.setup.timeOutHandler);
    //renew timeout for the case something fails
    C.timeOutHandler = w.setTimeout(function () {
        handleEvt(["timeout"]);
    }, C.timeout);

    //import and exec triggered events from loader
    w.Hyphenopoly.evt = function (m) {
        handleEvt(m);
    };
    w.Hyphenopoly.evtList.forEach(function evt(m) {
        handleEvt(m);
    });
    delete w.Hyphenopoly.evtList;


}(window));