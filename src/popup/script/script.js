function storage() { return browser.storage.local; }
;
async function storage_get(key) {
    var _a;
    const result = await storage().get(key);
    return (_a = result[key]) !== null && _a !== void 0 ? _a : false;
}
function qSel(selector) {
    return document.querySelector(selector);
}
function qSelAll(selector) {
    return document.querySelectorAll(selector);
}
var validURL = true;
const default_setting = {
    versionNumber: browser.runtime.getManifest().version,
    darkmode: true,
    animation: true,
    statusBadge: true,
};
const urlButton = qSel("#thispage");
const tabButton = qSel("#makethetab");
const optionPage = qSel("#managenohistory");
const tools = qSel("#tools");
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
    const oldConf = await storage_get("nohistory_setting");
    const currentVersionNumber = browser.runtime.getManifest().version;
    if (oldConf != undefined && ((oldConf === null || oldConf === void 0 ? void 0 : oldConf.versionNumber) != currentVersionNumber || !areArraysEqualSets(Object.keys(oldConf), Object.keys(default_setting)))) {
        var migratedObj = migrateObj(oldConf, default_setting);
        migratedObj["versionNumber"] = currentVersionNumber;
        await storage().set({ nohistory_setting: migratedObj });
    }
}
function toggleButton(button, on) {
    if (!validURL)
        return false;
    button.querySelector(".on").classList[on ? "remove" : "add"]("not");
    button.querySelector(".off").classList[on ? "add" : "remove"]("not");
    button.style.setProperty("--current-status-color", on ? "var(--button-disabled)" : "var(--button-enabled)");
}
async function isURLExist() {
    const result = await browser.runtime.sendMessage("isURLExist");
    urlButton.title = `Is this URL going to be saved to history? ${result ? "No" : "Yes"}`;
    toggleButton(urlButton, result);
}
async function isTabExist() {
    const result = await browser.runtime.sendMessage("isTabExist");
    tabButton.title = `Is every single link in this tab going to be saved to history? ${result ? "No" : "Yes"}`;
    toggleButton(tabButton, result);
}
window.addEventListener('load', async () => {
    var _a;
    qSel("#versionNumber").innerText = browser.runtime.getManifest().version + (browser.runtime.id.includes("@temporary-addon") ? " (If you don't know what you are doing, please install this extension in a normal way.)" : "");
    await isURLExist();
    await isTabExist();
    await updateConf();
    const currentURL = await browser.runtime.sendMessage("getCurrentURL");
    const urlObj = new URL(currentURL);
    const currentTabId = await browser.runtime.sendMessage("getCurrentTabId");
    if (urlObj.hostname.trim() == "" || !(((_a = urlObj.protocol.match(/^https?:$/)) === null || _a === void 0 ? void 0 : _a.length) > 0)) {
        qSel("#error_cannotChange").classList.remove("hidden_by_default");
        qSelAll(".depend_on_url").forEach(v => v.classList.add("grayed_out"));
        validURL = false;
    }
    else {
        qSel("#hidden_wrapper").classList.remove("hidden_by_default");
        qSelAll(".depend_on_url").forEach(v => v.classList.remove("grayed_out"));
        validURL = true;
    }
    qSel("#page_currently_on").innerText = urlObj.hostname;
    qSel("#id_of_tab").innerText = currentTabId.toString();
    const setting = await storage_get("nohistory_setting");
    if (setting == null) {
        await storage().set({
            nohistory_setting: default_setting
        });
    }
    if (setting === null || setting === void 0 ? void 0 : setting.darkmode) {
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
    window.close();
});
tools.addEventListener("click", async () => {
    await browser.tabs.create({
        url: "/tools/index.html"
    });
    window.close();
});
//# sourceMappingURL=script.js.map