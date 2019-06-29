# Hyphenators
While the main functionality of Hyphenopoly is to just hyphenate your HTML with no further ado, it is sometimes usefull to have a function at hand that hyphenates text.

Possible usecases are:
* dynamically loaded text
* hyphenating text provided by the user (e.g. in a preview window of a blogging software)
* …

Up to version 2.4.0 the only way to hyphenate text after the page has loaded was to [dispatch a `contentLoaded`-Event](./Events.md#contentloaded-event) in order to restart the hyphenation process. This works but is a bit like using a sledgehammer to crack a nut, since the whole page is reprocessed.

_Since Version 2.5.0 Hyphenopoly.js exposes `hyphenators` – language specific functions that hyphenates a string or a DOM-Object._

## Create and access `Hyphenopoly.hyphenators`
`hyphenators` are language specific functions that hyphenate their input.

Hyphenopoly_Loader.js creates a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) for a `hyphenator` for each language it loads (i.e. languages the UA doesn't support or languages you "FORCEHYPHENOPOLY"-ied).

````html
<script>
    var Hyphenopoly = {
        require: {
            "en-us": "FORCEHYPHENOPOLY",
            "de": "Silbentrennungsalgorithmus"
        }
    };
</script>
<script src="./Hyphenopoly_Loader.js"></script>
<script>
    console.log(Hyphenopoly.hyphenators); //{en-us: Promise}
</script>
````

In the example above we enforced Hyphenopoly_Loader.js to use Hyphenopoly.js for `en-us`. Since the UA seems to support CSS3-hyphens for German, `Hyphenopoly.hyphenators` only contain a Promise for a `en-us`-hyphenator.

## Use `Hyphenopoly.hyphenators` for Strings
`hyphenators` are Promises. They are resolved as soon as everything necessary is loaded and ready (or rejected when something goes wrong). `hyphenators` resolve to a language specific function (a `hyphenator`) that hyphenates its input according to the settings for selectors (default: `.hyphenate`):

`function hyphenator({string|DOM-Element}, [Optional: selector=".hyphenate"]) => {string|undefined}`

````html
<script>
    var Hyphenopoly = {
        require: {
            "en-us": "FORCEHYPHENOPOLY",
            "de": "Silbentrennungsalgorithmus"
        },
        paths: {
            maindir: "../",
            patterndir: "../patterns/"
        },
        setup: {
            selectors: {
                ".hyphenate": {
                    hyphen: "•"
                },
                ".hyphenatePipe": {
                    hyphen: "|"
                }
            }
        }
    };
</script>
<script src="./Hyphenopoly_Loader.js"></script>
<script>
    Hyphenopoly.hyphenators["en-us"].then((hyphenator_en) => {
        console.log(hyphenator_en("Hyphenation")); //Hy•phen•ation
        console.log(hyphenator_en("Hyphenation", ".hyphenatePipe")); //Hy|phen|ation
    })
</script>
````

In the example a `string` is handed over to the `hyphenator` which returns a hyphenated string according to the settings for the `selector`. If no `selector` is defined it defaults to `".hyphenate"`.

## Use `Hyphenopoly.hyphenators` for DOM-Elements
When handing over a HTMLELEMENT instead of a string `hyphenators` directly hyphenate the contents of a HTMLElement and return nothing (`undefined`).

````html
<html>
<head>
<script>
    var Hyphenopoly = {
        require: {
            "en-us": "FORCEHYPHENOPOLY",
            "de": "Silbentrennungsalgorithmus"
        },
        setup: {
            selectors: {
                ".hyphenate": {
                    hyphen: "•"
                }
            }
        }
    };
</script>
<script src="./Hyphenopoly_Loader.js"></script>
<script>
    Hyphenopoly.hyphenators["en-us"].then((hyphenator_en) => {
        hyphenator_en(document.getElementById("hyphenateme"));
    });
</script>
</head>
<body>
    <div id="hyphenateme">Supercalifragilisticexpialidocious</div>
<!--becomes -->
<!--<div id="hyphenateme">Su•per•cal•ifrag•ilis•tic•ex•pi•ali•do•cious</div>-->
</body>
</html>
````

## Further notes and compatibility
Instead of using `.then` on the Promises we could also use `async/await`:

````javascript
async function runHyphenator(id) {
    (await Hyphenopoly.hyphenators["en-us"])(document.getElementById(id));
}
runHyphenator("hyphenateme");
````

If Promises are not supported by the browser an error is dispatched.

All modern Browsers [support Promises](https://caniuse.com/#feat=promises) and the [`async/await`-syntax](https://caniuse.com/#feat=async-functions). If you need to support IE11 use a polyfill for promises (e.g. [taylorhakes/promise-polyfill](https://github.com/taylorhakes/promise-polyfill)) and stick to the `.then`-syntax.

# Use case: Hyphenopoly in react
`hyphenators` are very important in dynamically generated web-content (web-apps). The following describes some first steps in how to use Hyphenopoly in react-apps. Please note that I'm not an expert in react.js If you find a better way I'd highly appreciate your ideas.

1. [download](https://github.com/mnater/Hyphenopoly/releases/latest) and copy the latest version of Hyphenopoly to your react's `public` folder.

2. Configure `window.Hyphenopoly` and load `Hyphenopoly_Loader.js` in your react's index.html:

````html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <script>
    //attach the global 'Hyphenopoly' object to window
        window.Hyphenopoly = {
            require: {
                "en-us": "FORCEHYPHENOPOLY"
            },
            paths: {
                maindir: "./hyphenopoly/",
                patterndir: "./hyphenopoly/patterns/"
            },
            setup: {
              selectors: {
                ".hyphenate": {
                  hyphen: "•"
                }
              }
            },
        }
    </script>
    <script src="./hyphenopoly/min/Hyphenopoly_Loader.js"></script>
    <title>Use Hyphenopoly in React</title>
  </head>
  <body>
    <!-- We will put our React component inside this div. -->
    <div id="container"></div>

    <!-- Load React. -->
    <!-- Note: when deploying, replace "development.js" with "production.min.js". -->
    <script src="https://unpkg.com/react@16/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js" crossorigin></script>

    <!-- Load our React component. -->
    <script src="hyphenateText.js"></script>

  </body>
</html>
````


3. Define a `React.Component` that triggers Hyphenopoly (if necessary) on `componentDidUpdate`.

`hyphenateText.js`:
````javascript
'use strict';

const e = React.createElement;


class Toggle extends React.Component {
  constructor(props) {
    super(props);
    this.state = {isToggleOn: true};

    // This binding is necessary to make `this` work in the callback
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState(prevState => ({
      isToggleOn: !prevState.isToggleOn
    }));
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const el = this.el;
    //if hyphenation is handled by CSS, Hyphenopoly is undefined
    if (window.Hyphenopoly) {
      window.Hyphenopoly.hyphenators["en-us"].then(
        function (enHyphenator) {
          enHyphenator(el);
        }
      );
    }
  }

  render() {
    return e(
      "p",
      {
        class: "hyphenate",
        onClick: () => this.handleClick(),
        ref: el => this.el = el
      },
      this.state.isToggleOn ? "hyphenation" : "algorithm"
    );
  }
}

const domContainer = document.querySelector('#container');
ReactDOM.render(e(Toggle), domContainer);
````

