/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable security/detect-object-injection */
/* eslint-env node */

export default function trie() {
    function createTrieNode(childCount, level, value) {
        return {
            childCount,
            level,
            value
        };
    }
    const data = createTrieNode(1, "superroot", null);
    data.root = createTrieNode(0, 0, null);

    function addNode(atLevel, char, value) {
        if (atLevel === null) {
            atLevel = data.root;
        }
        if (Object.hasOwn(atLevel, char)) {
            atLevel[char].value = value || atLevel[char].value;
        } else {
            atLevel.childCount += 1;
            atLevel[char] = createTrieNode(0, atLevel.level + 1, value);
        }
        return atLevel[char];
    }

    function breadthFirstIteration(cb) {
        const reservedKeys = ["childCount", "level", "value"];
        const queue = [];
        queue.push(data);
        let keyCount = 0;
        function handleKey(currentNode, key) {
            if (reservedKeys.indexOf(key) === -1) {
                cb(
                    key,
                    currentNode[key].childCount,
                    keyCount,
                    currentNode[key].value
                );
                queue.push(currentNode[key]);
                keyCount += 1;
            }
        }

        while (queue.length !== 0) {
            const currentNode = queue.shift();
            Object.keys(currentNode).forEach((key) => {
                handleKey(currentNode, key);
            });
        }
    }

    return {
        addNode,
        breadthFirstIteration
    };
}
