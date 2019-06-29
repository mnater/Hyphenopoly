# Events
Hyphenopoly fires a bunch of events while executing. As a user you can extend or overwrite the actions performed by these events.
Some events have a default action that may be prevented (if event is cancellable).

## timeout-Event
Fired when the Flash Of Unhyphenated Content-prevention timed out.

````
Default-action: unhides content
cancellable: false
Fields: `delay` (timeout in ms)
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

## contentLoaded-Event
Handles the DOMContentLoaded internally.
Can be manually fired if contentChanges to rehyphenate the document.

````
Default-action: runs Hyphenopoly (together with `engineLoaded` and `hpbLoaded`)
cancellable: false
Fields: `msg` (list of what has been loaded)
````

_note: use [Hyphenators](./Hyphenators.md) to prevent a costly rehyphenation of the whole document_

## engineLoaded-Event
Fired when the (w)asm-engine is instantiated.

````
Default-action: starts Hyphenopoly (together with `DOMContentLoaded ` and `hpbLoaded`)
cancellable: false
Fields: `msg` (list of what has been loaded)
````

## hpbLoaded-Event
Fired on each load of a patternfile.

````
Default-action: starts Hyphenopoly (together with `DOMContentLoaded ` and `engineLoaded `)
cancellable: false
Fields: `msg` (list of what has been loaded)
````

## loadError-Event
(new in v3.0.0)
Fired just before Hyphenopoly is deleted if the browser supports native CSS.

````
Default-action: Remove elements from the internal list of elements to be hyphenated.
cancellable: false
Fields: `msg` (list of what has not been loaded)
````

## elementsReady-Event
Fired when elements are collected and ready for hyphenation.

````
Default-action: Starts hyphenation if pattern file and engine are ready.
cancellable: false
Fields: null
````

## engineReady-Event
Fired when engine and pattern files are ready.

````
Default-action: Starts hyphenation if elements are ready.
cancellable: false
Fields: msg (language code)
````

## hyphenopolyStart-Event
Fired when Hyphenopoly starts.

````
Default-action: null
cancellable: true
Fields: msg
````

## hyphenopolyEnd-Event
Fired when all collected elements are hyphenated.

````
Default-action: clears FOUHC-timeout and unhides elements
cancellable: false
Fields: null
````

## beforeElementHyphenation-Event
Fired before an element gets hyphenated.

````
Default-action: null
cancellable: true
Fields: `el` (element), `lang` (language-code)
````

## afterElementHyphenation-Event
Fired after an element has been hyphenated.

````
Default-action: null
cancellable: true
Fields: `el` (element), `lang` (language-code)
````

## tearDown-Event
(new in v3.0.0)
Fired just before Hyphenopoly is deleted if the browser supports native CSS.

````
Default-action: null
cancellable: true
Fields: null
````