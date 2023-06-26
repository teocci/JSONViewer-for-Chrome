/**
 * Adapted the code in to order to run in a web worker.
 *
 * Original author: Benjamin Hollis
 * Maintained by teocci on 11/28/17.
 */
function htmlEncode(t) {
    if (t == null) return ''

    return t.toString()
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/ /g, '&nbsp;')
}

function addComma(index, length) {
    return index < length - 1 ? ',' : ''
}

function decorateWithSpan(value, className) {
    return `<span class="${className}">${htmlEncode(value)}</span>`
}

function valueToHTML(value) {
    const type = value === null ? 'null' : typeof value
    let output = ''

    switch (type) {
        case 'object':
            output += value && value.constructor === Array ? arrayToHTML(value) : objectToHTML(value)

            break

        case 'number':
            output += decorateWithSpan(value, 'type-number')

            break

        case 'string':
            if (/^(http|https):\/\/[^\s]+$/.test(value)) {
                output += `${decorateWithSpan('"', 'type-string')}<a target="_blank" href="${value}">${htmlEncode(value)}</a>${decorateWithSpan('"', 'type-string')}`
            } else {
                output += decorateWithSpan(`"${value}"`, 'type-string')
            }
            break

        case 'boolean':
            output += decorateWithSpan(value, 'type-boolean')
            break

        case 'undefined':
            output += decorateWithSpan('undefined', 'type-undefined')
            break

        case 'symbol':
            output += decorateWithSpan(value.toString(), 'type-symbol')
            break

        case 'function':
            output += decorateWithSpan('function', 'type-function')
            break

        case 'bigint':
            output += decorateWithSpan(value.toString(), 'type-bigint')
            break

        case 'null':
            output += decorateWithSpan('null', 'type-null')
            break

        default:
            output += decorateWithSpan(type, 'type-other')
            break
    }

    // if (value == null) output += decorateWithSpan('null', 'type-null')
    // else if (value && value.constructor === Array)
    //     output += arrayToHTML(value)
    // else if (type === 'object') {
    //     output += objectToHTML(value)
    // } else if (type === 'number') {
    //     output += decorateWithSpan(value, 'type-number')
    // } else if (type === 'string') {
    //     if (/^(http|https):\/\/[^\s]+$/.test(value)) {
    //         output += decorateWithSpan('"', 'type-string') +
    //             '<a target="_blank" href="' + value + '">' + htmlEncode(value) + '</a>' +
    //             decorateWithSpan('"', 'type-string')
    //     } else {
    //         output += decorateWithSpan('"' + value + '"', 'type-string')
    //     }
    // } else if (type === 'boolean') {
    //     output += decorateWithSpan(value, 'type-boolean')
    // }

    return output
}

function arrayToHTML(json) {
    const length = json.length
    let output = '<div class="collapser"></div>[<span class="ellipsis"></span><ul class="array collapsible">',
        hasContents = false,
        index = 0

    for (const item of json) {
        hasContents = true
        output += `<li><div class="hoverable">${valueToHTML(item)}${addComma(index, length)}</div></li>`
        index++
    }
    output += '</ul>]'

    if (!hasContents) return '[ ]'

    return output
}

function objectToHTML(json) {
    const keys = Object.keys(json)
    const length = keys.length

    let output = '<div class="collapser"></div>{<span class="ellipsis"></span><ul class="obj collapsible">',
        hasContents = false,
        index = 0

    for (const key of keys) {
        hasContents = true
        output += '<li><div class="hoverable">'
        output += `<span class="property">${htmlEncode(key)}</span>: ${valueToHTML(json[key])}${addComma(index, length)}`
        output += '</div></li>'
        index++
    }
    output += '</ul>}'
    if (!hasContents) return '{ }'

    return output
}

function jsonToHTML(json, fnName) {
    let output = fnName ? `<div class="callback-function">${fnName}(</div>` : ''
    output += `<div id="json">${valueToHTML(json)}</div>`

    return `${output}${fnName ? '<div class="callback-function">)</div>' : ''}`
}

const initContentChannel = async port => {
    port.onMessage.addListener(msg => {
        console.log('Formatter[msg][type]', msg.type)

        const type = msg.type

        if (type !== 'json-to-html') return

        try {
            const object = JSON.parse(msg.json)
            const html = jsonToHTML(object, msg.fnName) ?? null
            if (!html) return
            port.postMessage({
                type: 'on-json-formatted',
                target: 'content',
                html,
            })
        } catch (e) {
            console.error(e)
            port.postMessage({
                type: 'on-json-formatted',
                target: 'content',
                error: true,
            })
        }
    })
}

chrome.runtime.onConnect.addListener(async port => {
    console.log(`Formatter[port][name]: ${port.name}`)

    if (port.name === 'content-channel') await initContentChannel(port)
})
