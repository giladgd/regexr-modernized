/*
Adapted from https://github.com/withcatai/node-llama-cpp/blob/master/eslint.config.js

MIT License

Copyright (c) 2023 Gilad S.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import {fileURLToPath} from "node:url";
import importPlugin from "eslint-plugin-import";
import jsdoc from "eslint-plugin-jsdoc";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import {includeIgnoreFile} from "@eslint/compat";
import {defineConfig} from "eslint/config";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default defineConfig(includeIgnoreFile(gitignorePath), {
    ignores: [".husky/_/"]
}, {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    extends: [
        stylistic.configs["recommended"],
        jsdoc.configs["flat/recommended"],
        importPlugin.flatConfigs.recommended
    ],
    languageOptions: {
        globals: {
            Atomics: "readonly",
            SharedArrayBuffer: "readonly"
        },

        ecmaVersion: 2023,
        sourceType: "module"
    },
    settings: {
        "import/resolver": {
            typescript: true,
            node: true
        },
        jsdoc: {
            exemptDestructuredRootsFromChecks: true,

            tagNamePreference: {
                hidden: "hidden",
                experimental: "experimental"
            }
        }
    },
    rules: {
        "@stylistic/indent": ["warn", 4],
        "indent": ["warn", 4, {
            SwitchCase: 1,
            FunctionDeclaration: {
                parameters: "first"
            },
            ignoredNodes: [
                // fix for indent warnings on function object return types when the function has no parameters
                'FunctionExpression[params.length=0][returnType.type="TSTypeAnnotation"]'
            ]
        }],
        "@stylistic/indent-binary-ops": ["off"],
        "@stylistic/eqeqeq": ["off"],
        "@stylistic/no-undef": "off",
        "@stylistic/quotes": ["warn", "double", {avoidEscape: true}],
        "no-unused-vars": ["warn", {
            args: "none",
            ignoreRestSiblings: true,
            varsIgnorePattern: "^set",
            caughtErrors: "none",
            ignoreUsingDeclarations: true
        }],
        "@stylistic/no-prototype-builtins": ["off"],
        "@stylistic/object-curly-spacing": ["warn", "never"],
        "@stylistic/semi": ["warn", "always"],
        "@stylistic/no-undefined": ["off"],
        "@stylistic/array-bracket-newline": ["error", "consistent"],
        "@stylistic/brace-style": ["error", "1tbs", {
            allowSingleLine: false
        }],
        "@stylistic/comma-spacing": ["error", {
            before: false,
            after: true
        }],
        "@stylistic/comma-style": ["error", "last"],
        "@stylistic/comma-dangle": ["warn", "never"],
        "no-var": ["error"],
        "import/order": ["error", {
            groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type", "object", "unknown"],
            warnOnUnassignedImports: true
        }],
        "newline-per-chained-call": ["error", {
            ignoreChainWithDepth: 2
        }],
        "no-confusing-arrow": ["error"],
        "no-const-assign": ["error"],
        "no-duplicate-imports": ["error", {
            includeExports: true
        }],
        camelcase: ["warn", {
            allow: ["\\d+_\\d+"]
        }],
        "@stylistic/jsx-quotes": ["warn"],
        yoda: ["error", "never", {
            exceptRange: true
        }],
        "no-eval": ["error"],
        "array-callback-return": ["error"],
        "no-empty": ["error", {
            allowEmptyCatch: true
        }],
        "@stylistic/keyword-spacing": ["warn"],
        "@stylistic/space-infix-ops": ["warn"],
        "@stylistic/spaced-comment": ["warn", "always", {
            markers: ["/"]
        }],
        "@stylistic/eol-last": ["warn", "always"],
        "@stylistic/max-len": ["warn", {
            code: 140,
            tabWidth: 4,
            ignoreStrings: true
        }],
        "@stylistic/quote-props": ["off"],
        "@stylistic/arrow-parens": ["warn", "always"],
        "@stylistic/no-multiple-empty-lines": ["off"],
        "@stylistic/operator-linebreak": ["off"],
        "@stylistic/block-spacing": ["warn", "never"],
        "@stylistic/no-extra-parens": ["off"],
        "@stylistic/padded-blocks": ["warn"],
        "@stylistic/multiline-ternary": ["off"],
        "@stylistic/lines-between-class-members": ["warn", {
            enforce: [
                {blankLine: "always", prev: "method", next: "*"},
                {blankLine: "always", prev: "*", next: "method"}
            ]
        }],
        "@stylistic/no-trailing-spaces": ["off"],
        "@stylistic/no-multi-spaces": ["warn"],
        "@stylistic/generator-star-spacing": ["off"]
    }
}, {
    files: ["**/*.{ts,mts,cts}"],
    extends: [
        jsdoc.configs["flat/recommended-typescript"],
        ...tseslint.configs.recommended
    ],
    rules: {
        "no-constant-condition": ["warn"],
        "import/named": ["off"],
        "@typescript-eslint/explicit-module-boundary-types": ["off"],
        "@typescript-eslint/ban-ts-comment": ["off"],
        "@typescript-eslint/no-explicit-any": ["warn"],
        "@typescript-eslint/no-inferrable-types": ["off"],
        "@typescript-eslint/no-unused-vars": ["warn", {
            args: "none",
            ignoreRestSiblings: true,
            varsIgnorePattern: "^set",
            caughtErrors: "none",
            ignoreUsingDeclarations: true
        }],
        "@typescript-eslint/no-empty-object-type": ["off"],
        "@typescript-eslint/member-ordering": ["warn", {
            default: [["instance-field", "abstract-field"], "constructor", ["instance-method", "abstract-method"], "signature"],
            interfaces: ["field", "constructor", "method", "signature"],
            typeLiterals: []
        }],
        "@typescript-eslint/parameter-properties": ["warn", {
            allow: []
        }],
        "@typescript-eslint/explicit-member-accessibility": ["warn"],
        "@typescript-eslint/consistent-type-definitions": ["warn", "type"],
        "@stylistic/member-delimiter-style": ["warn", {
            multiline: {
                delimiter: "comma",
                requireLast: false
            },
            singleline: {
                delimiter: "comma",
                requireLast: false
            },
            multilineDetection: "brackets"
        }],

        "jsdoc/require-param": ["off"],
        "jsdoc/check-param-names": ["warn", {
            checkDestructured: false
        }],
        "jsdoc/require-returns": ["off"],
        "jsdoc/require-jsdoc": ["off"],
        "jsdoc/require-yields": ["off"],
        "jsdoc/require-param-description": ["off"]
    }
}, {
    files: ["tests/**/*.ts"],
    rules: {
        "@stylistic/max-len": ["off"]
    }
});
