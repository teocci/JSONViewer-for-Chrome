var port = chrome.runtime.connect();

function initSource() {
    var bgPage = chrome.extension.getBackgroundPage();
    bgPage.getRawDataURL();

    port.postMessage({
        onSourceInit: true
    });

    port.onMessage.addListener(function (msg) {
        port.onMessage.addListener(function (msg) {
            if (msg.loadRawData) {
                var rawData = msg.rawData;
                if (rawData) {
                    document.body.innerHTML = rawData;
                }
            }
        });
    });
}

addEventListener('load', initSource, false);
