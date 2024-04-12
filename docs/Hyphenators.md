# Hyphenators
While the main functionality of Hyphenopoly is to just hyphenate your HTML with no further ado, it is sometimes useful to have a function at hand that hyphenates text.

Possible use cases are:
* dynamically loaded text
* hyphenating text provided by the user (e.g. in a preview window of a blogging software)
* …

For these use cases Hyphenopoly.js exposes `hyphenators` – functions that hyphenate strings or DOM-Objects.

There are two types of `hyphenators`:
* language-specific `hyphenators` that can only hyphenate `strings`
* a polyglot `HTML`-hyphenator that can hyphenate DOM-objects of type `HTMLElement`

## Create and access `Hyphenopoly.hyphenators`

Hyphenopoly_Loader.js creates a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) for a `hyphenator` for each language it loads (i.e. languages the UA doesn't support or languages you "FORCEHYPHENOPOLY"-ied).
It also creates a promise for an `HTML`-hyphenator that can hyphenate HTMLEntities from all loaded languages.

````html
<script src="./Hyphenopoly_Loader.js"></script>
<script>
    Hyphenopoly.config({
        require: {
            "en-us": "FORCEHYPHENOPOLY",
            "de": "Silbentrennungsalgorithmus"
        }
    });

    console.log(Hyphenopoly.hyphenators); //{en-us: Promise, HTML: Promise}
</script>
````

In the example above, we enforced Hyphenopoly_Loader.js to use Hyphenopoly.js for `en-us`. Since the UA seems to support CSS3-hyphens for German, `Hyphenopoly.hyphenators` only contain a Promise for a `en-us`-hyphenator and a Promise for the `HTML`-hyphenator.

## Use `Hyphenopoly.hyphenators[<lang>]` for Strings
`hyphenators` are Promises. They are resolved as soon as everything necessary is loaded and ready (or rejected when something goes wrong). `hyphenators` resolve to a language-specific function (a `hyphenator`) that hyphenates its input according to the settings for selectors (default: `.hyphenate`):

`function hyphenator({string}, [Optional: selector=".hyphenate"]) => {string|undefined}`

````html
<script src="./Hyphenopoly_Loader.js"></script>
<script>
    Hyphenopoly.config({
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
    });

    Hyphenopoly.hyphenators["en-us"].then((hyphenator_en) => {
        console.log(hyphenator_en("Hyphenation")); //Hy•phen•ation
        console.log(hyphenator_en("Hyphenation", ".hyphenatePipe")); //Hy|phen|ation
    })
</script>
````

In the example, a `string` is handed over to the `hyphenator` which returns a hyphenated string according to the settings for the `selector`. If no `selector` is defined, it defaults to `".hyphenate"`.

## Use `Hyphenopoly.hyphenators.HTML` for DOM-Elements
Objects of type `HTMLElement` can be hyphenated with the `HTML`-hyphenator (`Hyphenopoly.hyphenators.HTML`). The `HTML`-hyphenator hyphenates the handed over `HTMLElement` and all its `childElements` if their language is one of the loaded languages directly and returns `null`.

Like string-hyphenators, HTML-hyphenators take a selector as an optional second argument.

`function hyphenator({HTMLElement}, [Optional: selector=".hyphenate"]) => null`

````html
<html>
<head>
<script src="./Hyphenopoly_Loader.js"></script>
<script>
    Hyphenopoly.config({
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
    });

    Hyphenopoly.hyphenators.HTML.then((hyn) => {
        hyn(document.getElementById("hyphenateme"));
    });
</script>
</head>
<body>
    <div id="hyphenateme">
      <span lang="en-us">hyphenation</span>
      <span lang="de">Silbentrennung</span>
    </div>
<!--becomes -->
<!--
    <div id="hyphenateme">
      <span lang="en-us">hy•phen•ation</span>
      <span lang="de">Silbentrennung</span>
    </div>
-->
</body>
</html>
````

In the example above, we assume that the browser supports hyphenation for German. So the `HTML`-hyphenator only hyphenates Englisch elements.

## Further notes and compatibility
Instead of using `.then` on the Promises we could also use `async/await`:

````javascript
async function runHyphenator(id) {
    (await Hyphenopoly.hyphenatorsHTML)(document.getElementById(id));
}
runHyphenator("hyphenateme");
````

# Use case: Hyphenopoly in react
`hyphenators` are very important in dynamically generated web-content (web-apps). The following describes some first steps in how to use Hyphenopoly in react-apps. Please note that I'm not an expert in react.js If you find a better way, I'd highly appreciate your ideas.

1. [download](https://github.com/mnater/Hyphenopoly/releases/latest) and copy the latest version of Hyphenopoly to your react's `public` folder.

2. Configure `window.Hyphenopoly` and load `Hyphenopoly_Loader.js` in your react's index.html:

````html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Use Hyphenopoly in React</title>
    <script src="./hyphenopoly/min/Hyphenopoly_Loader.js"></script>
    <script>
    //attach the global 'Hyphenopoly' object to window
        Hyphenopoly.config({
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
        });
    </script>
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
      window.Hyphenopoly.hyphenators["HTML"].then(
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
