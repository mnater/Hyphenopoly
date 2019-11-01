/* eslint-disable object-property-newline */
/* eslint-disable no-var */

(function testDriver() {
    "use strict";
    var tests = [
        {"exec": false, "path": "test0.html"},
        {"exec": true, "path": "test1.html"},
        {"exec": true, "path": "test2.html"},
        {"exec": true, "path": "test3.html"},
        {"exec": true, "path": "test4.html"},
        {"exec": true, "path": "test5.html"},
        {"exec": true, "path": "test6.html"},
        {"exec": true, "path": "test7.html"},
        {"exec": true, "path": "test8.html"},
        {"exec": true, "path": "test9.html"},
        {"exec": true, "path": "test10.html"},
        {"exec": true, "path": "test11.html"},
        {"exec": true, "path": "test12.html"},
        {"exec": true, "path": "test13.html"},
        {"exec": true, "path": "test14.html"},
        {"exec": true, "path": "test15.html"},
        {"exec": true, "path": "test16.html"},
        {"exec": true, "path": "test17.html"},
        {"exec": true, "path": "test18.html"},
        {"exec": true, "path": "test19.html"},
        {"exec": true, "path": "test20.html"},
        {"exec": true, "path": "test21.html"},
        {"exec": true, "path": "test22.html"},
        {"exec": true, "path": "test23.html"},
        {"exec": true, "path": "test24.html"},
        {"exec": true, "path": "test25.html"},
        {"exec": true, "path": "test26.html"},
        {"exec": true, "path": "test27.html"},
        {"exec": true, "path": "test28.html"},
        {"exec": true, "path": "test29.html"},
        {"exec": true, "path": "test30.html"},
        {"exec": true, "path": "test31.html"},
        {"exec": true, "path": "test32.html"},
        {"exec": true, "path": "test33.html"},
        {"exec": true, "path": "test34.html"},
        {"exec": true, "path": "test35.html"},
        {"exec": true, "path": "test36.html"},
        {"exec": true, "path": "test37.html"},
        {"exec": true, "path": "test38.html"},
        {"exec": true, "path": "test39.html"},
        {"exec": true, "path": "test40.html"}
    ];
    var testframe = document.getElementById("testframe");
    var currentTest = 1;
    var total = "passed";

    /**
     * Add test result to the DOM
     * @param {string} name – Filename
     * @param {string} desc - Test description
     * @param {string} result - Result (failed or passed)
     */
    function addTestResult(name, desc, result) {
        var dl = document.getElementById("testresults");
        var li = document.createElement("li");
        var linkSpan = document.createElement("span");
        var filelink = document.createElement("a");
        var resultSpan = document.createElement("span");
        var descSpan = document.createElement("span");

        linkSpan.setAttribute("class", "testname");
        filelink.setAttribute("href", name);
        filelink.appendChild(document.createTextNode(name));
        linkSpan.appendChild(filelink);
        li.appendChild(linkSpan);

        resultSpan.setAttribute("class", "result " + result);
        resultSpan.appendChild(document.createTextNode("[" + result + "]"));
        li.appendChild(resultSpan);

        descSpan.setAttribute("class", "desc");
        descSpan.appendChild(document.createTextNode(desc));
        li.appendChild(descSpan);

        dl.appendChild(li);
    }

    /**
     * Runs tests
     * @param {number} index - Index of the test
     */
    function run(index) {
        /* eslint-disable security/detect-object-injection */
        if (tests[index]) {
            currentTest = index;
            if (tests[index].exec) {
                window.setTimeout(function defer() {
                    testframe.src = tests[index].path;
                }, 0);
            } else {
                addTestResult(tests[index].path, "omitted", "omitted");
                run(index + 1);
            }
        } else {
            addTestResult("", navigator.userAgent, total);
        }
        /* eslint-enable security/detect-object-injection */
    }

    window.addEventListener(
        "message",
        function onMessage(e) {
            var msg = JSON.parse(e.data);
            addTestResult(tests[msg.index].path, msg.desc, msg.result);
            if (msg.result === "failed") {
                total = "failed";
            }
            run(msg.index + 1);
        },
        false
    );

    run(currentTest);
}());
