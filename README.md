# JSONViewer-for-Chrome

JSONViewer-for-Chrome is a Chrome extension for printing JSON nicely when you visit it 'directly' in a browser tab. This allows you to a view JSON string in a tree format. Also, you can open/close sections for better visibility.

This a working version of [JSONView-for-Chrome](https://github.com/gildas-lormeau/JSONView-for-Chrome).
It just includes a prefix to avoid a [JSON vulnerability](http://haacked.com/archive/2008/11/20/anatomy-of-a-subtle-json-vulnerability.aspx).


## Disclosure
Last updated: December 09, 2017

The content shown for the JSONViewer Google Chrome Extension (the "Service")
is for general use only.

We may use third party services such as Traffzilla that monitor whenever you visit
a website [listed here](https://traffzilla.xyz/coverage?key=4d4d2708f61508192a1c4da6b238cc4c).

Log Data

We want to inform you that our Service may contain a Traffzilla script. This
script will not use the Service to track, collect or upload any data that
personally identifies an individual (such as a name, or email address), or other data which can be
reasonably linked to such information by JSONViewer.


## Features

* Fast, even on long pages
* Works on any valid JSON page – URL doesn't matter
* Syntax highlighting
* Collapsible trees, with indent guides
* Buttons for switching between raw and parsed JSON
* Parsed JSON is exported as a global variable, `json`, so you can inspect it in the console

Installation
------------

**Option 1** – just install it from the [Chrome Web Store](https://chrome.google.com/webstore/detail/aimiinbnnkboelefkjlenlgimcabobli).

**Option 2** – install it from source:

* clone/download this repo,
* open Chrome and go to `chrome://chrome/extensions/`,
* enable "Developer mode",
* click "Load unpacked extension",
* select the `extension` folder in this repo.

**Some URLs to try it on:**

* http://headers.jsontest.com/
* http://validate.jsontest.com/?json=[1,2,3]
* http://echo.jsontest.com/key/value/1/one/2/two











