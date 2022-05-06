function storage() { return browser.storage.local };

async function storage_get(key: string): Promise<any | false> {
    const result = await storage().get(key)
    return result[key] ?? false
}

const tabIdList: number[] = [];

/**
 * `cond_1`: Is the current tab ID in the tab ID list
 * @param tabId The tab ID
 * @returns If it's exist in the tab ID list
 */
function doesTabExist(tabId: number) {
    const check = tabIdList.some(id => id == tabId);
    console.log(`doesTabExist\ntabId: ${tabId}\ncheck: ${check}`)
    return check
}

/**
 * `cond_2`: Check if the current URL is in the URL list
 * @param url The URL to check
 * @returns If the URL is in the URL list
 */
async function doesURLExist(url: string) {
    const urlList: string[] = await storage_get("nohistory_urlList");
    const check = urlList.some(u => u == new URL(url).hostname);
    console.log(`doesURLExist\nURL: ${url}\ncheck: ${check}`)
    return check;
}

/**
 * `cond_3`: Check if the current tab title is in the pattern list
 * @param title The title of the tab
 * @returns If the title is in the pattern list
 */
async function doesTitleExist(title: string) {
    const pattern: Pattern[] = await storage_get("nohistory_patternList");
    return pattern.some(pattern => {
        switch (pattern.type) {
            case "string":
                var check_str = title.indexOf(`${pattern.pattern}`);
                console.log(`doesTitleExist\ntype: string\ntitle: ${title}\ncheck: ${check_str}`)
                return check_str != -1;
            case "regex":
                var check_re = title.match(pattern.pattern);
                console.log(`doesTitleExist\ntype: regex\ntitle: ${title}\ncheck: ${check_re}`)
                return check_re != null;
            default:
                return false;
        }
    });
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

browser.history.onTitleChanged.addListener(async (data) => {
    const check = await doesTitleExist(data.title)
    if (check) await browser.history.deleteUrl({url: data.url});
    console.log(`history.onTitleChanged:\nnew_title: ${data.title}\ncheck: ${check}`);
})

browser.history.onVisited.addListener(async (history_data) => {
    // Check if the current URL is in the URL list OR if the tab is in the tab list
    //tabIdList.some(id => id == tabId)
    const check = await doesURLExist(history_data.url) || await doesTitleExist(history_data.title);
    if (check) {
        // Delete the current URL from history
        await browser.history.deleteUrl({url: history_data.url});
        console.log(`History Listener: Cleared ${history_data.url}`);
    }
    console.log(`history.onVisited:\nurl: ${history_data.url}\ntitle: ${history_data.title}\ncheck: ${check}`);
});

// Handle the badge text (the number on the top-right of the extension icon)
browser.tabs.onUpdated.addListener(async (e) => {
    const setting: Settings = await storage_get("nohistory_setting");
    const check = doesTabExist(e);
    if (!setting.statusBadge) {
        browser.browserAction.setBadgeText({text: ""});
        return;
    };

    var tabs = await browser.tabs.query({currentWindow: true, active: true})

    if (check) {
        console.log(`Tab Listener\nTab is in the tab list\nDeleted: ${tabs[0].url}`)
        await browser.history.deleteUrl({url: tabs[0].url});
    }

    var rating: number[] = [0, 0, 0];
    if (await doesURLExist(tabs[0].url)) rating[0] = 1;
    if (doesTabExist(e)) rating[1] = 1;
    if (await doesTitleExist(tabs[0].title)) rating[2] = 1;
    var final_rating = rating.join("");

    const urlObj = new URL(tabs[0].url);
    if (urlObj.hostname.trim() == "" || !(urlObj.protocol.match(/^https?:$/)?.length > 0)) {
        browser.browserAction.setBadgeText({ text: "?" });
        browser.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
        browser.browserAction.setBadgeTextColor({ color: [0, 0, 0, 255] });
    } else {
        browser.browserAction.setBadgeText({ text: final_rating });
        browser.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 255] });
        browser.browserAction.setBadgeTextColor({ color: [255, 255, 255, 255] });
    }
    console.log(`tabs.onUpdated\ntabId: ${e}\ncheck: ${check}\nurl:${tabs[0].url}`);
})