# Usage of devDependencies
Hyphenopoly has no dependencies for deployment but relies on other packages for development (devDependencies).

## Clone and install devDependencies

You need [git](https://git-scm.com/downloads) and [node.js with npm.js](https://nodejs.org/) installed on your system.

### Clone repository from GitHub
Use

`git clone https://github.com/mnater/Hyphenopoly.git`

to [clone](https://git-scm.com/docs/git-clone) the current development status (HEAD) of Hyphenopoly.js (this has the newest features, but is not fully tested).

This will create a directory called `Hyphenopoly` in your current working directory containing all the files on the Hyphenopoly-GitHub-Repository. Those files are 'connected' to the repository: `git pull` will `fetch` and `merge` changes from the repository to the files in your directory.

Use this to create pull-requests or to fork the repository.

### Download tagged release

While cloning gives you the most recent status, downloading a tagged release gives you a more thoughtfully tested (but never error-free) version of Hyphenopoly.

1. Go to [https://github.com/mnater/Hyphenopoly/releases/latest](https://github.com/mnater/Hyphenopoly/releases/latest) and download the package.
2. Unpack the package.

This will create a directory called `Hyphenopoly` in your current working directory containing all the files on the Hyphenopoly-GitHub-Repository. Those files are __NOT__ 'connected' to the repository (you can't do `git pull` and a like).

Use this if you don't plan to make changes to Hyphenopoly that need to go upstream.

### Install devDependencies
In your `Hyphenopoly`-directory run `npm install`. This will install the devDependencies listed in the `package.json`-file to a directory called `node_modules`.

This will install:
* [assemblyscript](https://github.com/AssemblyScript)
* [eslint](https://eslint.org)
* [eslint-plugin-security](https://github.com/nodesecurity/eslint-plugin-security)
* [remark-cli](https://www.npmjs.com/package/remark-cli)
* [remark-preset-lint-recommended](https://github.com/remarkjs/remark-lint/tree/master/packages/remark-preset-lint-recommended)
* [tap](https://www.npmjs.com/package/tap)
* [terser](https://github.com/fabiosantoscode/terser)

and their dependencies.

### Install 3rd-party software
Some dependencies are not available on npm. Run `npm run-script install3rdparty`. This will install more tools in a directory called `third-party`.

This will install and compile [binaryen](https://github.com/WebAssembly/binaryen).

## Use the tools
With the tools mentioned above installed, you can run the following scripts:

* `npm prepare` - recreates a minified subset of the files in the `min`-directory.
* `npm test` - runs the tap tests for Hyphenopoly.module.js
* `npm run testsuite` - opens a browser and runs the test suite
* `npm run lint` - runs the linter on all .js and .md files
* `npm run createAllWasm` - compiles language-specific hyphenEngines from AssemblyScript and textPatterns (not included) to './lang/' and copies the '.wasm'-files to './patterns/'
* `npm run doc` - build and open documentation page locally
