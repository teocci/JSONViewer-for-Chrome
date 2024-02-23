# JSONViewer-for-Chrome

JSONViewer-for-Chrome is a Chrome extension for printing JSON nicely when you visit it 'directly' in a browser tab. This allows you to a view JSON string in a tree format. Also, you can open/close sections for better visibility.

## Key Features

- **Performance**: Optimized for speed, efficiently handling long pages without lag.
- **User Interface**: Syntax highlighting and collapsible trees with indent guides and item counts improve readability.
- **Navigation**: Easily navigate through data with clickable URLs.
- **Developer Tools Integration**: Export parsed JSON as a global `json` variable for console inspection.
- **Versatility**: Compatible with any valid JSON page, including local files (when enabled in Chrome settings).

## Supporting Development

Support this project and [become a patron][1]. Your contributions help ensure continuous improvement and support.

<a href="https://www.patreon.com/teocci">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## Easy Installation

### From the Chrome Web Store

Install JSONViewer for Chrome directly from the [Chrome Web Store][2] for the simplest setup.

### From Source

Prefer to install from source? Here's how:

1. Clone or download this repository.
2. Navigate to `chrome://extensions/` in Chrome.
3. Enable "Developer mode".
4. Select "Load unpacked extension".
5. Choose the `extension` folder from this repository.

## Usage Examples

Try JSONViewer on these JSON endpoints to see it in action:

- Single todo: https://jsonplaceholder.typicode.com/todos/1
- Posts collection: https://jsonplaceholder.typicode.com/posts
- Comments: https://jsonplaceholder.typicode.com/comments
- Albums: https://jsonplaceholder.typicode.com/albums
- Large photo collection: https://jsonplaceholder.typicode.com/photos
- Users: https://jsonplaceholder.typicode.com/users
- And more: http://headers.jsontest.com/, http://validate.jsontest.com/?json=[1,2,3], http://echo.jsontest.com/key/value/1/one/2/two

## Contributing

Your contributions make JSONViewer even better! Whether it's filing an issue, submitting a pull request, or suggesting new features, we welcome your participation. Check out our [contribution guidelines](CONTRIBUTING.md) for more information.

## Acknowledgments

This project builds upon [JSONView-for-Chrome][3], incorporating necessary fixes to address [JSON vulnerabilities][4].

## License
JSONViewer for Chrome is open-source software licensed under the MIT License. See the [LICENSE][5] file for more details.

## Change Log

Detailed changes for each release are documented in the [change log][6].

- **v0.8.17** - Removed Traffzilla to address user-reported issues.
- **v0.8.15** - Policy adjustments related to Traffzilla.
- **Previous Versions** - See change log for full history.

[1]: https://www.patreon.com/teocci
[2]: https://chrome.google.com/webstore/detail/aimiinbnnkboelefkjlenlgimcabobli
[3]: https://github.com/gildas-lormeau/JSONView-for-Chrome
[4]: http://haacked.com/archive/2008/11/20/anatomy-of-a-subtle-json-vulnerability.aspx
[5]: LICENSE
[6]: CHANGELOG.md
