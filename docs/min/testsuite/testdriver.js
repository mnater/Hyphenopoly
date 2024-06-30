(function testDriver() {
    "use strict";
    const tests = [
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
        {"exec": true, "path": "test40.html"},
        {"exec": true, "path": "test41.html"},
        {"exec": true, "path": "test42.html"},
        {"exec": true, "path": "test43.html"},
        {"exec": true, "path": "test44.html"},
        {"exec": true, "path": "test45.html"},
        {"exec": true, "path": "test46.html"},
        {"exec": true, "path": "test47.html"},
        {"exec": true, "path": "test48.html"},
        {"exec": true, "path": "test49.html"},
        {"exec": true, "path": "test50.html"},
        {"exec": true, "path": "test51.html"},
        {"exec": true, "path": "test52.html"},
        {"exec": true, "path": "test53.html"},
        {"exec": true, "path": "test54.html"},
        {"exec": true, "path": "test55.html"},
        {"exec": true, "path": "test56.html"},
        {"exec": true, "path": "test57.html"}
    ];
    const testframe = document.getElementById("testframe");
    let total = "passed";

    /**
     * Add test result to the DOM
     * @param {string} name - Filename
     * @param {string} desc - Test description
     * @param {string} result - Result (failed or passed)
     */
    function addTestResult(name, desc, result) {
        const dl = document.getElementById("testresults");
        const li = document.createElement("li");
        const linkSpan = document.createElement("span");
        const filelink = document.createElement("a");
        const resultSpan = document.createElement("span");
        const descSpan = document.createElement("span");

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
    function run(testidx) {
        const test = tests.at(testidx);
        if (test) {
            if (test.exec) {
                window.setTimeout(() => {
                    testframe.src = test.path;
                }, 0);
            } else {
                addTestResult(test.path, "omitted", "omitted");
                run(testidx + 1);
            }
        } else {
            addTestResult("", navigator.userAgent, total);
            document.getElementById("testframe").style.visibility = "hidden";
        }
    }

    window.addEventListener(
        "message",
        (e) => {
            const msg = JSON.parse(e.data);
            addTestResult(tests[msg.index].path, msg.desc, msg.result);
            if (msg.result === "failed") {
                total = "failed";
            }
            run(msg.index + 1);
        },
        false
    );

    run(1);
}());
