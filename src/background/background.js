const tabIdList = [];
var storage = () => browser.storage.local;
function escapeString(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
async function manageLinkInNH(mode, link) {
    const result = await storage().get("nohistory_urlList");
    var link_url = new URL(link);
    if (link_url.hostname.trim() == "" || !(link_url.protocol.match(/^https?:$/).length > 0))
        return;
    let urlList = result.nohistory_urlList || [];
    switch (mode) {
        case 0:
            urlList.push(link_url.hostname);
            break;
        case 1:
            urlList.splice(urlList.indexOf(link_url.hostname), 1);
            break;
        default:
            break;
    }
    await storage().set({ nohistory_urlList: urlList });
}
browser.runtime.onMessage.addListener(async (sentMessage, _0, _1) => {
    return new Promise(async (resolve, reject) => {
        const tabs = await browser.tabs.query({ currentWindow: true, active: true });
        let tab = tabs[0];
        switch (sentMessage) {
            case "addItem":
                await manageLinkInNH(0, tab.url);
                resolve(null);
                break;
            case "removeItem":
                await manageLinkInNH(1, tab.url);
                resolve(null);
                break;
            case "addTab":
                tabIdList.push(tab.id);
                resolve(null);
                break;
            case "removeTab":
                tabIdList.splice(tabIdList.indexOf(tab.id), 1);
                resolve(null);
                break;
            case "isURLExist":
                const result = await storage().get("nohistory_urlList");
                let urlList = result.nohistory_urlList || [];
                resolve(urlList.some(url => url == new URL(tab.url).hostname));
                break;
            case "isTabExist":
                resolve(tabIdList.some(id => id == tab.id));
                break;
            case "getCurrentURL":
                resolve(tab.url);
                break;
            case "getCurrentTabId":
                resolve(tab.id);
                break;
            default:
                reject(false);
                break;
        }
    });
});
browser.tabs.onRemoved.addListener((tabId) => {
    tabIdList.splice(tabIdList.indexOf(tabId), 1);
});
browser.tabs.onUpdated.addListener((tabId, _0, tab) => {
    return new Promise(async (resolve, _) => {
        const url_list = await storage().get("nohistory_urlList");
        const pattern_list = await storage().get("nohistory_patternList");
        let urlList = url_list.nohistory_urlList || [];
        let patternList = pattern_list.nohistory_patternList || [];
        if ((url_list === null || url_list === void 0 ? void 0 : url_list.nohistory_urlList) == null) {
            await storage().set({
                "nohistory_urlList": [],
            });
        }
        if ((pattern_list === null || pattern_list === void 0 ? void 0 : pattern_list.nohistory_patternList) == null) {
            await storage().set({
                "nohistory_patternList": [],
            });
        }
        if (urlList.some(url => url == new URL(tab.url).hostname) ||
            tabIdList.some(id => id == tabId) || patternList.some(pattern => {
            switch (pattern.type) {
                case "string":
                    return tab.url.indexOf(`${pattern.pattern}`) != -1;
                case "regex":
                    return tab.url.match(pattern.pattern) != null;
                default:
                    return false;
            }
        })) {
            await browser.history.deleteUrl({ url: tab.url });
            resolve(true);
        }
    });
});
browser.tabs.onActivated.addListener(async (e) => {
    const setting = await storage().get("nohistory_setting");
    if (!setting.nohistory_setting.statusBadge)
        return;
    const cond_1 = tabIdList.some(id => id == e.tabId);
    const tabs = await browser.tabs.query({ currentWindow: true, active: true });
    const result = await storage().get("nohistory_urlList");
    let urlList = result.nohistory_urlList || [];
    const cond_2 = urlList.some(url => url == new URL(tabs[0].url).hostname);
    var color = [0, 0, 0, 0];
    var rating = "";
    if (!cond_1 && !cond_2) {
        color = [255, 0, 0, 255];
        rating = "00";
    }
    else if (cond_1 && !cond_2) {
        color = [255, 128, 0, 255];
        rating = "01";
    }
    else if (!cond_1 && cond_2) {
        color = [255, 128, 0, 255];
        rating = "10";
    }
    else {
        color = [0, 128, 0, 255];
        rating = "11";
    }
    browser.browserAction.setBadgeText({ text: rating });
    browser.browserAction.setBadgeBackgroundColor({ color: color });
    browser.browserAction.setBadgeTextColor({ color: [255, 255, 255, 255] });
});
//# sourceMappingURL=background.js.map