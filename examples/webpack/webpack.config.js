/* eslint-env node */

"use strict";
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const HtmlWebpackInjector = require("html-webpack-injector");

module.exports = {
    "entry": {
        "main": "./src/index.js",
        "vendor_head": "./src/vendor_head.js"
    },
    "mode": "production",
    "module": {
        "rules": [
            {
                "loader": "html-loader",
                "test": /\.html$/i
            }
        ]
    },
    "optimization": {
        "minimizer": [new TerserPlugin()],
        "runtimeChunk": "single"
    },
    "output": {
        "filename": "js/[name].[contenthash].bundle.js",
        "path": path.resolve(__dirname, "dist")
    },
    "performance": {
        "hints": false
    },
    "plugins": [
        new CleanWebpackPlugin(), new CopyPlugin({
            "patterns": [
                {
                    "context": "./",
                    "from": "node_modules/hyphenopoly/min/Hyphenopoly.js",
                    "to": "./js/hyphenopoly/"
                }, {
                    "context": "./",
                    "from": "node_modules/hyphenopoly/min/patterns/{es,it,de,en-us}.wasm",
                    "to": "./js/hyphenopoly/patterns/[name][ext]"
                }
            ]
        }), new HtmlWebpackPlugin({
            "template": "./src/index.html"
        }), new HtmlWebpackInjector()
    ]
};
