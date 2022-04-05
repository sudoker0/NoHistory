var storage = () => browser.storage.local
var qSel = (selector: string) => document.querySelector(selector) as HTMLElement;

const default_setting = {
    versionNumber: browser.runtime.getManifest().version,
    darkmode: false,
    animation: true,
    statusBadge: true,
}

const urlButton = qSel("#thispage");
const optionPage = qSel("#managenohistory");

const tabButton = qSel("#makethetab");

const tabStatus = qSel("#status_of_tab");
const urlStatus = qSel("#status_of_url");

// {a: 1, b: 3, d: 2}; {a: 3, c: 4, d: 2} => { a: 1, c: 4, d: 2 }
function migrateObj(oldObj: Object, newObj: Object): Object {
    oldObj = Object.keys(newObj).reduce((acc, key) => ({ ...acc, [key]: oldObj[key] == null || oldObj[key] == undefined ? newObj[key] : oldObj[key] }), {})
    return oldObj;
}

// Is the two array equal?
function areArraysEqualSets (a1: string[], a2: string[]) {
    const superSet = {};
    for (const i of a1) {
        const e = i + typeof i;
        superSet[e] = 1;
    }
    for (const i of a2) {
        const e = i + typeof i;
        if (!superSet[e]) {
            return false;
        }
        superSet[e] = 2;
    }
    for (let e in superSet) {
        if (superSet[e] === 1) {
            return false;
        }
    }
    return true;
}

async function updateConf() {
    const oldConf = (await browser.storage.local.get("nohistory_setting"))["nohistory_setting"];
    const currentVersionNumber = browser.runtime.getManifest().version
    if (oldConf != undefined && (oldConf?.versionNumber != currentVersionNumber || !areArraysEqualSets(Object.keys(oldConf), Object.keys(default_setting)))) {
        var migratedObj = migrateObj(oldConf, default_setting);
        migratedObj["versionNumber"] = currentVersionNumber;
        await browser.storage.local.set({nohistory_setting: migratedObj});
    }
}

// Since there are two button in the popup page for adding and removing URL, this function will decide what button to show based on if of the current URL exist in the URl list.
async function isURLExist() {
    const result = await browser.runtime.sendMessage("isURLExist");
    if (result) {
        urlButton.innerText = "Remove this page from NoHistory"
        urlStatus.innerText = "NO";
        urlStatus.classList.add("no");
    } else {
        urlButton.innerText = "Add this page to NoHistory"
        urlStatus.innerText = "YES";
        urlStatus.classList.remove("no");
    }
}

// Just like the function above, but for tab instead.
async function isTabExist() {
    const result = await browser.runtime.sendMessage("isTabExist");
    if (result) {
        tabButton.innerText = "Enable saving links from this tab to history"
        tabStatus.innerText = "NO";
        tabStatus.classList.add("no");
    } else {
        tabButton.innerText = "Disable saving links from this tab to history"
        tabStatus.innerText = "YES";
        tabStatus.classList.remove("no");
    }
}

window.addEventListener('load', async () => {
    qSel("#versionNumber").innerText = browser.runtime.getManifest().version + (browser.runtime.id.includes("@temporary-addon") ? " (If you don't know what you are doing, please install this extension in a normal way.)" : "");
    await isURLExist();
    await isTabExist();
    await updateConf();
    const currentURL: string = await browser.runtime.sendMessage("getCurrentURL");
    const urlObj = new URL(currentURL);

    const currentTabId: number = await browser.runtime.sendMessage("getCurrentTabId");

    // Check if the current URL valid.
    if (urlObj.hostname.trim() == "" || !(urlObj.protocol.match(/^https?:$/)?.length > 0))
        // Show the error
        qSel("#error_cannotChange").classList.remove("hidden_by_default");
    else
        qSel("#hidden_wrapper").classList.remove("hidden_by_default");

    // Set the current URL and the tab ID on the popup page
    qSel("#page_currently_on").innerText = urlObj.hostname;
    qSel("#id_of_tab").innerText = currentTabId.toString();
    const setting = await browser.storage.local.get("nohistory_setting");
    if (setting?.nohistory_setting == null) {
        await browser.storage.local.set({
            nohistory_setting: default_setting
        });
    }
    if (setting?.nohistory_setting?.darkmode) {
        document.body.classList.add("dark_mode");
        document.body.classList.remove("light_mode");
    } else {
        document.body.classList.remove("dark_mode");
        document.body.classList.add("light_mode");
    }
});

urlButton.addEventListener("click", async () => {
    const result = await browser.runtime.sendMessage("isURLExist");
    await browser.runtime.sendMessage(result ? "removeItem" : "addItem");
    await isURLExist();
})

tabButton.addEventListener("click", async () => {
    const result = await browser.runtime.sendMessage("isTabExist");
    await browser.runtime.sendMessage(result ? "removeTab" : "addTab");
    await isTabExist();
})

optionPage.addEventListener("click", async () => {
    await browser.runtime.openOptionsPage();
})
