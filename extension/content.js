const sysGetURL = chrome.runtime.getURL
const port = chrome.runtime.connect({name: 'content-channel'})
const errorLocs = []
const hashID = (size = 6) => {
    const MASK = 0x3d
    const LETTERS = 'abcdefghijklmnopqrstuvwxyz'
    const NUMBERS = '1234567890'
    const charset = `${NUMBERS}${LETTERS}${LETTERS.toUpperCase()}_-`.split('')

    const bytes = new Uint8Array(size)
    crypto.getRandomValues(bytes)

    return bytes.reduce((acc, byte) => `${acc}${charset[byte & MASK]}`, '')
}

let collapsers,
    options,
    jsonObject,
    rawData,
    $selectedLI

function displayError(error, loc, offset) {
    const locKey = `${loc.first_column};${loc.first_line};${loc.last_column};${loc.last_line}`

    if (errorLocs.indexOf(locKey) === -1) {
        errorLocs.push(locKey)

        const $link = document.createElement('link'),
            $imgError = document.createElement('img'),
            $content = document.createElement('div'),
            $errorPosition = document.createElement('span'),
            $container = document.createElement('div'),
            $closeButton = document.createElement('div'),
            $pre = document.body.firstElementChild.firstElementChild,
            text = $pre.textContent.substring(offset),
            range = document.createRange()

        let start = 0,
            ranges = [],
            idx = 0,
            end

        $link.rel = 'stylesheet'
        $link.type = 'text/css'
        $link.href = sysGetURL('assets/css/content_error.css')
        document.head.append($link)

        while (idx !== -1) {
            idx = text.indexOf('\n', start)
            ranges.push(start)
            start = idx + 1
        }

        start = ranges[loc.first_line - 1] + loc.first_column + offset
        end = ranges[loc.last_line - 1] + loc.last_column + offset
        range.setStart($pre, start)
        range.setEnd($pre, start === end - 1 ? start : end)

        $errorPosition.className = 'error-position'
        $errorPosition.id = 'error-position'
        range.surroundContents($errorPosition)

        $imgError.src = sysGetURL('assets/images/error.gif')
        $errorPosition.append($imgError)

        $closeButton.className = 'close-error'
        $closeButton.onclick = function () {
            $content.parentElement.removeChild($content)
        }

        $content.className = 'content'
        $content.textContent = error
        $content.append($closeButton)

        $container.className = 'container'
        $container.append($content)
        $errorPosition.parentElement.insertBefore($container, $errorPosition.nextSibling)

        location.hash = 'error-position'
        history.replaceState({}, '', '#')
    }
}

function displayUI(theme, html) {
    let $status,
        $toolbox,
        $expand,
        $reduce,
        $viewSource,
        $options,
        content = '',
        $copyPath

    content += `<link rel="stylesheet" type="text/css" href="${sysGetURL('assets/css/jsonview-core.css')}">`
    content += `<style>${theme}</style>`
    content += html
    document.body.innerHTML = content

    collapsers = document.querySelectorAll('#json .collapsible .collapsible')

    for (const $collapser of collapsers) {
        const $parent = $collapser.parentElement
        const id = hashID()
        $parent.id = id
        $parent.dataset.status = 'expanded'
        $parent.onclick = e => {
            onToggle(e, id, $collapser)
        }
        $parent.onmouseover = e => {
            onMouseMove(e)
        }
    }

    $copyPath = document.createElement('div')
    $copyPath.className = 'copy-path'

    $status = document.createElement('div')
    $status.className = 'status'
    $status.append($copyPath)
    document.body.append($status)

    $toolbox = document.createElement('div')
    $toolbox.className = 'toolbox'

    $expand = document.createElement('button')
    $expand.id = 'expand_all'
    $expand.textContent = '+'

    $reduce = document.createElement('button')
    $reduce.id = 'reduce_all'
    $reduce.textContent = '-'

    $viewSource = document.createElement('button')
    $viewSource.id = 'view_source'
    $viewSource.textContent = 'View source'
    // $viewSource.target = '_blank'
    // $viewSource.href = `view-source: ${location.href}`

    $options = document.createElement('img')
    $options.title = 'options'
    $options.src = sysGetURL('assets/images/options.png')

    $toolbox.append($expand)
    $toolbox.append($reduce)
    $toolbox.append($viewSource)
    $toolbox.append($options)

    document.body.append($toolbox)
    // document.body.onclick = onToggle
    // document.body.onmouseover = onMouseMove
    document.body.onclick = onMouseClick
    document.body.oncontextmenu = onContextMenu

    $expand.onclick = onExpand
    $reduce.onclick = onReduce

    $viewSource.onclick = onViewSource
    $options.onclick = onOptions

    $copyPath.onclick = () => {
        port.postMessage({
            type: 'copy-property',
            target: 'background',
            path: $status.innerText,
        })
    }
}

function onToggle(e, id, $collapser) {
    e.preventDefault()
    e.stopPropagation()
    const $parent = $collapser.parentElement
    if ($parent.id === id) {
        switch ($parent.dataset.status) {
            case 'expanded':
                reduce($collapser)
                break
            case 'reduced':
                expand($collapser)
                break
            default:
                $parent.dataset.status = 'expanded'
                reduce($collapser)
        }
    }
}

function onExpand() {
    for (const $collapsed of collapsers) {
        expand($collapsed)
    }
}

function expand($collapsed) {
    const $parent = $collapsed.parentElement
    if ($parent.dataset.status !== 'reduced') return

    $parent.classList.remove('collapsed')
    $parent.dataset.status = 'expanded'
}

function onReduce() {
    for (const $collapsed of collapsers) {
        reduce($collapsed)
    }
}

function reduce($collapsed) {
    const $parent = $collapsed.parentElement
    if ($parent.dataset.status !== 'expanded') return

    const $ellipsis = $parent.querySelector('.ellipsis')
    if ($ellipsis) $ellipsis.dataset.value = `${$collapsed.childElementCount}`
    $parent.classList.add('collapsed')
    $parent.dataset.status = 'reduced'
}

function onViewSource() {
    openNewContent('assets/source.html')
}

function onOptions() {
    openNewContent('assets/options.html')
}

function openNewContent(path) {
    return window.open(sysGetURL(path), '_blank').focus()
}

function getParentLI($element) {
    if ($element && $element.tagName === 'LI') return $element

    while ($element && $element.tagName !== 'LI') {
        $element = $element.parentElement
    }

    return $element
}

const onMouseMove = (e => {
    let $hoveredLI

    function onMouseOut() {
        if ($hoveredLI == null) return

        const $status = document.querySelector('.status')

        $hoveredLI.firstElementChild.classList.remove('hovered')
        $hoveredLI = null
        $status.textContent = ''
    }

    return e => {
        let $li = getParentLI(e.target), str = ''
        if ($li == null) {
            onMouseOut()
            return
        }

        if ($hoveredLI) $hoveredLI.firstElementChild.classList.remove('hovered')

        $hoveredLI = $li
        $li.firstElementChild.classList.add('hovered')
        do {
            if ($li.parentElement.classList.contains('array')) {
                const index = [].indexOf.call($li.parentElement.children, $li)
                str = `[${index}] ${str}`
            }
            if ($li.parentElement.classList.contains('obj')) str = `.${$li.firstElementChild.firstElementChild.innerText}${str}`

            $li = $li.parentElement.parentElement.parentElement
        } while ($li.tagName === 'LI')

        if (str.charAt(0) === '.') str = str.substring(1)

        const $status = document.querySelector('.status')
        $status.innerText = str
    }
})()

function onMouseClick(e) {
    if ($selectedLI) $selectedLI.firstElementChild.classList.remove('selected')

    $selectedLI = getParentLI(e.target)
    if ($selectedLI) $selectedLI.firstElementChild.classList.add('selected')
}

function onContextMenu(e) {
    const $currentLI = getParentLI(e.target)
    const $status = document.querySelector('.status')

    let value

    if ($currentLI) {
        const path = $status.innerText
        const segments = path.split('.')
        let target = jsonObject

        for (const segment of segments) {
            target = target[segments]
            if (typeof target === 'undefined') {
                value = undefined
                break
            }
        }

        value = typeof target === 'object' ? JSON.stringify(target) : target

        // console.log('onContextMenu', {value})

        port.postMessage({
            type: 'copy-property',
            target: 'background',
            path,
            value,
        })
    }
}

function extractData(rawText) {
    const text = rawText.trim()
    let tokens

    const test = text => {
        return ((text.charAt(0) === '[' && text.charAt(text.length - 1) === ']') ||
            (text.charAt(0) === '{' && text.charAt(text.length - 1) === '}'))
    }

    if (test(text)) return {
        text: rawText,
        offset: 0,
    }

    tokens = text.match(/^([^\s(]*)\s*\(([\s\S]*)\)\s*;?$/)
    if (tokens && tokens[1] && tokens[2]) {
        if (test(tokens[2].trim())) return {
            fnName: tokens[1],
            text: tokens[2],
            offset: rawText.indexOf(tokens[2]),
        }
    }
}

function processData(data) {
    let jsonText

    const formatToHTML = (fnName, offset) => {
        if (!jsonText) return

        port.postMessage({
            type: 'json-to-html',
            target: 'background',
            json: jsonText,
            fnName: fnName,
            offset: offset,
        })

        try {
            jsonObject = JSON.parse(jsonText)
        } catch (e) {
        }
    }

    if (window === top || options.injectInFrame) {
        if (!options.safeMethod) {
            if (data == null) return

            jsonText = data.text
            formatToHTML(data.fnName, data.offset)
            return
        }

        fetch(document.location.href)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not OK')
                return response.text()
            })
            .then(responseText => {
                const data = extractData(responseText)
                if (data == null) return

                jsonText = data.text
                formatToHTML(data.fnName, data.offset)
            })
            .catch(error => {
                console.error('Error fetching data:', error)
            })
    }
}

function init(data) {
    const target = 'background'
    port.onMessage.addListener(function (msg) {
        console.log('Content[msg][type]', msg.type)
        const type = msg.type

        switch (type) {
            case 'on-init':
                options = msg.options
                processData(data)
                break

            case 'on-json-to-html':
                if (msg.html) {
                    displayUI(msg.theme, msg.html)
                } else if (msg.json) {
                    port.postMessage({
                        type: 'error',
                        target,
                        json: msg.json,
                        fnName: msg.fnName,
                    })
                }
                break

            case 'on-json-formatted':
                if (msg.html) port.postMessage({
                    type: 'formatted-to-html',
                    target,
                    html: msg.html,
                })
                break

            case 'on-error':
                displayError(msg.error, msg.loc, msg.offset)
                break

            default:
                console.log(`${type} not supported`)
        }
    })

    port.postMessage({
        type: 'init',
        target,
        rawData: rawData.innerHTML,
    })
}

function stripJsonPrefix(text) {
    // Some implementations return a JSON_PREFIX to help avoid
    // allowing your JSON replies to be turned into JSONP replies.
    const JSON_PREFIXES = [')]}\', ', ')]}\',\n']
    for (const prefix of JSON_PREFIXES) {
        if (text.substring(0, prefix.length) === prefix) text = text.substring(prefix.length)
    }

    return text
}

function load() {
    if (document.body &&
        (
            document.body.firstElementChild &&
            document.body.firstElementChild.tagName === 'PRE' ||
            document.body.children.length === 0
        )
    ) {
        rawData = document.body.children.length ? document.body.firstElementChild : document.body

        const data = extractData(stripJsonPrefix(rawData.innerText))
        if (data) init(data)
    }
}

document.addEventListener('DOMContentLoaded', load)

