function storage() { return browser.storage.local };

async function storage_get(key: string): Promise<any | false> {
    const result = await storage().get(key)
    return result[key] ?? false
}

(async() => {
    const urlList: string[] = (await storage_get("nohistory_urlList")) || [];
    const patternList: Pattern[] = (await storage_get("nohistory_patternList")) || [];

    if (urlList.length == 0) {
        // Create the URL list in the browser storage
        await storage().set({
            "nohistory_urlList": [],
        })
    }

    if (patternList.length == 0) {
        // Create the pattern list in the browser storage
        await storage().set({
            "nohistory_patternList": [],
        })
    }
})()

const tabIdList: number[] = [];

function escapeString(str: string) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// Add or remove link from the URL list in the browser storage
async function manageLinkInNH(mode: number, link: string) {
    // Get the URL list
    const urlList: string[] = (await storage_get("nohistory_urlList")) || [];
    var link_url = new URL(link);
    // Is the provided link a valid one (check if it's empty or the protocol isn't http:// or https://)
    if (link_url.hostname.trim() == "" || !(link_url.protocol.match(/^https?:$/).length > 0)) return;
    switch (mode) {
        case 0: // Add
            urlList.push(link_url.hostname);
            break;
        case 1: // Remove
            urlList.splice(urlList.indexOf(link_url.hostname), 1);
            break;
        default:
            break;
    }
    // Put the new URL list in the browser storage
    await storage().set({nohistory_urlList: urlList});
}

// Handle messages from the popup script
browser.runtime.onMessage.addListener(async (sentMessage, _0, _1) => {
    return new Promise(async (resolve, reject) => {
        var tabs = await browser.tabs.query({currentWindow: true, active: true})
        let tab = tabs[0]; // Safe to assume there will only be one result
        switch (sentMessage) {
            case "addItem": // Add current links to the URL list in the browser storage
                await manageLinkInNH(0, tab.url);
                resolve(null);
                break;
            case "removeItem": // Remove current links from the URL list in the browser storage
                await manageLinkInNH(1, tab.url);
                resolve(null);
                break;
            case "addTab": // Add current tab to the tab list
                tabIdList.push(tab.id);
                resolve(null);
                break;
            case "removeTab": // Remove current tab from the tab list
                tabIdList.splice(tabIdList.indexOf(tab.id), 1);
                resolve(null);
                break;
            case "isURLExist": // Check if the url exist in the URL list in the browser storage
                const urlList: string[] = (await storage_get("nohistory_urlList")) || [];
                resolve(urlList.some(url => url == new URL(tab.url).hostname));
                break;
            case "isTabExist": // Check if the tab exist in the tab list
                resolve(tabIdList.some(id => id == tab.id));
                break;
            case "getCurrentURL":
                resolve(tab.url);
                break;
            case "getCurrentTabId":
                resolve(tab.id);
                break;
            default: // Just a nice error handler
                reject(false);
                break;
        }
    })
})

// Remove the closed tab from the tab list
browser.tabs.onRemoved.addListener((tabId) => {
    tabIdList.splice(tabIdList.indexOf(tabId), 1);
})


browser.tabs.onUpdated.addListener((tabId, _0, tab) => {
    return new Promise(async (resolve, _) => {
        const urlList: string[] = await storage_get("nohistory_urlList");
        const patternList: Pattern[] = await storage_get("nohistory_patternList");

        // Check if the current URL is in the URL list OR if the tab is in the tab list
        if (
            urlList.some(url => url == new URL(tab.url).hostname) ||
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
            // Delete the current URL from history
            await browser.history.deleteUrl({url: tab.url});
            resolve(true);
        }
    })
});

// Handle the badge text (the number on the top-right of the extension icon)
browser.tabs.onActivated.addListener(async (e) => {
    const setting: Settings = await storage_get("nohistory_setting");
    if (!setting.statusBadge) return;
    // Does the tab exist in the tab list?
    const cond_1 = tabIdList.some(id => id == e.tabId)

    var tabs = await browser.tabs.query({currentWindow: true, active: true})
    let urlList: string[] = await storage_get("nohistory_urlList");
    // Does the current URL exist in the URL list?
    const cond_2 = urlList.some(url => url == new URL(tabs[0].url).hostname)

    var pattern = await storage_get("nohistory_patternList");
    var patternList: Pattern[] = pattern.nohistory_patternList || [];
    const cond_3 = patternList.some(pattern => {
        switch (pattern.type) {
            case "string":
                return tabs[0].title.indexOf(`${pattern.pattern}`) != -1;
            case "regex":
                return tabs[0].title.match(pattern.pattern) != null;
            default:
                return false;
        }
    })

    var rating: number[] = [0, 0, 0];
    if (cond_2) rating[0] = 1;
    if (cond_1) rating[1] = 1;
    if (cond_3) rating[2] = 1;
    var final_rating = rating.join("");
    var tab = (await browser.tabs.query({currentWindow: true, active: true}))[0]
    const urlObj = new URL(tab.url);
    if (urlObj.hostname.trim() == "" || !(urlObj.protocol.match(/^https?:$/)?.length > 0)) {
        browser.browserAction.setBadgeText({ text: "?" });
        browser.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
        browser.browserAction.setBadgeTextColor({ color: [0, 0, 0, 255] });
    } else {
        browser.browserAction.setBadgeText({ text: final_rating });
        browser.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 255] });
        browser.browserAction.setBadgeTextColor({ color: [255, 255, 255, 255] });
    }
})