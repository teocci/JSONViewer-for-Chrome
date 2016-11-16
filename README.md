# JSONViewer-for-Chrome

JSONViewer-for-Chrome is a Chrome extension for printing JSON nicely when you visit it 'directly' in a browser tab. This allows you to a view JSON string in a tree format. Also, you can open/close sections for better visibility.

This a working version of [JSONView-for-Chrome](https://github.com/gildas-lormeau/JSONView-for-Chrome).
It just includes a prefix to avoid a [JSON vulnerability](http://haacked.com/archive/2008/11/20/anatomy-of-a-subtle-json-vulnerability.aspx).

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











