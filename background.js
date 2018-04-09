chrome.storage.sync.get('added_links', function (obj) {
    let pending_count = obj.added_links.length;
    chrome.browserAction.setBadgeBackgroundColor({ color: '#c43735' });
    chrome.browserAction.setBadgeText({ text: pending_count.toString() });
});