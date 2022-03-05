const default_setting = {
    versionNumber: browser.runtime.getManifest().version,
    darkmode: false,
    animation: true,
    statusBadge: true,
};
const addButton = document.getElementById("addthispage");
const removeButton = document.getElementById("removethispage");
const optionPage = document.getElementById("managenohistory");
const addTab = document.getElementById("makethetabnohistory");
const removeTab = document.getElementById("makethetabyeshistory");
const tabStatus = document.getElementById("status_of_tab");
const urlStatus = document.getElementById("status_of_url");
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
    const result = await browser.runtime.sendMessage("isRemoveNotClicked");
    if (result) {
        addButton.classList.add("button_off");
        removeButton.classList.remove("button_off");
        urlStatus.innerHTML = "NO";
        urlStatus.classList.add("no");
    }
    else {
        addButton.classList.remove("button_off");
        removeButton.classList.add("button_off");
        urlStatus.innerHTML = "YES";
        urlStatus.classList.remove("no");
    }
}
async function isTabExist() {
    const result = await browser.runtime.sendMessage("isTabExist");
    if (result) {
        addTab.classList.add("button_off");
        removeTab.classList.remove("button_off");
        tabStatus.innerHTML = "NO";
        tabStatus.classList.add("no");
    }
    else {
        addTab.classList.remove("button_off");
        removeTab.classList.add("button_off");
        tabStatus.innerHTML = "YES";
        tabStatus.classList.remove("no");
    }
}
window.addEventListener('load', async () => {
    var _a, _b;
    document.getElementById("versionNumber").innerHTML = browser.runtime.getManifest().version;
    await isURLExist();
    await isTabExist();
    await updateConf();
    const currentURL = await browser.runtime.sendMessage("getCurrentURL");
    const urlObj = new URL(currentURL);
    const currentTabId = await browser.runtime.sendMessage("getCurrentTabId");
    if (urlObj.hostname.trim() == "" || !(((_a = urlObj.protocol.match(/^https?:$/)) === null || _a === void 0 ? void 0 : _a.length) > 0))
        document.getElementById("error_cannotChange").classList.remove("hidden_by_default");
    else
        document.getElementById("hidden_wrapper").classList.remove("hidden_by_default");
    document.getElementById("page_currently_on").innerText = urlObj.hostname;
    document.getElementById("id_of_tab").innerText = currentTabId.toString();
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
addButton.addEventListener("click", async () => {
    await browser.runtime.sendMessage("addItem");
    await isURLExist();
});
removeButton.addEventListener("click", async () => {
    await browser.runtime.sendMessage("removeItem");
    await isURLExist();
});
addTab.addEventListener("click", async () => {
    await browser.runtime.sendMessage("addTab");
    await isTabExist();
});
removeTab.addEventListener("click", async () => {
    await browser.runtime.sendMessage("removeTab");
    await isTabExist();
});
optionPage.addEventListener("click", async () => {
    await browser.runtime.openOptionsPage();
});
//# sourceMappingURL=script.js.map