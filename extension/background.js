import './js/workerFormatter.js'

let options, theme, path,
    value,
    copyPathMenuEntryId,
    copyValueMenuEntryId,
    rawData

function getDefaultTheme(callback) {
    fetch('assets/css/jsonview.css')
        .then(response => {
            if (response.ok) return response.text()
            else throw new Error('Failed to fetch default theme.')
        })
        .then(text => {
            callback(text)
        })
        .catch(error => {
            console.error(error)
        })
}

function copy(value) {
    if (value) return
    navigator.clipboard.writeText(value)
        .then(() => {
            console.log('Text copied to clipboard')
        })
        .catch((error) => {
            console.error('Error copying text to clipboard:', error)
        })
}

function onMenuClick(info) {
    switch (info.menuItemId) {
        case 'copy-path-cm':
            // Radio item function
            copy(path)
            break;
        case 'copy-value-cm':
            // Checkbox item function
            copy(value)
            break;
        default:
            // Standard context menu item function
            console.log('Standard context menu item clicked.');
    }
}

const refreshMenuEntry = () => {
    chrome.contextMenus.onClicked.addListener(onMenuClick);

    if (options.addContextMenu && !copyPathMenuEntryId) {
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
    }

    if (!options.addContextMenu && copyPathMenuEntryId) {
        chrome.contextMenus.remove(copyPathMenuEntryId)
        chrome.contextMenus.remove(copyValueMenuEntryId)
        copyPathMenuEntryId = null
    }
}

const getRawDataURL = () => {
    chrome.runtime.onConnect.addListener(port => {
        port.postMessage({
            loadRawData: true,
            rawData: rawData
        })
    })
}

const init = () => {
    chrome.runtime.onConnect.addListener(async port => {
        console.log('Connected to port:', port.name)

        options = await chrome.storage.local.get('options')
        if (options.addContextMenu == null) {
            options.addContextMenu = true
            await chrome.storage.local.set({options})
        }

        theme = await chrome.storage.local.get('theme')
        if (theme == null) {
            getDefaultTheme(async theme => {
                await chrome.storage.local.set({theme})
            })
        }

        port.onMessage.addListener(msg => {
            const json = msg.json
            let workerFormatter, workerJSONLint

            const onWorkerJSONLintMessage = e => {
                const message = JSON.parse(e.data)
                workerJSONLint.removeEventListener('message', onWorkerJSONLintMessage, false)
                workerJSONLint.terminate()
                port.postMessage({
                    onGetError: true,
                    error: message.error,
                    loc: message.loc,
                    offset: msg.offset
                })
            }

            const onWorkerFormatterMessage = e => {
                const message = e.data
                workerFormatter.removeEventListener('message', onWorkerFormatterMessage, false)
                workerFormatter.terminate()
                if (message.html)
                    port.postMessage({
                        onJsonToHTML: true,
                        html: message.html,
                        theme: theme
                    })
                if (message.error) {
                    workerJSONLint = new Worker('js/workerJSONLint.js')
                    workerJSONLint.addEventListener('message', onWorkerJSONLintMessage, false)
                    workerJSONLint.postMessage(json)
                }
            }
            switch (true) {
                case msg.init:
                    refreshMenuEntry()
                    rawData = msg.rawData
                    port.postMessage({
                        onInit: true,
                        options: options ?? {}
                    })
                    break

                case msg.copyPropertyPath:
                    path = msg.path
                    value = msg.value
                    break
            }
        })
    })
}

init()