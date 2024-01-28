import asparser from "@typescript-eslint/parser";
import globals from "globals";
import js from "@eslint/js";
import security from "eslint-plugin-security";

// Convert to flat config style, may be removed if the plugin gets updated
security.configs.recommended.plugins = {security};

export default [
    js.configs.all,
    security.configs.recommended,
    {
        "ignores": [
            "min/*.js",
            "examples/deno_example.js",
            "examples/webpack/src/*.js"
        ]
    },
    {
        "files": [
            "Hyphenopoly_Loader.js",
            "Hyphenopoly.js",
            "testsuite/testdriver.js"
        ],
        "languageOptions": {
            "ecmaVersion": "latest",
            "globals": {
                ...globals.browser
            },
            "sourceType": "script"
        }
    },
    {
        "files": [
            "hyphenopoly.module.js",
            "test/*.js"
        ],
        "languageOptions": {
            "ecmaVersion": "latest",
            "globals": {
                ...globals.node
            },
            "sourceType": "module"
        }
    },
    {
        "rules": {
            "array-element-newline": [1, "consistent"],
            "arrow-body-style": [1, "always"],
            "complexity": [1, 6],
            "func-names": [1, "as-needed"],
            "func-style": [1, "declaration", {"allowArrowFunctions": true}],
            "function-call-argument-newline": [1, "consistent"],
            "function-paren-newline": [1, "consistent"],
            "id-length": 0,
            "lines-around-comment": [1, {"allowBlockStart": true}],
            "logical-assignment-operators": [1, "always", {"enforceForIfStatements": true}],
            "max-len": [
                1,
                {
                    "ignoreStrings": true,
                    "ignoreTemplateLiterals": true
                }
            ],
            "max-lines": 0,
            "max-lines-per-function": 0,
            "max-params": [1, 5],
            "max-statements": 0,
            "no-extra-parens": 0,
            "no-magic-numbers": 0,
            "no-nested-ternary": 0,
            "no-param-reassign": 0,
            "no-restricted-properties": [
                "error",
                {
                    "message": "Use .slice instead of .substr.",
                    "property": "substr"
                }
            ],
            "no-template-curly-in-string": 2,
            "no-ternary": 0,
            "no-undef": 2,
            "object-shorthand": 1,
            "one-var": 0,
            "padded-blocks": [1, "never"],
            "prefer-arrow-callback": 1,
            "prefer-destructuring": 0,
            "prefer-named-capture-group": 0,
            "prefer-template": 0,
            "require-jsdoc": [
                1,
                {
                    "require": {
                        "ArrowFunctionExpression": true,
                        "ClassDeclaration": true,
                        "FunctionDeclaration": true,
                        "FunctionExpression": true,
                        "MethodDefinition": true
                    }
                }
            ],
            "require-unicode-regexp": 0,
            "sort-keys": [1, "asc", {"caseSensitive": false}],
            "space-before-function-paren": [
                1,
                {
                    "anonymous": "always",
                    "asyncArrow": "always",
                    "named": "never"
                }
            ],
            "wrap-iife": 1
        }
    },
    {
        "files": ["**/*.ts"],
        "languageOptions": {
            "globals": {
                "ctz": "readonly",
                "i32": "readonly",
                "i64": "readonly",
                "load": "readonly",
                "memory": "readonly",
                "popcnt": "readonly",
                "store": "readonly",
                "u16": "readonly",
                "u32": "readonly",
                "u8": "readonly",
                "unreachable": "readonly"
            },
            "parser": asparser
        },
        "rules": {
            "complexity": 0,
            "no-bitwise": 0,
            "require-jsdoc": 0
        }
    }
];
