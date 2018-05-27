/* eslint-env node, mocha */
/* eslint global-require: 0, func-names: 0, newline-per-chained-call: 0 */
"use strict";
const assert = require("assert").strict;

describe("hyphenopoly.module", function () {
    describe("config()", function () {
        let H9Y = null;
        const H9YKey = require.resolve("../hyphenopoly.module");

        beforeEach(function setup(done) {
            H9Y = require("../hyphenopoly.module");
            done();
        });

        afterEach("clear", function tearDown(done) {
            H9Y = null;
            delete require.cache[H9YKey];
            done();
        });

        it("returns an empty Map (if nothing is required)", function () {
            assert.equal(H9Y.config({}).toString(), (new Map()).toString());
        });

        it("returns a single Promise (if only one language is required)", function () {
            assert.equal(H9Y.config({"require": ["de"]}).toString(), "[object Promise]");
        });

        it("returns a map of Promises (if more than one language is required)", function () {
            const hyphenopoly = H9Y.config({"require": ["de", "en-us"]});
            assert.equal(hyphenopoly.get("de").toString(), "[object Promise]");
            assert.equal(hyphenopoly.get("en-us").toString(), "[object Promise]");
        });

        it("throws when hyphenEngine.wasm can't be found.", function (done) {
            H9Y.config({
                "require": ["en-us"],
                "paths": {
                    "maindir": "fail/",
                    "patterndir": `./patterns/`
                }
            }).catch(
                function (e) {
                    assert.equal(e.slice(-28), "hyphenEngine.wasm not found.");
                    done();
                }
            );
        });

        it("throws when a language is not known", function (done) {
            H9Y.config({"require": ["en"]}).catch(
                function (e) {
                    assert.equal(e.slice(-27), "/patterns/en.hpb not found.");
                    done();
                }
            );
        });

        it("returns hyphenateText function for a specified language", function (done) {
            H9Y.config({"require": ["de"]}).then(
                function (hyphenateText) {
                    if (hyphenateText("Silbentrennung") === "Sil\u00ADben\u00ADtren\u00ADnung") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Silbentrennung")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("uses hyphen-character", function (done) {
            H9Y.config({
                "hyphen": "•",
                "require": ["de"]
            }).then(
                function (hyphenateText) {
                    if (hyphenateText("Silbentrennung") === "Sil•ben•tren•nung") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Silbentrennung")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("uses language specific exceptions", function (done) {
            H9Y.config({
                "exceptions": {"de": "Silben-trennung, Sil-ben-trennung"},
                "hyphen": "•",
                "require": ["de"]
            }).then(
                function (hyphenateText) {
                    if (hyphenateText("Silbentrennung") === "Silben•trennung") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Silbentrennung")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("uses language agnostic (global) exceptions", function (done) {
            H9Y.config({
                "exceptions": {
                    "global": "Silben-trennung"
                },
                "hyphen": "•",
                "require": ["de"]
            }).then(
                function (hyphenateText) {
                    if (hyphenateText("Silbentrennung") === "Silben•trennung") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Silbentrennung")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("uses language both kind of exceptions", function (done) {
            H9Y.config({
                "exceptions": {
                    "global": "Silben-trennung",
                    "de": "Algo-rithmus"
                },
                "hyphen": "•",
                "require": ["de"]
            }).then(
                function (hyphenateText) {
                    if (hyphenateText("Silbentrennung Algorithmus") === "Silben•trennung Algo•rithmus") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Silbentrennung")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("handles left-/rightmin", function (done) {
            H9Y.config({
                "hyphen": "•",
                "leftmin": 4,
                "rightmin": 5,
                "require": ["de"]
            }).then(
                function (hyphenateText) {
                    if (hyphenateText("Silbentrennung") === "Silben•trennung") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Silbentrennung")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("handles minWordLength", function (done) {
            H9Y.config({
                "hyphen": "•",
                "minWordLength": 7,
                "require": ["de"]
            }).then(
                function (hyphenateText) {
                    if (hyphenateText("Die Asse essen lieber gesunde Esswaren") === "Die Asse essen lieber ge•sun•de Ess•wa•ren") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Die Asse essen lieber gesunde Esswaren")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("uses `compound: hyphen` (default) correctly", function (done) {
            H9Y.config({
                "hyphen": "•",
                "require": ["de"]
            }).then(
                function (hyphenateText) {
                    if (hyphenateText("Silbentrennungs-Algorithmus Alpha-Version") === "Silbentrennungs-" + String.fromCharCode(8203) +"Algorithmus Alpha-" + String.fromCharCode(8203) + "Version") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Silbentrennungs-Algorithmus Alpha-Version")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("uses `compound: auto` correctly", function (done) {
            H9Y.config({
                "compound": "auto",
                "hyphen": "•",
                "require": ["de"]
            }).then(
                function (hyphenateText) {
                    if (hyphenateText("Silbentrennungs-Algorithmus Alpha-Version") === "Sil•ben•tren•nungs-Al•go•rith•mus Alpha-Ver•si•on") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Silbentrennungs-Algorithmus Alpha-Version")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("uses `compound: all` correctly", function (done) {
            H9Y.config({
                "compound": "all",
                "hyphen": "•",
                "require": ["de"]
            }).then(
                function (hyphenateText) {
                    if (hyphenateText("Silbentrennungs-Algorithmus") === "Sil•ben•tren•nungs-" + String.fromCharCode(8203) +"Al•go•rith•mus") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Silbentrennungs-Algorithmus")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("normalizes characters", function (done) {
            H9Y.config({
                "normalize": true,
                "hyphen": "•",
                "require": ["de"]
            }).then(
                function (hyphenateText) {
                    if (hyphenateText("Ba\u0308rento\u0308ter") === "Bä•ren•tö•ter") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Ba\u0308rento\u0308ter")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("handles orphanControl: 1 (default)", function (done) {
            H9Y.config({
                "hyphen": "•",
                "require": ["de"]
            }).then(
                function (hyphenateText) {
                    if (hyphenateText("Die Asse essen lieber gesunde Esswaren") === "Die Asse essen lie•ber ge•sun•de Ess•wa•ren") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Die Asse essen lieber gesunde Esswaren")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("handles orphanControl: 2", function (done) {
            H9Y.config({
                "hyphen": "•",
                "orphanControl": 2,
                "require": ["de"]
            }).then(
                function (hyphenateText) {
                    if (hyphenateText("Die Asse essen lieber gesunde Esswaren") === "Die Asse essen lie•ber ge•sun•de Esswaren") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Die Asse essen lieber gesunde Esswaren")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("handles orphanControl: 3", function (done) {
            H9Y.config({
                "hyphen": "•",
                "orphanControl": 3,
                "require": ["de"]
            }).then(
                function (hyphenateText) {
                    if (hyphenateText("Die Asse essen lieber gesunde Esswaren") === "Die Asse essen lie•ber ge•sun•de" + String.fromCharCode(160) + "Esswaren") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Die Asse essen lieber gesunde Esswaren")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("handles orphanControl: 3 with hyphen set to *", function (done) {
            H9Y.config({
                "hyphen": "*",
                "orphanControl": 3,
                "require": ["de"]
            }).then(
                function (hyphenateText) {
                    if (hyphenateText("Die Asse essen lieber gesunde Esswaren") === "Die Asse essen lie*ber ge*sun*de" + String.fromCharCode(160) + "Esswaren") {
                        done();
                    } else {
                        done(new Error(hyphenateText("Die Asse essen lieber gesunde Esswaren")));
                    }
                }
            ).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("sets custom listener", function (done) {
            H9Y.config({
                "require": ["de"],
                "handleEvent": {
                    "engineReady": function (e) {
                        done();
                    }
                }
            }).catch(
                function (e) {
                    done(new Error(e));
                }
            );
        });

        it("throws for unknown event", function (done) {
            H9Y.config({
                "require": ["de"],
                "handleEvent": {
                    "error": function (e) {
                        if (e.msg === "unknown Event \"fantasyEvent\" discarded") {
                            done();
                        }
                    },
                    "fantasyEvent": function (e) {
                        console.log(42);
                    }
                }
            });
        });
    });
});
