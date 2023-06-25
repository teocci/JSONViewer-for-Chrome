const sysGetURL = chrome.runtime.getURL
const port = chrome.runtime.connect({name: 'JSON Viewer'})
const errorLocs = []

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
    let $statusElement,
        $toolboxElement,
        $expandElement,
        $reduceElement,
        $viewSourceElement,
        $optionsElement,
        content = '',
        $copyPathElement

    content += `<link rel="stylesheet" type="text/css" href="${sysGetURL('assets/css/jsonview-core.css')}">`
    content += `<style>${theme}</style>`
    content += html
    document.body.innerHTML = content

    collapsers = document.querySelectorAll('#json .collapsible .collapsible')

    $copyPathElement = document.createElement('div')
    $copyPathElement.className = 'copy-path'

    $statusElement = document.createElement('div')
    $statusElement.className = 'status'
    $statusElement.append($copyPathElement)
    document.body.append($statusElement)

    $toolboxElement = document.createElement('div')
    $toolboxElement.className = 'toolbox'

    $expandElement = document.createElement('button')
    $expandElement.id = 'expand_all'
    $expandElement.conentText = '+'

    $reduceElement = document.createElement('button')
    $reduceElement.id = 'reduce_all'
    $reduceElement.conentText = '-'

    $viewSourceElement = document.createElement('button')
    $viewSourceElement.id = 'view_source'
    $viewSourceElement.conentText = 'View source'
    // $viewSourceElement.target = '_blank'
    // $viewSourceElement.href = `view-source: ${location.href}`

    $optionsElement = document.createElement('img')
    $optionsElement.title = 'options'
    $optionsElement.src = sysGetURL('assets/images/options.png')

    $toolboxElement.append($expandElement)
    $toolboxElement.append($reduceElement)
    $toolboxElement.append($viewSourceElement)
    $toolboxElement.append($optionsElement)

    document.body.append($toolboxElement)
    document.body.onclick = onToggle
    document.body.onmouseover = onMouseMove
    document.body.onclick = onMouseClick
    document.body.oncontextmenu = onContextMenu

    $expandElement.onclick = onExpand
    $reduceElement.onclick = onReduce

    $viewSourceElement.onclick = onViewSource
    $optionsElement.onclick = onOptions

    $copyPathElement.onclick = () => {
        port.postMessage({
            copyPropertyPath: true,
            path: $statusElement.innerText
        })
    }
}

function onToggle(e) {
    const $target = e.target
    let $collapsed, $ellipsis

    if (e.target.className === 'collapser') {
        $ellipsis = $target.parentElement.querySelector('.ellipsis')
        $collapsed = $target.parentElement.querySelector('.collapsible')
        const $parent = $collapsed.parentElement
        if ($parent.classList.contains('collapsed')) {
            $parent.classList.remove('collapsed')
        } else {
            $parent.classList.add('collapsed')
            $ellipsis.setAttribute('data-value', `${$collapsed.childElementCount}`)
        }
    }
}

function onExpand() {
    for (const $collapsed of collapsers) {
        const $parent = $collapsed.parentElement
        if ($parent.classList.contains('collapsed')) {
            $parent.classList.remove('collapsed')
        }
    }
}

function onReduce() {
    for (const $collapsed of collapsers) {
        const $parent = $collapsed.parentElement
        if ($parent.classList.contains('collapsed')) continue

        const $ellipsis = $parent.querySelector('.ellipsis')
        if ($ellipsis) $ellipsis.setAttribute('data-value', `${$collapsed.childElementCount}`)
        $parent.classList.add('collapsed')
    }
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

    while ($element && $element.tagName !== 'LI') $element = $element.parentElement
}

const onMouseMove = (e => {
    const $status = document.querySelector('.status')

    let $hoveredLI

    function onMouseOut() {
        if ($hoveredLI == null) return

        $hoveredLI.firstElementChild.classList.remove('hovered')
        $hoveredLI = null
        $status.conentText = ''
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

        $status.innerText = str
    }
})()

function onMouseClick(e) {
    if ($selectedLI) $selectedLI.firstElementChild.classList.remove('selected')

    $selectedLI = getParentLI(e.target)
    if ($selectedLI) $selectedLI.firstElementChild.classList.add('selected')
}

function onContextMenu(e) {
    let $currentLI,
        $status,
        value
    $currentLI = getParentLI(e.target)
    $status = document.querySelector('.status')
    if ($currentLI) {
        if (Array.isArray(jsonObject)) value = eval(`(jsonObject.${$status.innerText})`)
        else value = eval(`(jsonObject.${$status.innerText})`)

        port.postMessage({
            copyPropertyPath: true,
            path: $status.innerText,
            value: typeof value === 'object' ? JSON.stringify(value) : value
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
        offset: 0
    }

    tokens = text.match(/^([^\s(]*)\s*\(([\s\S]*)\)\s*;?$/)
    if (tokens && tokens[1] && tokens[2]) {
        if (test(tokens[2].trim())) return {
            fnName: tokens[1],
            text: tokens[2],
            offset: rawText.indexOf(tokens[2])
        }
    }
}

function processData(data) {
    let jsonText

    const formatToHTML = (fnName, offset) => {
        if (!jsonText) return
        console.log('formatToHTML 1')

        port.postMessage({
            jsonToHTML: true,
            json: jsonText,
            fnName: fnName,
            offset: offset
        })
        console.log('formatToHTML 2',{fnName, offset})

        try {
            jsonObject = JSON.parse(jsonText)
            console.log({jsonObject})
        } catch (e) {
        }
    }

    if (window === top || options.injectInFrame) {
        console.log({options})
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
    port.onMessage.addListener(function (msg) {
        if (msg.onInit) {
            options = msg.options
            processData(data)
        }
        if (msg.onJsonToHTML) {
            if (msg.html) {
                displayUI(msg.theme, msg.html)
            } else if (msg.json) {
                port.postMessage({
                    getError: true,
                    json: json,
                    fnName: fnName
                })
            }
        }
        if (msg.onGetError) {
            displayError(msg.error, msg.loc, msg.offset)
        }
    })

    port.postMessage({
        init: true,
        rawData: rawData.innerHTML
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
    console.log('JSON Viewer load start')
    if (document.body &&
        (
            document.body.firstElementChild &&
            document.body.firstElementChild.tagName === 'PRE' ||
            document.body.children.length === 0
        )
    ) {
        rawData = document.body.children.length ? document.body.firstElementChild : document.body

        const data = extractData(stripJsonPrefix(rawData.innerText))
        console.log({rawData: data})
        if (data) init(data)
    }
    console.log('JSON Viewer load end')
}

document.addEventListener('DOMContentLoaded', load)

