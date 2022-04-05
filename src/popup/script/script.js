var storage = () => browser.storage.local;
var qSel = (selector) => document.querySelector(selector);
const default_setting = {
    versionNumber: browser.runtime.getManifest().version,
    darkmode: false,
    animation: true,
    statusBadge: true,
};
const urlButton = qSel("#thispage");
const optionPage = qSel("#managenohistory");
const tabButton = qSel("#makethetab");
const tabStatus = qSel("#status_of_tab");
const urlStatus = qSel("#status_of_url");
function migrateObj(oldObj, newObj) {
    oldObj = Object.keys(newObj).reduce((acc, key) => (Object.assign(Object.assign({}, acc), { [key]: oldObj[key] == null || oldObj[key] == undefined ? newObj[key] : oldObj[key] })), {});
    return oldObj;
}
function areArraysEqualSets(a1, a2) {
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
    const currentVersionNumber = browser.runtime.getManifest().version;
    if (oldConf != undefined && ((oldConf === null || oldConf === void 0 ? void 0 : oldConf.versionNumber) != currentVersionNumber || !areArraysEqualSets(Object.keys(oldConf), Object.keys(default_setting)))) {
        var migratedObj = migrateObj(oldConf, default_setting);
        migratedObj["versionNumber"] = currentVersionNumber;
        await browser.storage.local.set({ nohistory_setting: migratedObj });
    }
}
async function isURLExist() {
    const result = await browser.runtime.sendMessage("isURLExist");
    if (result) {
        urlButton.innerText = "Remove this page from NoHistory";
        urlStatus.innerText = "NO";
        urlStatus.classList.add("no");
    }
    else {
        urlButton.innerText = "Add this page to NoHistory";
        urlStatus.innerText = "YES";
        urlStatus.classList.remove("no");
    }
}
async function isTabExist() {
    const result = await browser.runtime.sendMessage("isTabExist");
    if (result) {
        tabButton.innerText = "Enable saving links from this tab to history";
        tabStatus.innerText = "NO";
        tabStatus.classList.add("no");
    }
    else {
        tabButton.innerText = "Disable saving links from this tab to history";
        tabStatus.innerText = "YES";
        tabStatus.classList.remove("no");
    }
}
window.addEventListener('load', async () => {
    var _a, _b;
    qSel("#versionNumber").innerText = browser.runtime.getManifest().version + (browser.runtime.id.includes("@temporary-addon") ? " (If you don't know what you are doing, please install this extension in a normal way.)" : "");
    await isURLExist();
    await isTabExist();
    await updateConf();
    const currentURL = await browser.runtime.sendMessage("getCurrentURL");
    const urlObj = new URL(currentURL);
    const currentTabId = await browser.runtime.sendMessage("getCurrentTabId");
    if (urlObj.hostname.trim() == "" || !(((_a = urlObj.protocol.match(/^https?:$/)) === null || _a === void 0 ? void 0 : _a.length) > 0))
        qSel("#error_cannotChange").classList.remove("hidden_by_default");
    else
        qSel("#hidden_wrapper").classList.remove("hidden_by_default");
    qSel("#page_currently_on").innerText = urlObj.hostname;
    qSel("#id_of_tab").innerText = currentTabId.toString();
    const setting = await browser.storage.local.get("nohistory_setting");
    if ((setting === null || setting === void 0 ? void 0 : setting.nohistory_setting) == null) {
        await browser.storage.local.set({
            nohistory_setting: default_setting
        });
    }
    if ((_b = setting === null || setting === void 0 ? void 0 : setting.nohistory_setting) === null || _b === void 0 ? void 0 : _b.darkmode) {
        document.body.classList.add("dark_mode");
        document.body.classList.remove("light_mode");
    }
    else {
        document.body.classList.remove("dark_mode");
        document.body.classList.add("light_mode");
    }
});
urlButton.addEventListener("click", async () => {
    const result = await browser.runtime.sendMessage("isURLExist");
    await browser.runtime.sendMessage(result ? "removeItem" : "addItem");
    await isURLExist();
});
tabButton.addEventListener("click", async () => {
    const result = await browser.runtime.sendMessage("isTabExist");
    await browser.runtime.sendMessage(result ? "removeTab" : "addTab");
    await isTabExist();
});
optionPage.addEventListener("click", async () => {
    await browser.runtime.openOptionsPage();
});
//# sourceMappingURL=script.js.map