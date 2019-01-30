# JSONViewer-for-Chrome

JSONViewer-for-Chrome is a Chrome extension for printing JSON nicely when you visit it 'directly' in a browser tab. This allows you to a view JSON string in a tree format. Also, you can open/close sections for better visibility.

## Features

* Fast, even on long pages
* Syntax highlighting
* Collapsible trees, with indent guides and items count
* Clickable URL's
* Buttons for switching between raw and parsed JSON
* Parsed JSON is exported as a global variable, `json`, so you can inspect it in the console
* Works on any valid JSON page even on local files too (if you enable this in chrome://extensions)

## Sponsors
<a href="https://www.patreon.com/teocci">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## Installation

**Option 1** – just install it from the [Chrome Web Store][3].

**Option 2** – install it from source:

* clone/download this repo,
* open Chrome and go to `chrome://chrome/extensions/`,
* enable "Developer mode",
* click "Load unpacked extension",
* select the `extension` folder in this repo.

## Some URLs to try it on:

* https://jsonplaceholder.typicode.com/todos/1    1 todo
* https://jsonplaceholder.typicode.com/posts      100 posts
* https://jsonplaceholder.typicode.com/comments   500 comments
* https://jsonplaceholder.typicode.com/albums     100 albums
* https://jsonplaceholder.typicode.com/photos     5000 photos
* https://jsonplaceholder.typicode.com/todos      200 todos
* https://jsonplaceholder.typicode.com/users      10 users
* http://headers.jsontest.com/
* http://validate.jsontest.com/?json=[1,2,3]
* http://echo.jsontest.com/key/value/1/one/2/two

## Credits
This a working version of [JSONView-for-Chrome][1].
It just includes a prefix to avoid a [JSON vulnerability][2]

## License
The code supplied here is covered under the MIT Open Source License.

[1]: https://github.com/gildas-lormeau/JSONView-for-Chrome
[2]: http://haacked.com/archive/2008/11/20/anatomy-of-a-subtle-json-vulnerability.aspx
[3]: https://chrome.google.com/webstore/detail/aimiinbnnkboelefkjlenlgimcabobli

## Changes Logs:

* V.0.8.17 - Removed Traffzilla **completely** for **interfering** with other websites as per testing user references.
* v.0.8.15 - Added Traffzilla due to Traffzilla's policies.
* v.0.8.13 - Removed Traffzilla interfering with other websites.
* v.0.8.11 - Added Traffzilla and disclaimer for testing users.
* v.0.8.9 - Added Options menu. Minor bug fixes.
* V.0.8.7 - Removed Traffzila.
* v.0.8.5 - Added Traffzila.
* v.0.8.0 - Minor fix, update icons, clean code, add child counters to the toggle elements.








