const port = chrome.runtime.connect({name: 'source-channel'})
const $code = document.getElementById('raw_data')

function load() {
    port.postMessage({
        type: 'load-raw-data',
        target: 'background',
    })

    port.onMessage.addListener(msg => {
        if (msg.type !== 'on-load-raw-data') return
        if (!msg.rawData || !$code) return

        $code.innerHTML = JSON.stringify(JSON.parse(msg.rawData))
    })
}

document.addEventListener('DOMContentLoaded', load)
