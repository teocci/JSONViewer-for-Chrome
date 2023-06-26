import './js/workerFormatter.js'

let isMenuInitialized = false

let options, theme, rawData
let path, value
let copyPathMenuEntryId, copyValueMenuEntryId

const isObjectEmpty = o => o && Object.keys(o).length === 0 && o.constructor === Object
const isNull = o => o === null
const isUndefined = o => o === undefined
const isNil = o => o == null

// function getDefaultTheme(callback) {
//     const cssURL = chrome.runtime.getURL('assets/css/jsonview.css')
//     fetch(cssURL).then(response => {
//         if (response.ok) return response.text()
//         else throw new Error('Failed to fetch default theme.')
//     }).then(text => {
//         console.log(text, {text})
//         callback(text)
//     }).catch(error => {
//         console.error(error)
//     })
// }

async function getDefaultTheme() {
    const cssURL = chrome.runtime.getURL('assets/css/jsonview.css')
    const response = await fetch(cssURL)
    if (!response.ok) throw new Error('Failed to fetch default theme.')
    const text = await response.text()

    console.log('getDefaultTheme', {text})

    return text
}


function copy(value) {
    if (isNil(value)) return

    navigator.clipboard.writeText(value)
        .then(() => {
            console.log('Value copied to clipboard:', value)
        })
        .catch((error) => {
            console.error('Failed to copy value to clipboard:', error)
        })
}

async function executeCopy(value, tab) {
    if (isNil(value)) return

    await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: copy,
        args: [value],
    })
}

async function onMenuClick(info, tab) {
    switch (info.menuItemId) {
        case 'copy-path-cm':
            // Radio item function
            console.log('onMenuClick', {path})
            await executeCopy(path, tab)
            break
        case 'copy-value-cm':
            // Checkbox item function
            console.log('onMenuClick', {value})
            await executeCopy(value, tab)
            break
        default:
            // Standard context menu item function
            console.log('Standard context menu item clicked.')
    }
}

const refreshMenuEntry = () => {
    chrome.contextMenus.onClicked.addListener(onMenuClick)

    if (options.addContextMenu && !isMenuInitialized) {
        copyPathMenuEntryId = chrome.contextMenus.create({
            id: 'copy-path-cm',
            title: 'Copy path',
            contexts: ['page', 'link'],
        })
        copyValueMenuEntryId = chrome.contextMenus.create({
            id: 'copy-value-cm',
            title: 'Copy value',
            contexts: ['page', 'link'],
        })

        isMenuInitialized = !!copyPathMenuEntryId && !!copyValueMenuEntryId
    }

    console.log({copyPathMenuEntryId, copyValueMenuEntryId, isMenuInitialized})

    if (!options.addContextMenu && isMenuInitialized) {
        chrome.contextMenus.remove(copyPathMenuEntryId)
        chrome.contextMenus.remove(copyValueMenuEntryId)
        copyPathMenuEntryId = null
        copyValueMenuEntryId = null
    }
}

const initContentChannel = async port => {
    options = await chrome.storage.local.get('options')
    if (options.addContextMenu == null) {
        options.addContextMenu = true
        await chrome.storage.local.set({options})
    }

    theme = (await chrome.storage.local.get())['theme']
    if (isNil(theme) || isObjectEmpty(theme)) {
        theme = await getDefaultTheme()
        if (!isNil()) await chrome.storage.local.set({theme})
    }
    console.log({theme}, `type of ${typeof theme}`)

    port.onMessage.addListener(msg => {
        console.log('Background-Content[msg][type]', msg.type)
        const type = msg.type
        const json = msg.json
        const target = 'content'
        let workerJSONLint

        const onWorkerJSONLintMessage = e => {
            const message = JSON.parse(e.data)
            workerJSONLint.removeEventListener('message', onWorkerJSONLintMessage, false)
            workerJSONLint.terminate()
            port.postMessage({
                type: 'on-error',
                error: message.error,
                loc: message.loc,
                offset: msg.offset
            })
        }

        switch (type) {
            case 'init':
                rawData = msg.rawData
                refreshMenuEntry()
                port.postMessage({
                    type: 'on-init',
                    target,
                    options: options ?? {}
                })

                break

            case 'copy-property':
                path = msg.path
                value = msg.value
                console.log('copy-property', {path, value})

                break

            case 'formatted-to-html':
                if (msg.html) port.postMessage({
                    type: 'on-json-to-html',
                    target,
                    html: msg.html,
                    theme: theme
                })

                if (msg.error) {
                    // workerJSONLint = new Worker('js/workerJSONLint.js')
                    // workerJSONLint.addEventListener('message', onWorkerJSONLintMessage, false)
                    // workerJSONLint.postMessage(json)
                }
                break

            default:
                console.log(`${type} not supported`)
        }
    })
}

const initSourceChannel = async port => {
    port.onMessage.addListener(msg => {
        console.log('Background-Source[msg][type]', msg.type)
        const type = msg.type
        const target = 'source'

        switch (type) {
            case 'load-raw-data':
                port.postMessage({
                    type: 'on-load-raw-data',
                    target,
                    rawData,
                })

                break

            default:
                console.log(`${type} not supported`)
        }
    })
}

const init = () => {
    chrome.runtime.onConnect.addListener(async port => {
        console.log(`Background[port][name]: ${port.name}`)

        if (port.name === 'content-channel') await initContentChannel(port)
        if (port.name === 'source-channel') await initSourceChannel(port)
    })
}

init()