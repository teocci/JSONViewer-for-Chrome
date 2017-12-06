/**
 * Adapted the code in to order to run in a web worker.
 *
 * Original author: Benjamin Hollis
 * Maintained by teocci on 11/28/17.
 */

function htmlEncode(t) {
    if (t === null) return '';

    return t.toString()
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/ /g, '&nbsp;');
}

function decorateWithSpan(value, className) {
    return '<span class="' + className + '">' + htmlEncode(value) + '</span>';
}

function valueToHTML(value) {
    var valueType = typeof value, output = '';

    if (value == null)
        output += decorateWithSpan('null', 'type-null');
    else if (value && value.constructor == Array)
        output += arrayToHTML(value);
    else if (valueType == 'object') {
        output += objectToHTML(value);
    } else if (valueType == 'number') {
        output += decorateWithSpan(value, 'type-number');
    } else if (valueType == 'string') {
        if (/^(http|https):\/\/[^\s]+$/.test(value)) {
            output += decorateWithSpan('"', 'type-string') +
                '<a target="_blank" href="' + value + '">' + htmlEncode(value) + '</a>' +
                decorateWithSpan('"', 'type-string');
        } else {
            output += decorateWithSpan('"' + value + '"', 'type-string');
        }
    } else if (valueType == 'boolean') {
        output += decorateWithSpan(value, 'type-boolean');
    }

    return output;
}

function arrayToHTML(json) {
    var output = '<div class="collapser"></div>[<span class="ellipsis"></span><ul class="array collapsible">',
        hasContents = false,
        index = 0,
        length = json.length;

    json.forEach(function (item) {
        hasContents = true;
        output += '<li><div class="hoverable">';
        output += valueToHTML(item);
        if (index < length - 1)
            output += ',';
        output += '</div></li>';
    });

    output += '</ul>]';
    if (!hasContents) {
        output = '[ ]';
    }
    return output;
}

function objectToHTML(json) {
    var keys = Object.keys(json),
        output = '<div class="collapser"></div>{<span class="ellipsis"></span><ul class="obj collapsible">',
        hasContents = false,
        index = 0,
        length = keys.length;

    keys.forEach(function (key) {
        hasContents = true;
        output += '<li><div class="hoverable">';
        output += '<span class="property">"' + htmlEncode(key) + '"</span>: ';
        output += valueToHTML(json[key]);
        if (index < length - 1) {
            output += ',';
        }
        output += '</div></li>';
    });

    output += '</ul>}';
    if (!hasContents) {
        output = '{ }';
    }
    return output;
}

function jsonToHTML(json, fnName) {
    var output = '';
    if (fnName) {
        output += '<div class="callback-function">' + fnName + '(</div>';
    }
    output += '<div id="json">';
    output += valueToHTML(json);
    output += '</div>';
    if (fnName) {
        output += '<div class="callback-function">)</div>';
    }
    return output;
}

addEventListener(
    'message',
    function (event) {
        var object;
        try {
            object = JSON.parse(event.data.json);
            postMessage({
                onJsonToHTML: true,
                html: jsonToHTML(object, event.data.fnName)
            });
        } catch (e) {
            postMessage({error: true});
            return;
        }
    },
    false
);
