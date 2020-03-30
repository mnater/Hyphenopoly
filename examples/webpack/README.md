# Hyphenopoly implementation with Webpack 4
Alternative way to load [Hyphenopoly](https://github.com/mnater/Hyphenopoly) for browsers into Webpack. It uses [CopyWebpackPlugin](https://webpack.js.org/plugins/copy-webpack-plugin/) and [HtmlWebpackPlugin](https://webpack.js.org/plugins/html-webpack-plugin/).

### Build the website
```bash
$ npm install       
$ npm run build             # Build files into dist folder
$ npm run dev               # Opens a Webpack Dev server, avoids CORS errors running locally
```


### Vendor Javascript
```js
function loadHyphenopoly() {
    var Hyphenopoly = {
        require: {
            es: 'Esta librería es realmente estupenda',
            it: 'Questa libreria è davvero fantastica',
            de: 'Deutschland ist ein Bundesstaat in Mitteleuropa',
            'en-us': 'FORCEHYPHENOPOLY',
        },
        paths: {
            patterndir: './js/hyphenopoly/patterns/',
            maindir: './js/hyphenopoly/',       
        },
    };
    window.Hyphenopoly = Hyphenopoly;
    const hyphenopoly_loader = require('hyphenopoly/Hyphenopoly_Loader');
}
```

### Webpack configuration
```js
plugins: [
    new CopyPlugin([
        {
            context: './',
            from: 'node_modules/hyphenopoly/Hyphenopoly.js',
            to: './js/hyphenopoly/',
            force: true,
            flatten: true,
        },
        {
            context: './',
            from: 'node_modules/hyphenopoly/patterns/{es,it,de,en-us}.wasm',
            to: './js/hyphenopoly/patterns/',
            globOptions:{
                extglob: true
            },
            force: true,
            flatten: true,
        },
    ]),
    new HtmlWebpackPlugin({
        template: './src/index.html'
    })
]
module: {
    rules: [
        {
            test: /\.html$/i,
            loader: 'html-loader',
        },
    ],
}
```
