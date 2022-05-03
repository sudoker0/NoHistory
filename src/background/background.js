function storage() { return browser.storage.local; }
;
async function storage_get(key) {
    var _a;
    const result = await storage().get(key);
    return (_a = result[key]) !== null && _a !== void 0 ? _a : false;
}
(async () => {
    const urlList = (await storage_get("nohistory_urlList")) || [];
    const patternList = (await storage_get("nohistory_patternList")) || [];
    if (urlList.length == 0) {
        await storage().set({
            "nohistory_urlList": [],
        });
    }
    if (patternList.length == 0) {
        await storage().set({
            "nohistory_patternList": [],
        });
    }
})();
const tabIdList = [];
function escapeString(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
async function manageLinkInNH(mode, link) {
    const urlList = (await storage_get("nohistory_urlList")) || [];
    var link_url = new URL(link);
    if (link_url.hostname.trim() == "" || !(link_url.protocol.match(/^https?:$/).length > 0))
        return;
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
        var tabs = await browser.tabs.query({ currentWindow: true, active: true });
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
                const urlList = (await storage_get("nohistory_urlList")) || [];
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
        const urlList = await storage_get("nohistory_urlList");
        const patternList = await storage_get("nohistory_patternList");
        if (urlList.some(url => url == new URL(tab.url).hostname) ||
            tabIdList.some(id => id == tabId) ||
            patternList.some(pattern => {
                switch (pattern.type) {
                    case "string":
                        return tab.title.indexOf(`${pattern.pattern}`) != -1;
                    case "regex":
                        return tab.title.match(pattern.pattern) != null;
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
    var _a;
    const setting = await storage_get("nohistory_setting");
    if (!setting.statusBadge)
        return;
    const cond_1 = tabIdList.some(id => id == e.tabId);
    var tabs = await browser.tabs.query({ currentWindow: true, active: true });
    let urlList = await storage_get("nohistory_urlList");
    const cond_2 = urlList.some(url => url == new URL(tabs[0].url).hostname);
    var pattern = await storage_get("nohistory_patternList");
    var patternList = pattern.nohistory_patternList || [];
    const cond_3 = patternList.some(pattern => {
        switch (pattern.type) {
            case "string":
                return tabs[0].title.indexOf(`${pattern.pattern}`) != -1;
            case "regex":
                return tabs[0].title.match(pattern.pattern) != null;
            default:
                return false;
        }
    });
    var rating = [0, 0, 0];
    if (cond_2)
        rating[0] = 1;
    if (cond_1)
        rating[1] = 1;
    if (cond_3)
        rating[2] = 1;
    var final_rating = rating.join("");
    var tab = (await browser.tabs.query({ currentWindow: true, active: true }))[0];
    const urlObj = new URL(tab.url);
    if (urlObj.hostname.trim() == "" || !(((_a = urlObj.protocol.match(/^https?:$/)) === null || _a === void 0 ? void 0 : _a.length) > 0)) {
        browser.browserAction.setBadgeText({ text: "?" });
        browser.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
        browser.browserAction.setBadgeTextColor({ color: [0, 0, 0, 255] });
    }
    else {
        browser.browserAction.setBadgeText({ text: final_rating });
        browser.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 255] });
        browser.browserAction.setBadgeTextColor({ color: [255, 255, 255, 255] });
    }
});
//# sourceMappingURL=background.js.map