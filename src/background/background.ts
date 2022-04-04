const tabIdList: number[] = [];
var storage = () => browser.storage.local

function escapeString(str: string) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// Add or remove link from the URL list in the browser storage
async function manageLinkInNH(mode: number, link: string) {
    // Get the URL list
    const result = await storage().get("nohistory_urlList")
    var link_url = new URL(link);
    // Is the provided link a valid one (check if it's empty or the protocol isn't http:// or https://)
    if (link_url.hostname.trim() == "" || !(link_url.protocol.match(/^https?:$/).length > 0)) return;
    let urlList = result.nohistory_urlList || [];
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
        const tabs = await browser.tabs.query({currentWindow: true, active: true})
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
            case "isRemoveNotClicked": // Check if the url exist in the URL list in the browser storage
                const result = await storage().get("nohistory_urlList");
                let urlList: string[] = result.nohistory_urlList || [];
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
        const url_list = await storage().get("nohistory_urlList");
        const pattern_list = await storage().get("nohistory_patternList");
        let urlList: string[] = url_list.nohistory_urlList || [];
        let patternList: { type: string, pattern: string | RegExp }[] = pattern_list.nohistory_patternList || [];

        if (url_list?.nohistory_urlList == null) {
            // Create the URL list in the browser storage
            await storage().set({
                "nohistory_urlList": [],
            })
        }

        if (pattern_list?.nohistory_patternList == null) {
            // Create the pattern list in the browser storage
            await storage().set({
                "nohistory_patternList": [],
            })
        }

        // Check if the current URL is in the URL list OR if the tab is in the tab list
        if (
            urlList.some(url => url == new URL(tab.url).hostname) ||
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
            // Delete the current URL from history
            await browser.history.deleteUrl({url: tab.url});
            resolve(true);
        }
    })
});

// Handle the badge text (the number on the top-right of the extension icon)
browser.tabs.onActivated.addListener(async (e) => {
    const setting = await storage().get("nohistory_setting");
    if (!setting.nohistory_setting.statusBadge) return;
    // Does the tab exist in the tab list?
    const cond_1 = tabIdList.some(id => id == e.tabId)

    const tabs = await browser.tabs.query({currentWindow: true, active: true})
    const result = await storage().get("nohistory_urlList");
    let urlList: string[] = result.nohistory_urlList || [];
    // Does the current URL exist in the URL list?
    const cond_2 = urlList.some(url => url == new URL(tabs[0].url).hostname)

    var color: browser.browserAction.ColorValue = [0, 0, 0, 0];
    var rating: string = "";

    if (!cond_1 && !cond_2){
        // If the tab doesn't exist in the tab list and the current URL doesn't exist in the URL list
        color = [255, 0, 0, 255];
        rating = "00";
    } else if (cond_1 && !cond_2) {
        // If the tab exist in the tab list and the current URL doesn't exist in the URL list
        color = [255, 128, 0, 255];
        rating = "01"
    } else if (!cond_1 && cond_2) {
        // If the tab doesn't exist in the tab list and the current URL exist in the URL list
        color = [255, 128, 0, 255];
        rating = "10";
    } else {
        // If the tab exist in the tab list and the current URL exist in the URL list
        color = [0, 128, 0, 255];
        rating = "11";
    }

    browser.browserAction.setBadgeText({ text: rating });
    browser.browserAction.setBadgeBackgroundColor({ color: color });
    browser.browserAction.setBadgeTextColor({ color: [255, 255, 255, 255] });
})