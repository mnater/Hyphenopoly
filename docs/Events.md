# Events
Hyphenopoly fires a bunch of events while executing. As a user, you can extend or overwrite the actions performed by these events.
Some events have a default action that may be prevented (if the event is cancellable).

* [afterElementHyphenation](#afterelementhyphenation-event)
* [beforeElementHyphenation](#beforeelementhyphenation-event)
* [engineReady](#engineready-event)
* [error](#error-event)
* [hyphenopolyEnd](#hyphenopolyend-event)
* [hyphenopolyStart](#hyphenopolystart-event)
* [polyfill](#polyfill-event)
* [tearDown](#teardown-event)

To handle some of these events, you may specify a 'handleEvent' property in the global 'Hyphenopoly' object:

````javascript
Hyphenopoly.config({
    require: {
        //[...]
    },
    handleEvent: {
        "hyphenopolyEnd": function () {
            console.log("Hyphenopoly ended");
        }
    }
});
````

Internally, events in Hyphenopoly are implemented as Promises that are fulfilled with a certain value.

## afterElementHyphenation-Event
Fired after an element has been hyphenated.

````
Default-action: none
cancellable: true
Fields: `el` (element), `lang` (language-code)
````

## beforeElementHyphenation-Event
Fired before an element gets hyphenated.

````
Default-action: none
cancellable: true
Fields: `el` (element), `lang` (language-code)
````

## engineReady-Event
Fired when engine and pattern files are ready.

````
Default-action: none
cancellable: true
Fields: `lang` (language-code)
````

## error-Event
Fired when an error occurs.

````
Default-action: `window.console.warn(e);`
cancellable: true
Fields: e (Error)
````

To silence errors, prevent the default of this event:

````javascript
Hyphenopoly.config({
    require: {
        //[...]
    },
    handleEvent: {
        error: function (e) {
            e.preventDefault(); //don't show error messages in console
        }
    }
});
````
## hyphenopolyEnd-Event
Fired when all collected elements are hyphenated.

````
Default-action: none
cancellable: true
Fields: null
````

## hyphenopolyStart-Event
Fired when Hyphenopoly starts.

````
Default-action: none
cancellable: true
Fields: null
````

## polyfill-Event
Fired when Hyphenopoly_Loader.js decides to load Hyphenopoly.js.

````
Default-action: none
cancellable: true
Fields: null
````

## tearDown-Event
Fired when Hyphenopoly_Loader.js decides NOT to load Hyphenopoly.js and before it deletes the global 'Hyphenopoly' object. This event can be used to invoke other scripts, if native CSS hyphenation is available.

````
Default-action: none
cancellable: true
Fields: null
````
