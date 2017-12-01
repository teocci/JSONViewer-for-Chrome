var port = chrome.runtime.connect(),
    collapsers,
    options,
    jsonObject,
    rawData,
    errorLocs = [];

function displayError(error, loc, offset) {
    var locKey = loc.first_column + ';' +
        loc.first_line + ';' +
        loc.last_column + ';' +
        loc.last_line;

    if (errorLocs.indexOf(locKey) == -1) {
        errorLocs.push(locKey);

        var link = document.createElement('link'),
            pre = document.body.firstChild.firstChild,
            text = pre.textContent.substring(offset),
            range = document.createRange(),
            imgError = document.createElement('img'),
            content = document.createElement('div'),
            errorPosition = document.createElement('span'),
            container = document.createElement('div'),
            closeButton = document.createElement('div'),
            start = 0,
            ranges = [],
            idx = 0,
            end;

        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = chrome.runtime.getURL('assets/css/content_error.css');
        document.head.appendChild(link);

        while (idx != -1) {
            idx = text.indexOf('\n', start);
            ranges.push(start);
            start = idx + 1;
        }

        start = ranges[loc.first_line - 1] + loc.first_column + offset;
        end = ranges[loc.last_line - 1] + loc.last_column + offset;
        range.setStart(pre, start);
        if (start == end - 1) {
            range.setEnd(pre, start);
        } else {
            range.setEnd(pre, end);
        }

        errorPosition.className = 'error-position';
        errorPosition.id = 'error-position';
        range.surroundContents(errorPosition);

        imgError.src = chrome.runtime.getURL('assets/images/error.gif');
        errorPosition.appendChild(imgError);

        closeButton.className = 'close-error';
        closeButton.onclick = function () {
            content.parentElement.removeChild(content);
        };

        content.className = 'content';
        content.textContent = error;
        content.appendChild(closeButton);
        container.className = 'container';
        container.appendChild(content);
        errorPosition.parentNode.insertBefore(container, errorPosition.nextSibling);

        location.hash = 'error-position';
        history.replaceState({}, '', '#');
    }
}

function displayUI(theme, html) {
    var statusElement,
        toolboxElement,
        expandElement,
        reduceElement,
        viewSourceElement,
        optionsElement,
        content = "",
        copyPathElement;

    content += '<link rel="stylesheet" type="text/css" href="' + chrome.runtime.getURL('assets/css/jsonview-core.css') + '">';
    content += '<style>' + theme + '</style>';
    content += html;
    document.body.innerHTML = content;

    collapsers = document.querySelectorAll('#json .collapsible .collapsible');

    copyPathElement = document.createElement('div');
    copyPathElement.className = 'copy-path';
    statusElement = document.createElement('div');
    statusElement.className = 'status';
    statusElement.appendChild(copyPathElement);
    document.body.appendChild(statusElement);

    toolboxElement = document.createElement('div');
    toolboxElement.className = 'toolbox';

    expandElement = document.createElement('button');
    expandElement.id = 'expand_all';
    expandElement.innerText = "+";
    reduceElement = document.createElement('button');
    reduceElement.id = 'reduce_all';
    reduceElement.innerText = "-";
    viewSourceElement = document.createElement('button');
    viewSourceElement.id = 'view_source';
    viewSourceElement.innerText = "View source";
    // viewSourceElement.target = "_blank";
    // viewSourceElement.href = "view-source:" + location.href;
    optionsElement = document.createElement('img');
    optionsElement.title = 'options';
    optionsElement.src = chrome.runtime.getURL('assets/images/options.png');

    toolboxElement.appendChild(expandElement);
    toolboxElement.appendChild(reduceElement);
    toolboxElement.appendChild(viewSourceElement);
    toolboxElement.appendChild(optionsElement);

    document.body.appendChild(toolboxElement);
    document.body.addEventListener('click', onToggle, false);
    document.body.addEventListener('mouseover', onMouseMove, false);
    document.body.addEventListener('click', onMouseClick, false);
    document.body.addEventListener('contextmenu', onContextMenu, false);

    expandElement.addEventListener('click', onExpand, false);
    reduceElement.addEventListener('click', onReduce, false);

    viewSourceElement.addEventListener('click', onViewSource, false);
    optionsElement.addEventListener('click', onOptions, false);

    copyPathElement.addEventListener(
        'click',
        function () {
            port.postMessage({
                copyPropertyPath: true,
                path: statusElement.innerText
            });
        },
        false
    );
}

function onToggle(event) {
    var collapsed, ellipsis, target = event.target;
    if (event.target.className == 'collapser') {
        ellipsis = target.parentNode.getElementsByClassName('ellipsis')[0];
        collapsed = target.parentNode.getElementsByClassName('collapsible')[0];
        if (collapsed.parentNode.classList.contains('collapsed')) {
            collapsed.parentNode.classList.remove('collapsed');
        } else {
            collapsed.parentNode.classList.add('collapsed');
            ellipsis.setAttribute('data-value', collapsed.childElementCount.toString());
        }
    }
}

function onExpand() {
    Array.prototype.forEach.call(collapsers, function (collapsed) {
        if (collapsed.parentNode.classList.contains('collapsed')) {
            collapsed.parentNode.classList.remove('collapsed');
        }
    });
}

function onReduce() {
    Array.prototype.forEach.call(collapsers, function (collapsed) {
        if (!collapsed.parentNode.classList.contains('collapsed')) {
            var ellipsis = collapsed.parentNode.getElementsByClassName('ellipsis')[0];
            if (ellipsis) {
                ellipsis.setAttribute('data-value', collapsed.childElementCount.toString());
            }
            collapsed.parentNode.classList.add('collapsed');
        }
    });
}

function onViewSource() {
    var w = openNewContent('assets/source.html');
}

function onOptions() {
    openNewContent('assets/options.html');
}

function openNewContent(contentPath) {
    return window.open(chrome.runtime.getURL(contentPath), '_blank').focus();
}

function getParentLI(element) {
    if (element.tagName != 'LI')
        while (element && element.tagName != 'LI')
            element = element.parentNode;
    if (element && element.tagName == 'LI')
        return element;
}

var onMouseMove = (function () {
    var hoveredLI;

    function onMouseOut() {
        var statusElement = document.querySelector('.status');
        if (hoveredLI) {
            hoveredLI.firstChild.classList.remove('hovered');
            hoveredLI = null;
            statusElement.innerText = '';
        }
    }

    return function (event) {
        var str = "", statusElement = document.querySelector('.status');
        var element = getParentLI(event.target);
        if (element) {
            if (hoveredLI)
                hoveredLI.firstChild.classList.remove('hovered');
            hoveredLI = element;
            element.firstChild.classList.add('hovered');
            do {
                if (element.parentNode.classList.contains('array')) {
                    var index = [].indexOf.call(element.parentNode.children, element);
                    str = '[' + index + ']' + str;
                }
                if (element.parentNode.classList.contains('obj')) {
                    str = "." + element.firstChild.firstChild.innerText + str;
                }
                element = element.parentNode.parentNode.parentNode;
            } while (element.tagName == 'LI');
            if (str.charAt(0) == '.')
                str = str.substring(1);
            statusElement.innerText = str;
            return;
        }
        onMouseOut();
    };
})();

var selectedLI;

function onMouseClick() {
    if (selectedLI)
        selectedLI.firstChild.classList.remove('selected');
    selectedLI = getParentLI(event.target);
    if (selectedLI) {
        selectedLI.firstChild.classList.add('selected');
    }
}

function onContextMenu() {
    var currentLI,
        statusElement,
        selection = "",
        value;
    currentLI = getParentLI(event.target);
    statusElement = document.querySelector('.status');
    if (currentLI) {
        if (Array.isArray(jsonObject))
            value = eval('(jsonObject' + statusElement.innerText + ')');
        else
            value = eval('(jsonObject.' + statusElement.innerText + ')');
        port.postMessage({
            copyPropertyPath: true,
            path: statusElement.innerText,
            value: typeof value == 'object' ? JSON.stringify(value) : value
        });
    }
}

function extractData(rawText) {
    var tokens, text = rawText.trim();

    function test(text) {
        return ((text.charAt(0) == '[' && text.charAt(text.length - 1) == ']') ||
        (text.charAt(0) == '{' && text.charAt(text.length - 1) == '}'));
    }

    if (test(text)) {
        return {
            text: rawText,
            offset: 0
        };
    }
    tokens = text.match(/^([^\s\(]*)\s*\(([\s\S]*)\)\s*;?$/);
    if (tokens && tokens[1] && tokens[2]) {
        if (test(tokens[2].trim())) {
            return {
                fnName: tokens[1],
                text: tokens[2],
                offset: rawText.indexOf(tokens[2])
            };
        }
    }
}

function processData(data) {
    var xhr, jsonText;

    function formatToHTML(fnName, offset) {
        if (!jsonText) return;

        port.postMessage({
            jsonToHTML: true,
            json: jsonText,
            fnName: fnName,
            offset: offset
        });
        try {
            jsonObject = JSON.parse(jsonText);
        } catch (e) {
        }
    }

    if (window == top || options.injectInFrame) {
        if (options.safeMethod) {
            xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (this.readyState == 4) {
                    data = extractData(this.responseText);
                    if (data) {
                        jsonText = data.text;
                        formatToHTML(data.fnName, data.offset);
                    }
                }
            };
            xhr.open('GET', document.location.href, true);
            xhr.send(null);
        } else if (data) {
            jsonText = data.text;
            formatToHTML(data.fnName, data.offset);
        }
    }
}

function init(data) {
    port.onMessage.addListener(function (msg) {
        if (msg.onInit) {
            options = msg.options;
            processData(data);
        }
        if (msg.onJsonToHTML) {
            if (msg.html) {
                displayUI(msg.theme, msg.html);
            } else if (msg.json) {
                port.postMessage({
                    getError: true,
                    json: json,
                    fnName: fnName
                });
            }
        }
        if (msg.onGetError) {
            displayError(msg.error, msg.loc, msg.offset);
        }
    });
    port.postMessage({
        init: true,
        rawData: rawData.innerHTML
    });
}

function stripJsonPrefix(text) {
    // Some implementations return a JSON_PREFIX to help avoid
    // allowing your JSON replies to be turned into JSONP replies.
    var JSON_PREFIXES = [")]}', ", ")]}',\n"];

    JSON_PREFIXES.forEach(function (prefix) {
        if (text.substr(0, prefix.length) == prefix) {
            text = text.substr(prefix.length);
        }
    });

    return text;
}

function load() {
    if (document.body &&
        (
            document.body.childNodes[0] &&
            document.body.childNodes[0].tagName == 'PRE' ||
            document.body.children.length == 0
        )
    ) {
        var data;
        rawData = document.body.children.length ? document.body.childNodes[0] : document.body;

        data = extractData(stripJsonPrefix(rawData.innerText));
        if (data) {
            init(data);
        }
    }
}

document.addEventListener('DOMContentLoaded', load, false);

