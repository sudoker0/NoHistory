const default_setting = {
    darkmode: false,
    animation: true,
};
const addButton = document.getElementById("addthispage");
const removeButton = document.getElementById("removethispage");
const optionPage = document.getElementById("managenohistory");
const addTab = document.getElementById("makethetabnohistory");
const removeTab = document.getElementById("makethetabyeshistory");
const tabStatus = document.getElementById("status_of_tab");
const urlStatus = document.getElementById("status_of_url");
browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
    let tab = tabs[0];
    console.log(tab.url);
}, console.error);
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
    await isURLExist();
    await isTabExist();
    const currentURL = await browser.runtime.sendMessage("getCurrentURL");
    const urlObj = new URL(currentURL);
    const currentTabId = await browser.runtime.sendMessage("getCurrentTabId");
    console.log(urlObj.hostname.trim() == "");
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
    console.log("add");
    const _ = await browser.runtime.sendMessage("addItem");
    console.log(_);
    await isURLExist();
});
removeButton.addEventListener("click", async () => {
    console.log("remove");
    const _ = await browser.runtime.sendMessage("removeItem");
    console.log(_);
    await isURLExist();
});
addTab.addEventListener("click", async () => {
    console.log("addTab");
    const _ = await browser.runtime.sendMessage("addTab");
    console.log(_);
    await isTabExist();
});
removeTab.addEventListener("click", async () => {
    console.log("removeTab");
    const _ = await browser.runtime.sendMessage("removeTab");
    console.log(_);
    await isTabExist();
});
optionPage.addEventListener("click", async () => {
    console.log("optionPage");
    await browser.runtime.openOptionsPage();
});
//# sourceMappingURL=script.js.map