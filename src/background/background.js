function storage() { return browser.storage.local; }
;
async function storage_get(key) {
    var _a;
    const result = await storage().get(key);
    return (_a = result[key]) !== null && _a !== void 0 ? _a : false;
}
const tabIdList = [];
function doesTabExist(tabId) {
    const check = tabIdList.some(id => id == tabId);
    console.log(`doesTabExist\ntabId: ${tabId}\ncheck: ${check}`);
    return check;
}
async function doesURLExist(url) {
    const urlList = await storage_get("nohistory_urlList");
    const check = urlList.some(u => u == new URL(url).hostname);
    console.log(`doesURLExist\nURL: ${url}\ncheck: ${check}`);
    return check;
}
async function doesTitleExist(title) {
    const pattern = await storage_get("nohistory_patternList");
    return pattern.some(pattern => {
        switch (pattern.type) {
            case "string":
                var check_str = title.indexOf(`${pattern.pattern}`);
                console.log(`doesTitleExist\ntype: string\ntitle: ${title}\ncheck: ${check_str}`);
                return check_str != -1;
            case "regex":
                var check_re = title.match(pattern.pattern);
                console.log(`doesTitleExist\ntype: regex\ntitle: ${title}\ncheck: ${check_re}`);
                return check_re != null;
            default:
                return false;
        }
    });
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
browser.history.onTitleChanged.addListener(async (data) => {
    const check = await doesTitleExist(data.title);
    if (check)
        await browser.history.deleteUrl({ url: data.url });
    console.log(`history.onTitleChanged:\nnew_title: ${data.title}\ncheck: ${check}`);
});
browser.history.onVisited.addListener(async (history_data) => {
    const check = await doesURLExist(history_data.url) || await doesTitleExist(history_data.title);
    if (check) {
        await browser.history.deleteUrl({ url: history_data.url });
        console.log(`History Listener: Cleared ${history_data.url}`);
    }
    console.log(`history.onVisited:\nurl: ${history_data.url}\ntitle: ${history_data.title}\ncheck: ${check}`);
});
browser.tabs.onUpdated.addListener(async (e) => {
    var _a;
    const setting = await storage_get("nohistory_setting");
    const check = doesTabExist(e);
    if (!setting.statusBadge) {
        browser.browserAction.setBadgeText({ text: "" });
        return;
    }
    ;
    var tabs = await browser.tabs.query({ currentWindow: true, active: true });
    if (check) {
        console.log(`Tab Listener\nTab is in the tab list\nDeleted: ${tabs[0].url}`);
        await browser.history.deleteUrl({ url: tabs[0].url });
    }
    var rating = [0, 0, 0];
    if (await doesURLExist(tabs[0].url))
        rating[0] = 1;
    if (doesTabExist(e))
        rating[1] = 1;
    if (await doesTitleExist(tabs[0].title))
        rating[2] = 1;
    var final_rating = rating.join("");
    const urlObj = new URL(tabs[0].url);
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
    console.log(`tabs.onUpdated\ntabId: ${e}\ncheck: ${check}\nurl:${tabs[0].url}`);
});
//# sourceMappingURL=background.js.map