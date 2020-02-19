# Events
Hyphenopoly fires a bunch of events while executing. As a user you can extend or overwrite the actions performed by these events.
Some events have a default action that may be prevented (if event is cancellable).

*   [afterElementHyphenation](#afterelementhyphenation-event)
*   [beforeElementHyphenation](#beforeelementhyphenation-event)
*   [engineReady](#engineready-event)
*   [error](#error-event)
*   [hyphenopolyEnd](#hyphenopolyend-event)
*   [hyphenopolyStart](#hyphenopolystart-event)
*   [polyfill](#polyfill-event)
*   [tearDown](#teardown-event)

To handle some of these events, you may specify a 'handleEvent' property in the global 'Hyphenopoly' object:

````javascript
const Hyphenopoly = {
    require: {
        //[...]
    },
    handleEvent: {
        "hyphenopolyEnd": function () {
            console.log("Hyphenopoly ended");
        }
    }
}
````

Internally events in Hyphenopoly are implemented as Promises that fulfill with a certain value.

## afterElementHyphenation-Event
Fired after an element has been hyphenated.

````
Default-action: null
cancellable: true
Fields: `el` (element), `lang` (language-code)
````

## beforeElementHyphenation-Event
Fired before an element gets hyphenated.

````
Default-action: null
cancellable: true
Fields: `el` (element), `lang` (language-code)
````

## engineReady-Event
Fired when engine and pattern files are ready.

````
Default-action: Starts hyphenation if elements are ready.
cancellable: false
Fields: msg (language code)
````

## error-Event
Fired when an error occurs.

````
Default-action: `window.console.error(e.msg);`
cancellable: true
Fields: `msg` (error message)
````

To silent errors prevent default of this event:

````javascript
const Hyphenopoly = {
    require: {
        //[...]
    },
    handleEvent: {
        error: function (e) {
            e.preventDefault(); //don't show error messages in console
        }
    }
}
````
## hyphenopolyEnd-Event
Fired when all collected elements are hyphenated.

````
Default-action: clears FOUHC-timeout and unhides elements
cancellable: false
Fields: null
````

## hyphenopolyStart-Event
Fired when Hyphenopoly starts.

````
Default-action: null
cancellable: true
Fields: msg
````

## polyfill-Event
Fired when Hyphenopoly_Loader.js decides to load Hyphenopoly.js.

````
Default-action: null
cancellable: false
Fields: null
````

## tearDown-Event
Fired when Hyphenopoly_Loader.js decides NOT to load Hyphenopoly.js and before it deletes the global 'Hyphenopoly' object. This event can be used to invoke other scripts if native CSS hyphenation is available.

````
Default-action: `w.Hyphenopoly = null`
cancellable: false
Fields: null
````
