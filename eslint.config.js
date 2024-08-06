import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import security from "eslint-plugin-security";
import jsdoc from 'eslint-plugin-jsdoc';

const jsConfigs = [
    eslint.configs.recommended,
    security.configs.recommended,
    jsdoc.configs['flat/recommended'],
    {
        "ignores": [
            "min/*.js",
            "examples/**/*.js",
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
            "sourceType": "script",
        },
        "name": "browser"
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
        },
        "name": "modules"
    },
    {
        "name": "shared rules",
        "rules": {
            "array-element-newline": [1, "consistent"],
            "arrow-body-style": [1, "always"],
            "complexity": [1, 6],
            "func-names": [1, "as-needed"],
            "func-style": [1, "declaration", {"allowArrowFunctions": true}],
            "function-call-argument-newline": [1, "consistent"],
            "function-paren-newline": [1, "consistent"],
            "id-length": 0,
            "jsdoc/require-jsdoc": [
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
            "no-bitwise": 2,
            "no-console": 2,
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
    }
];

const asConfigs = tseslint.config({
    "extends": [
        eslint.configs.recommended,
        ...tseslint.configs.strictTypeChecked,
        ...tseslint.configs.stylisticTypeChecked,
    ],
    "files": ["**/*.ts"],
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          project: true,
        },
      },
    "rules": {
        "@typescript-eslint/no-unnecessary-type-assertion": 0,
        "complexity": 0,
        "jsdoc/no-undefined-types": [
            1,
            {"definedTypes": ["i64", "i32"]}
        ],
        "jsdoc/require-jsdoc": 0,
        "no-bitwise": 0,
    },
});

export default jsConfigs.concat(asConfigs);