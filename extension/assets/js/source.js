var port = chrome.runtime.connect();
var code = document.getElementById('raw_data');

function initSource() {
    var bgPage = chrome.extension.getBackgroundPage();
    bgPage.getRawDataURL();

    port.postMessage({
        onSourceInit: true
    });

    port.onMessage.addListener(function (msg) {
        if (msg.loadRawData) {
            var rawData = msg.rawData;
            if (rawData) {
                if (code) {
                    code.innerHTML = rawData;
                }
            }
        }
    });
}

addEventListener('load', initSource, false);
